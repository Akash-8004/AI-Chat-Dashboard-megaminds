from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.deps import get_current_user
from app.database import get_db
from app.models import Conversation, Message, MessageRole, Persona, User
from app.schemas import (
    ConversationDetail,
    ConversationSummary,
    CreateConversationRequest,
    MessageOut,
    SendMessageRequest,
    SendMessageResponse,
)
from app.services.llm import generate_assistant_reply

router = APIRouter(prefix="/conversations", tags=["conversations"])


def _message_out(message: Message) -> MessageOut:
    return MessageOut(
        id=message.id,
        role=message.role.value,
        content=message.content,
        created_at=message.created_at,
    )


@router.get("", response_model=list[ConversationSummary])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ConversationSummary]:
    conversations = db.scalars(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .options(joinedload(Conversation.persona), joinedload(Conversation.messages))
        .order_by(Conversation.updated_at.desc())
    ).unique().all()

    summaries: list[ConversationSummary] = []
    for conversation in conversations:
        first_message = conversation.messages[0].content if conversation.messages else ""
        summaries.append(
            ConversationSummary(
                id=conversation.id,
                title=conversation.title,
                created_at=conversation.created_at,
                updated_at=conversation.updated_at,
                persona=conversation.persona,
                first_message_preview=first_message,
            )
        )
    return summaries


@router.post("", response_model=ConversationDetail, status_code=status.HTTP_201_CREATED)
def create_conversation(
    payload: CreateConversationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConversationDetail:
    persona = db.get(Persona, payload.persona_id)
    if persona is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Persona not found.")

    title = payload.title.strip() if payload.title else f"New {persona.name} chat"
    conversation = Conversation(
        title=title,
        persona_id=persona.id,
        user_id=current_user.id,
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return ConversationDetail(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        persona=persona,
        messages=[],
    )


@router.get("/{conversation_id}/messages", response_model=ConversationDetail)
def get_conversation_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConversationDetail:
    conversation = db.scalar(
        select(Conversation)
        .where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .options(joinedload(Conversation.persona), joinedload(Conversation.messages))
    )
    if conversation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")

    return ConversationDetail(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        persona=conversation.persona,
        messages=[_message_out(message) for message in conversation.messages],
    )


@router.post("/{conversation_id}/messages", response_model=SendMessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    conversation_id: str,
    payload: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SendMessageResponse:
    conversation = db.scalar(
        select(Conversation)
        .where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .options(joinedload(Conversation.persona), joinedload(Conversation.messages))
    )
    if conversation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")

    user_message = Message(
        conversation_id=conversation.id,
        role=MessageRole.user,
        content=payload.content,
    )
    db.add(user_message)
    db.flush()

    llm_messages = [{"role": "system", "content": conversation.persona.system_prompt}]
    for message in conversation.messages:
        llm_messages.append({"role": message.role.value, "content": message.content})
    llm_messages.append({"role": "user", "content": payload.content})

    assistant_content = await generate_assistant_reply(llm_messages)
    assistant_message = Message(
        conversation_id=conversation.id,
        role=MessageRole.assistant,
        content=assistant_content,
    )
    db.add(assistant_message)

    if len(conversation.messages) == 0:
        conversation.title = payload.content[:48]

    conversation.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user_message)
    db.refresh(assistant_message)

    return SendMessageResponse(
        user_message=_message_out(user_message),
        assistant_message=_message_out(assistant_message),
    )
