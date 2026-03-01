import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apis.soap import router as soap_router

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# include soap routes
app.include_router(soap_router)


@app.get("/")
async def root():
    return {"message": "Main server running"}


if __name__ == "__main__":
    uvicorn.run("main:app", port=8001, reload=True)