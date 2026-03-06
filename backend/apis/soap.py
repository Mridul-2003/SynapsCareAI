from fastapi import APIRouter, HTTPException
from services.soap_notes import generate_soap_note
from services.fetch_data import get_transcript_data
from services.schema import SoapNotesRequest

router = APIRouter()
@router.post("/generate_soap_notes")
async def generate_soap_notes(req: SoapNotesRequest):
    consultation_id = req.consultation_id
    created_at = req.created_at

    try:
        transcript,total_duration = get_transcript_data(consultation_id, created_at)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    try:
        result = generate_soap_note(transcript)
    except Exception as e:
        err_msg = str(e)
        if "getaddrinfo failed" in err_msg or "EndpointConnectionError" in err_msg or "Could not connect" in err_msg:
            detail = "Unable to connect to AWS Bedrock. Please check your internet/VPN connection or ensure firewall access is allowed for: bedrock-runtime.us-east-1.amazonaws.com"
        else:
            detail = f"SOAP generate fail: {err_msg}"
        # Return 200 with error so frontend can show message (no 503 in UI)
        return {
            "status": "error",
            "error": detail,
            "soap": {
                "subjective": None,
                "objective": None,
                "assessment": None,
                "plan": None,
            },
            "summary": None,
            "entities": [],
            "diagnoses": [],
        }

    soap_raw = result.get("soap") if isinstance(result, dict) else {}
    if not soap_raw:
        soap_raw = {}
    # Normalize keys to lowercase (model may return "Subjective", "Objective", etc.)
    soap = {}
    for key in ("subjective", "objective", "assessment", "plan"):
        val = soap_raw.get(key) or soap_raw.get(key.capitalize())
        if val and isinstance(val, str):
            soap[key] = val
        else:
            soap[key] = None

    summary = result.get("summary") if isinstance(result, dict) else None
    if summary and not isinstance(summary, str):
        summary = str(summary)

    return {
        "status": "success",
        "soap": soap,
        "soap_confidence": result.get("soap_confidence", {}) if isinstance(result, dict) else {},
        "total_duration": total_duration,
        "summary": summary or None,
        "entities": result.get("entities", []) if isinstance(result, dict) else [],
        "diagnoses": result.get("diagnoses", []) if isinstance(result, dict) else [],
    }