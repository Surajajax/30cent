from datetime import datetime, timezone

from sqlalchemy import select

from app.database import SessionLocal
from app.models import Conversation, Message


DEFAULT_USER_ID = "30cent-demo-user"


def create_conversation(
    user_id: str = DEFAULT_USER_ID,
    title: str | None = None,
) -> int:
    """
    Create a new AI conversation.
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
) -> int:
    """
    Save a message to an existing conversation.
    """

    with SessionLocal() as db:
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
        )

        db.add(message)

        conversation = db.get(
            Conversation,
            conversation_id,
        )

        if conversation:
            conversation.updated_at = datetime.now(
                timezone.utc
            )

        db.commit()
        db.refresh(message)

        return message.id


def get_conversation_messages(
    conversation_id: int,
    user_id: str = DEFAULT_USER_ID,
) -> list[dict]:
    """
    Load all messages belonging to a user's conversation.
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
                Message.conversation_id
                == conversation_id
            )
            .order_by(Message.created_at.asc())
        ).scalars().all()

        return [
            {
                "role": message.role,
                "content": message.content,
            }
            for message in messages
        ]