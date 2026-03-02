import asyncio
import socketio
import logging
import boto3
import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from amazon_transcribe.client import TranscribeStreamingClient
from amazon_transcribe.handlers import TranscriptResultStreamHandler
from amazon_transcribe.model import TranscriptEvent
from dotenv import load_dotenv
import os
import datetime

# =============================
# Load ENV (from backend/.env regardless of CWD)
# =============================
load_dotenv()
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(_BACKEND_DIR, ".env"))

AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY") or ""
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY") or ""
AWS_REGION = (os.getenv("AWS_REGION") or "us-east-1").strip()
DYNAMO_REGION = (os.getenv("DYNAMO_REGION") or "ap-southeast-2").strip()

if AWS_ACCESS_KEY:
    os.environ["AWS_ACCESS_KEY_ID"] = AWS_ACCESS_KEY
if AWS_SECRET_KEY:
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

table = dynamodb.Table(os.environ.get("DYNAMODB_TABLE"))

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

                # ── Store in memory (DynamoDB on recording stop) ──
                if self.sid in active_streams:
                    entry = {
                        "text": transcript_text,
                        "timestamp": timestamp,
                        "speaker": "unknown",
                    }
                    active_streams[self.sid].setdefault("transcript", []).append(entry)


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
# Save consultation to DynamoDB (on stop)
# =============================

def _save_consultation_to_dynamo(sid):
    """Generate UUID, created_at, save transcript to DynamoDB. Returns (consultation_id, created_at) or (None, None)."""
    if sid not in active_streams:
        return None, None
    stream_data = active_streams[sid]
    consultation_id = str(uuid.uuid4())
    created_at = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    transcript = stream_data.get("transcript", [])
    try:
        table.put_item(
            Item={
                "consultationID": consultation_id,
                "createdAt": created_at,
                "status": "completed",
                "transcript": transcript,
            }
        )
        print(f"DynamoDB saved: {consultation_id} | {created_at} | {len(transcript)} entries")
        return consultation_id, created_at
    except Exception as e:
        print("DynamoDB save error:", e)
        return None, None


class ConsultationMetadata(BaseModel):
    created_at: str
    patient_name: str
    doctor_name: str
    patient_dob: str
    soap: dict | None = None
    summary: str | None = None
    diagnoses: list[dict] | None = None
    entities: list[dict] | None = None


@app.post("/consultations/{consultation_id}/metadata")
async def update_consultation_metadata(consultation_id: str, payload: ConsultationMetadata):
    """
    Update a consultation record with patient + SOAP metadata.
    """
    try:
        table.update_item(
            Key={
                "consultationID": consultation_id,
                "createdAt": payload.created_at,
            },
            UpdateExpression=(
                "SET "
                "patientName = :pn, "
                "doctorName = :dn, "
                "patientDob = :dob, "
                "soap = :soap, "
                "summary = :summary, "
                "diagnoses = :diag, "
                "entities = :entities"
            ),
            ExpressionAttributeValues={
                ":pn": payload.patient_name,
                ":dn": payload.doctor_name,
                ":dob": payload.patient_dob,
                ":soap": payload.soap or {},
                ":summary": payload.summary or "",
                ":diag": payload.diagnoses or [],
                ":entities": payload.entities or [],
            },
        )
    except Exception as e:
        print("DynamoDB update error:", e)
        raise HTTPException(status_code=500, detail="Failed to update consultation metadata")

    return {"status": "ok"}


@app.get("/records")
async def list_records(limit: int = 50):
    """
    Return a list of consultation records for the Records page.
    Data is read from the same DynamoDB table used for transcripts.
    """
    try:
        response = table.scan(Limit=limit)
    except Exception as e:
        print("DynamoDB scan error:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch records from DynamoDB")

    items = response.get("Items", [])
    records = []

    for item in items:
        created_at = item.get("createdAt")
        dt = None
        if created_at:
            try:
                dt = datetime.datetime.strptime(created_at, "%Y-%m-%dT%H:%M:%SZ")
            except ValueError:
                dt = None

        if dt:
            date_str = dt.strftime("%Y-%m-%d")
            time_str = dt.strftime("%H:%M")
        else:
            date_str = ""
            time_str = ""

        raw_status = item.get("status", "completed")
        status = "complete" if raw_status == "completed" else raw_status

        records.append(
            {
                "id": item.get("consultationID"),
                "patient": item.get("patientName", "Unknown patient"),
                "date": date_str,
                "time": time_str,
                "status": status,
                "duration": item.get("duration", ""),
                "confidence": item.get("confidence", "—"),
            }
        )

    records.sort(
        key=lambda r: (
            r.get("date") or "",
            r.get("time") or "",
        ),
        reverse=True,
    )

    return {"records": records}


# =============================
# Socket Events
# =============================

@sio.event
async def connect(sid, environ, auth=None):

    print(f"Client connected: {sid}")

    if not AWS_ACCESS_KEY or not AWS_SECRET_KEY:
        print("Connection error: AWS_ACCESS_KEY / AWS_SECRET_KEY missing. Check backend/.env")
        return False
    if not AWS_REGION:
        print("Connection error: AWS_REGION missing or invalid")
        return False

    try:
        # ── Start AWS Transcribe stream (consultation saved on stop) ──
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
            "transcript": [],
        }

        await sio.emit("recording_started", {}, room=sid)
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
# Stop recording (button) → save to DynamoDB, then cleanup
# =============================

@sio.event
async def stop_recording(sid):
    if sid not in active_streams:
        return
    consultation_id, created_at = _save_consultation_to_dynamo(sid)
    await sio.emit(
        "consultation_saved",
        {"consultation_id": consultation_id, "created_at": created_at},
        room=sid,
    )
    await _close_stream_for_sid(sid)


async def _close_stream_for_sid(sid):
    """Cancel handler, end stream, remove from active_streams."""
    if sid not in active_streams:
        return
    stream_data = active_streams.pop(sid)
    stream = stream_data["stream"]
    task = stream_data["handler_task"]
    task.cancel()
    try:
        await asyncio.wait_for(task, timeout=2.0)
    except (asyncio.CancelledError, asyncio.TimeoutError):
        pass
    except Exception as e:
        print("Handler shutdown error:", e)
    try:
        await stream.input_stream.end_stream()
    except Exception:
        pass
    print("AWS stream closed safely")


# =============================
# Disconnect handler
# =============================

@sio.event
async def disconnect(sid):

    print(f"Client disconnected: {sid}")

    if sid not in active_streams:
        return

    # Save consultation to DynamoDB (UUID, created_at, transcript)
    _save_consultation_to_dynamo(sid)

    stream_data = active_streams.pop(sid)
    stream = stream_data["stream"]
    task = stream_data["handler_task"]

    task.cancel()
    try:
        await asyncio.wait_for(task, timeout=2.0)
    except (asyncio.CancelledError, asyncio.TimeoutError):
        pass
    except Exception as e:
        print("Handler shutdown error:", e)

    try:
        await stream.input_stream.end_stream()
    except Exception:
        pass

    print("AWS stream closed safely")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api:socket_app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )