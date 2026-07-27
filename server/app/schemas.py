from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_serializer


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    email: str
    display_name: str = Field(serialization_alias="displayName")


class AuthResponse(BaseModel):
    token: str
    user: UserOut


class RegisterRequest(BaseModel):
    display_name: str = Field(alias="displayName", min_length=2, max_length=40)
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)

    model_config = ConfigDict(populate_by_name=True)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)


class PersonaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    key: str
    name: str
    description: str


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    role: Literal["user", "assistant"]
    content: str
    created_at: datetime = Field(serialization_alias="createdAt")

    @field_serializer("created_at", when_used="json")
    def serialize_created_at(self, value: datetime) -> str:
        return value.isoformat()


class ConversationSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    title: str
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")
    persona: PersonaOut
    first_message_preview: str = Field(default="", serialization_alias="firstMessagePreview")

    @field_serializer("created_at", "updated_at", when_used="json")
    def serialize_dates(self, value: datetime) -> str:
        return value.isoformat()


class ConversationDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    title: str
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")
    persona: PersonaOut
    messages: list[MessageOut]

    @field_serializer("created_at", "updated_at", when_used="json")
    def serialize_dates(self, value: datetime) -> str:
        return value.isoformat()


class CreateConversationRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=80)
    persona_id: str = Field(alias="personaId", min_length=1)

    model_config = ConfigDict(populate_by_name=True)


class SendMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=4000)


class SendMessageResponse(BaseModel):
    user_message: MessageOut = Field(serialization_alias="userMessage")
    assistant_message: MessageOut = Field(serialization_alias="assistantMessage")

    model_config = ConfigDict(populate_by_name=True)
