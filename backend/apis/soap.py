from fastapi import APIRouter
from services.soap_notes import generate_soap_note
from services.fetch_data import get_transcript_data
from services.schema import SoapNotesRequest

router = APIRouter()


@router.post("/generate_soap_notes")
async def generate_soap_notes(req: SoapNotesRequest):
    consultation_id = req.consultation_id
    created_at = req.created_at

    transcript = get_transcript_data(consultation_id, created_at)

    soap_notes = generate_soap_note(transcript)

    return {
        "status": "success",
        "soap_notes": soap_notes
    }