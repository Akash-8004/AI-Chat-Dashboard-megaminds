import logging

from openai import OpenAI

from app.config import settings

ChatMessage = dict[str, str]

logger = logging.getLogger(__name__)


def _build_mock_reply(messages: list[ChatMessage]) -> str:
    last_user = next((message["content"] for message in reversed(messages) if message["role"] == "user"), None)
    system = next((message["content"] for message in messages if message["role"] == "system"), None)
    prompt_context = f"Persona context: {system}" if system else "Persona context unavailable."

    return "\n\n".join(
        [
            "Mock response mode is active because no real LLM API key is configured.",
            prompt_context,
            f"You said: {last_user or 'No user message provided.'}",
            "Configure GROQ_API_KEY or OPENAI_API_KEY in server/.env to enable real AI responses.",
        ]
    )


async def generate_assistant_reply(messages: list[ChatMessage]) -> str:
    provider = settings.llm_provider.lower().strip()

    groq_key = settings.groq_api_key or (settings.openai_api_key if settings.openai_api_key.startswith("gsk_") else "")
    openai_key = settings.openai_api_key if not settings.openai_api_key.startswith("gsk_") else ""

    if (provider in ("groq", "auto", "") and groq_key) or (provider != "mock" and groq_key and not openai_key):
        try:
            client = OpenAI(
                api_key=groq_key,
                base_url="https://api.groq.com/openai/v1",
            )
            formatted_messages = [{"role": msg["role"], "content": msg["content"]} for msg in messages]
            response = client.chat.completions.create(
                model=settings.groq_model or "llama-3.3-70b-versatile",
                messages=formatted_messages,
                temperature=0.7,
            )
            if response.choices and response.choices[0].message.content:
                return response.choices[0].message.content
        except Exception as err:
            logger.error("Groq API error: %s", err)
            return f"Error communicating with Groq AI API: {str(err)}"

    elif (provider in ("openai", "auto") and openai_key):
        try:
            client = OpenAI(api_key=openai_key)
            formatted_messages = [{"role": msg["role"], "content": msg["content"]} for msg in messages]
            response = client.chat.completions.create(
                model=settings.openai_model or "gpt-4o-mini",
                messages=formatted_messages,
                temperature=0.7,
            )
            if response.choices and response.choices[0].message.content:
                return response.choices[0].message.content
        except Exception as err:
            logger.error("OpenAI API error: %s", err)
            return f"Error communicating with OpenAI API: {str(err)}"

    return _build_mock_reply(messages)

