from pydantic import BaseModel

class SoapNotesRequest(BaseModel):
    consultation_id:str=""
    created_at:str=""