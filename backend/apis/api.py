import asyncio
import socketio
import boto3
from fastapi import FastAPI
from amazon_transcribe.client import TranscribeStreamingClient
from amazon_transcribe.handlers import TranscriptResultStreamHandler
from amazon_transcribe.model import TranscriptEvent
from dotenv import load_dotenv
import os
import datetime
load_dotenv()

AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY")
AWS_REGION = "us-east-1"

# CRT ke liye correct env var names
os.environ["AWS_ACCESS_KEY_ID"] = AWS_ACCESS_KEY
os.environ["AWS_SECRET_ACCESS_KEY"] = AWS_SECRET_KEY
os.environ["AWS_DEFAULT_REGION"] = AWS_REGION

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*"
)

app = FastAPI()
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)
active_streams = {}


class MyEventHandler(TranscriptResultStreamHandler):
    def __init__(self, output_stream, sid):
        super().__init__(output_stream)
        self.sid = sid

    async def handle_transcript_event(self, transcript_event: TranscriptEvent):
        results = transcript_event.transcript.results

        for result in results:
            if not result.is_partial:
                transcript = result.alternatives[0].transcript
                print("Transcript:", transcript)

                try:
                    await sio.emit("transcript", {
                        "text": transcript,
                        "timestamp": datetime.datetime.now().isoformat()
                    }, room=self.sid)
                except Exception:
                    print("Client already disconnected.")


@sio.event
async def connect(sid, environ, auth=None):
    print(f"Client connected: {sid}")

    try:
        client = TranscribeStreamingClient(region=AWS_REGION)

        stream = await client.start_stream_transcription(
            language_code="en-US",
            media_sample_rate_hz=16000,
            media_encoding="pcm"
        )

        handler = MyEventHandler(stream.output_stream, sid)

        active_streams[sid] = {
            "stream": stream,
            "handler_task": asyncio.create_task(handler.handle_events())
        }

        print("Stream started successfully")

    except Exception:
        import traceback
        traceback.print_exc()
        return False


@sio.event
async def audio_chunk(sid, data):
    try:
        if sid in active_streams:
            stream = active_streams[sid]["stream"]
            await stream.input_stream.send_audio_event(audio_chunk=data)
    except Exception as e:
        print("Audio error:", e)


@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

    if sid in active_streams:
        # Pehle dict se hatao taaki audio_chunk race na kare
        stream_data = active_streams.pop(sid)
        stream = stream_data["stream"]

        try:
            await stream.input_stream.end_stream()
        except Exception:
            pass

        task = stream_data["handler_task"]
        task.cancel()
        try:
            await asyncio.wait_for(asyncio.shield(task), timeout=1.0)
        except (asyncio.CancelledError, asyncio.TimeoutError, Exception):
            pass

        print("AWS stream closed safely.")