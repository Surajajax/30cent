from datetime import datetime, timezone

from sqlalchemy import select

from app.database import SessionLocal
from app.models import Conversation, Message


def create_conversation(
    user_id: str,
    title: str | None = None,
) -> int:
    """
    Create a new AI conversation for the authenticated user.
    """

    with SessionLocal() as db:
        conversation = Conversation(
            user_id=user_id,
            title=title,
        )

        db.add(conversation)
        db.commit()
        db.refresh(conversation)

        return conversation.id


def save_message(
    conversation_id: int,
    role: str,
    content: str,
    user_id: str,
) -> int:
    """
    Save a message only if the conversation belongs
    to the authenticated user.
    """

    with SessionLocal() as db:
        conversation = db.execute(
            select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id,
            )
        ).scalar_one_or_none()

        if not conversation:
            raise ValueError(
                "Conversation does not belong to the authenticated user."
            )

        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
        )

        db.add(message)

        conversation.updated_at = datetime.now(
            timezone.utc
        )

        db.commit()
        db.refresh(message)

        return message.id


def get_conversation_messages(
    conversation_id: int,
    user_id: str,
) -> list[dict]:
    """
    Load all messages belonging to the authenticated
    user's conversation.
    """

    with SessionLocal() as db:

        conversation = db.execute(
            select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id,
            )
        ).scalar_one_or_none()

        if not conversation:
            return []

        messages = db.execute(
            select(Message)
            .where(
                Message.conversation_id == conversation_id
            )
            .order_by(
                Message.created_at.asc()
            )
        ).scalars().all()

        return [
            {
                "role": message.role,
                "content": message.content,
            }
            for message in messages
        ]


def get_latest_conversation(
    user_id: str,
) -> dict | None:
    """
    Get the most recently updated conversation
    belonging to the authenticated user.
    """

    with SessionLocal() as db:

        conversation = db.execute(
            select(Conversation)
            .where(
                Conversation.user_id == user_id
            )
            .order_by(
                Conversation.updated_at.desc()
            )
        ).scalars().first()

        if not conversation:
            return None

        messages = get_conversation_messages(
            conversation.id,
            user_id,
        )

        return {
            "id": conversation.id,
            "title": conversation.title,
            "messages": messages,
        }