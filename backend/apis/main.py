from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apis.soap import router as soap_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(soap_router)