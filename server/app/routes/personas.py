from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Persona
from app.schemas import PersonaOut

router = APIRouter(prefix="/personas", tags=["personas"])


@router.get("", response_model=list[PersonaOut])
def list_personas(db: Session = Depends(get_db)) -> list[PersonaOut]:
    personas = db.scalars(select(Persona).order_by(Persona.name.asc())).all()
    return [PersonaOut.model_validate(persona, from_attributes=True) for persona in personas]
