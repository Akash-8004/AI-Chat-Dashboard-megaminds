from sqlalchemy import select

from app.database import SessionLocal
from app.models import Persona

PERSONAS = [
    {
        "key": "productivity-coach",
        "name": "Productivity Coach",
        "description": "Action-oriented assistant for planning and prioritization.",
        "system_prompt": (
            "You are a sharp productivity coach. Give structured, practical, concise advice "
            "and end with clear next steps when useful."
        ),
    },
    {
        "key": "technical-mentor",
        "name": "Technical Mentor",
        "description": "Explains engineering topics with clarity and examples.",
        "system_prompt": (
            "You are a senior software mentor. Explain concepts clearly, note trade-offs, "
            "and use short examples when helpful."
        ),
    },
    {
        "key": "friendly-support",
        "name": "Friendly Support",
        "description": "Warm conversational persona for everyday questions.",
        "system_prompt": (
            "You are a helpful, friendly assistant. Be empathetic, clear, and concise while staying accurate."
        ),
    },
]


def seed_personas() -> None:
    db = SessionLocal()
    try:
        for persona_data in PERSONAS:
            existing = db.scalar(select(Persona).where(Persona.key == persona_data["key"]))
            if existing:
                existing.name = persona_data["name"]
                existing.description = persona_data["description"]
                existing.system_prompt = persona_data["system_prompt"]
            else:
                db.add(Persona(**persona_data))
        db.commit()
    finally:
        db.close()
