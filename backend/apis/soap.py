import uvicorn
from services.soap_notes import generate_soap_note
from fastapi import FastAPI
from services.fetch_data import get_transcript_data
from services.schema import SoapNotesRequest

app = FastAPI()

@app.post('/generate_soap_notes')
async def generate_soap_notes(req:SoapNotesRequest):
    consultation_id = req.consultation_id
    created_at = req.created_at
    transcript = get_transcript_data(consultation_id,created_at)
    soap_notes = generate_soap_note(transcript)
    return soap_notes






