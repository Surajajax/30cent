from datetime import datetime, timezone

from sqlalchemy import select

from app.database import SessionLocal
from app.models import UserProfile


DEFAULT_USER_ID = "30cent-demo-user"


def get_user_profile(
    user_id: str = DEFAULT_USER_ID,
):
    """
    Get the permanent profile for a user.
    Creates an empty profile if one does not exist.
    """

    with SessionLocal() as db:
        profile = db.execute(
            select(UserProfile).where(
                UserProfile.user_id == user_id
            )
        ).scalar_one_or_none()

        if profile is None:
            profile = UserProfile(
                user_id=user_id,
            )

            db.add(profile)
            db.commit()
            db.refresh(profile)

        return {
            "user_id": profile.user_id,
            "name": profile.name,
            "currency": profile.currency,
        }


def update_user_profile(
    user_id: str = DEFAULT_USER_ID,
    name: str | None = None,
    currency: str | None = None,
):
    """
    Update permanent user profile information.
    Only provided values are changed.
    """

    with SessionLocal() as db:
        profile = db.execute(
            select(UserProfile).where(
                UserProfile.user_id == user_id
            )
        ).scalar_one_or_none()

        if profile is None:
            profile = UserProfile(
                user_id=user_id,
            )
            db.add(profile)

        if name is not None:
            profile.name = name.strip()

        if currency is not None:
            profile.currency = currency.strip().upper()

        profile.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(profile)

        return {
            "user_id": profile.user_id,
            "name": profile.name,
            "currency": profile.currency,
        }