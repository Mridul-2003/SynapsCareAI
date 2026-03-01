import asyncio
import socketio
import logging
import boto3
import uuid
from fastapi import FastAPI
from amazon_transcribe.client import TranscribeStreamingClient
from amazon_transcribe.handlers import TranscriptResultStreamHandler
from amazon_transcribe.model import TranscriptEvent
from dotenv import load_dotenv
import os
import datetime

# =============================
# Load ENV
# =============================

load_dotenv()

AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY")
AWS_REGION = "us-east-1"
DYNAMO_REGION = "ap-southeast-2"

os.environ["AWS_ACCESS_KEY_ID"] = AWS_ACCESS_KEY
os.environ["AWS_SECRET_ACCESS_KEY"] = AWS_SECRET_KEY
os.environ["AWS_DEFAULT_REGION"] = AWS_REGION

logging.getLogger("amazon_transcribe").setLevel(logging.CRITICAL)

# =============================
# DynamoDB Setup
# =============================

dynamodb = boto3.resource(
    "dynamodb",
    region_name=DYNAMO_REGION,
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
)

table = dynamodb.Table(os.environ["DYNAMODB_TABLE"])

# =============================
# Socket.IO + FastAPI Setup
# =============================

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    ping_timeout=30,
    ping_interval=10,
)

app = FastAPI()

socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

# =============================
# Active streams storage
# =============================

active_streams = {}

# =============================
# Transcript Handler
# =============================

class MyEventHandler(TranscriptResultStreamHandler):

    def __init__(self, output_stream, sid):
        super().__init__(output_stream)
        self.sid = sid

    async def handle_transcript_event(self, transcript_event: TranscriptEvent):

        results = transcript_event.transcript.results

        for result in results:

            if not result.is_partial:

                transcript_text = result.alternatives[0].transcript
                timestamp = datetime.datetime.now().isoformat()

                print("Transcript:", transcript_text)

                # ── Emit to frontend ──
                try:
                    await sio.emit(
                        "transcript",
                        {"text": transcript_text, "timestamp": timestamp},
                        room=self.sid,
                    )
                except Exception:
                    print("Client already disconnected")

                # ── Store in DynamoDB ──
                if self.sid in active_streams:
                    stream_data = active_streams[self.sid]
                    consultation_id = stream_data["consultation_id"]
                    created_at = stream_data["created_at"]

                    try:
                        # Append transcript entry to the list
                        table.update_item(
                            Key={
                                "consultationID": consultation_id,
                                "createdAt": created_at,
                            },
                            UpdateExpression=(
                                "SET #t = list_append(if_not_exists(#t, :empty), :new_entry)"
                            ),
                            ExpressionAttributeNames={"#t": "transcript"},
                            ExpressionAttributeValues={
                                ":new_entry": [
                                    {
                                        "text": transcript_text,
                                        "timestamp": timestamp,
                                        "speaker": "unknown",
                                    }
                                ],
                                ":empty": [],
                            },
                        )
                    except Exception as e:
                        print("DynamoDB transcript append error:", e)


# =============================
# Safe handler wrapper
# =============================

async def safe_handle_events(handler):
    try:
        await handler.handle_events()
    except asyncio.CancelledError:
        print("Handler cancelled safely")
    except Exception as e:
        print("Handler error:", e)


# =============================
# Socket Events
# =============================

@sio.event
async def connect(sid, environ, auth=None):

    print(f"Client connected: {sid}")

    # Generate consultation ID and timestamp
    consultation_id = "CONS-" + str(uuid.uuid4())[:8].upper()
    created_at = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    try:
        # ── Create DynamoDB entry ──
        table.put_item(
            Item={
                "consultationID": consultation_id,
                "createdAt": created_at,
                "status": "recording",
                "transcript": [],
            }
        )
        print(f"DynamoDB entry created: {consultation_id} / {created_at}")

        # ── Start AWS Transcribe stream ──
        client = TranscribeStreamingClient(region=AWS_REGION)

        stream = await client.start_stream_transcription(
            language_code="en-US",
            media_sample_rate_hz=16000,
            media_encoding="pcm",
        )

        handler = MyEventHandler(stream.output_stream, sid)

        handler_task = asyncio.create_task(safe_handle_events(handler))

        active_streams[sid] = {
            "stream": stream,
            "handler_task": handler_task,
            "consultation_id": consultation_id,
            "created_at": created_at,
        }

        # ── Send consultation info to frontend ──
        await sio.emit(
            "consultation_started",
            {"consultation_id": consultation_id, "created_at": created_at},
            room=sid,
        )

        print("AWS stream started")

    except Exception as e:
        print("Connection error:", e)
        return False


# =============================
# Receive audio from client
# =============================

@sio.event
async def audio_chunk(sid, data):

    if sid not in active_streams:
        return

    stream = active_streams[sid]["stream"]

    try:
        await stream.input_stream.send_audio_event(audio_chunk=data)
    except Exception:
        pass


# =============================
# Disconnect handler
# =============================

@sio.event
async def disconnect(sid):

    print(f"Client disconnected: {sid}")

    if sid not in active_streams:
        return

    stream_data = active_streams.pop(sid)
    stream = stream_data["stream"]
    task = stream_data["handler_task"]
    consultation_id = stream_data["consultation_id"]
    created_at = stream_data["created_at"]

    # Stop handler
    task.cancel()
    try:
        await asyncio.wait_for(task, timeout=2.0)
    except (asyncio.CancelledError, asyncio.TimeoutError):
        pass
    except Exception as e:
        print("Handler shutdown error:", e)

    # Close AWS stream
    try:
        await stream.input_stream.end_stream()
    except Exception:
        pass

    # ── Mark consultation as completed in DynamoDB ──
    try:
        table.update_item(
            Key={"consultationID": consultation_id, "createdAt": created_at},
            UpdateExpression="SET #s = :done",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={":done": "completed"},
        )
        print(f"Consultation {consultation_id} marked as completed")
    except Exception as e:
        print("DynamoDB status update error:", e)

    print("AWS stream closed safely")