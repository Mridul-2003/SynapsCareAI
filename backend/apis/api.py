import asyncio
import socketio
import boto3
from fastapi import FastAPI
from amazon_transcribe.client import TranscribeStreamingClient
from amazon_transcribe.handlers import TranscriptResultStreamHandler
from amazon_transcribe.model import TranscriptEvent
from awscrt.auth import AwsCredentialsProvider
from amazon_transcribe.auth import AwsCrtCredentialResolver
from dotenv import load_dotenv
import os
import datetime
load_dotenv()
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY")
AWS_REGION = "us-east-1"
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
                except:
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
            await stream.input_stream.send_audio_event(data)
    except Exception as e:
        print("Audio error:", e)

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

    if sid in active_streams:
        stream = active_streams[sid]["stream"]

        try:
            await stream.input_stream.end_stream()
        except:
            pass

        try:
            active_streams[sid]["handler_task"].cancel()
        except:
            pass

        del active_streams[sid]

        print("AWS stream closed safely.")