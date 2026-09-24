from fastapi import APIRouter, Depends

from app.auth import get_current_user_id


router = APIRouter(
    prefix="/api/auth",
    tags=["Auth"],
)


@router.get("/me")
async def get_current_user(
    user_id: str = Depends(get_current_user_id),
):
    return {
        "authenticated": True,
        "user_id": user_id,
    }