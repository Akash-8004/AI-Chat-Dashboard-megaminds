from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routes import auth, conversations, personas
from app.seed_data import seed_personas

app = FastAPI(title="Megaminds AI Chat Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router, prefix="/api")
app.include_router(personas.router, prefix="/api")
app.include_router(conversations.router, prefix="/api")


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    seed_personas()


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Megaminds AI Chat Dashboard API is live", "status": "ok"}


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

