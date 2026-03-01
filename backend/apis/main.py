from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apis.soap import router as soap_router

app = FastAPI()

# 🔥 Add CORS HERE
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router AFTER middleware
app.include_router(soap_router)