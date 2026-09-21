from datetime import date

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.database import SessionLocal
from app.models import Goal, GoalContribution


router = APIRouter(
    prefix="/api/goals",
    tags=["Goals"],
)


DEFAULT_USER_ID = "30cent-demo-user"


# ============================================================
# REQUEST MODELS
# ============================================================

class GoalCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    target_amount: float = Field(..., gt=0)
    target_date: date


class GoalUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    target_amount: float | None = Field(
        default=None,
        gt=0,
    )
    target_date: date | None = None
    status: str | None = None


class ContributionCreate(BaseModel):
    amount: float = Field(..., gt=0)
    note: str | None = None


# ============================================================
# GET ALL GOALS
# ============================================================

@router.get("")
def get_goals():
    with SessionLocal() as db:
        goals = db.execute(
            select(Goal)
            .where(
                Goal.user_id == DEFAULT_USER_ID
            )
            .order_by(Goal.created_at.desc())
        ).scalars().all()

        return {
            "success": True,
            "data": [
                {
                    "id": goal.id,
                    "name": goal.name,
                    "description": goal.description,
                    "target_amount": goal.target_amount,
                    "current_amount": goal.current_amount,
                    "target_date": goal.target_date,
                    "status": goal.status,
                }
                for goal in goals
            ],
        }


# ============================================================
# GET SINGLE GOAL
# ============================================================

@router.get("/{goal_id}")
def get_goal(goal_id: int):
    with SessionLocal() as db:
        goal = db.execute(
            select(Goal).where(
                Goal.id == goal_id,
                Goal.user_id == DEFAULT_USER_ID,
            )
        ).scalar_one_or_none()

        if goal is None:
            raise HTTPException(
                status_code=404,
                detail="Goal not found.",
            )

        progress = 0

        if goal.target_amount > 0:
            progress = min(
                round(
                    (
                        goal.current_amount
                        / goal.target_amount
                    ) * 100
                ),
                100,
            )

        return {
            "success": True,
            "data": {
                "id": goal.id,
                "name": goal.name,
                "description": goal.description,
                "target_amount": goal.target_amount,
                "current_amount": goal.current_amount,
                "target_date": goal.target_date,
                "status": goal.status,
                "progress": progress,
            },
        }


# ============================================================
# CREATE GOAL
# ============================================================

@router.post("")
def create_goal(request: GoalCreate):
    with SessionLocal() as db:

        goal = Goal(
            user_id=DEFAULT_USER_ID,
            name=request.name.strip(),
            description=(
                request.description.strip()
                if request.description
                else None
            ),
            target_amount=request.target_amount,
            current_amount=0.0,
            target_date=request.target_date,
            status="active",
        )

        db.add(goal)
        db.commit()
        db.refresh(goal)

        return {
            "success": True,
            "message": "Goal created successfully.",
            "data": {
                "id": goal.id,
                "name": goal.name,
                "description": goal.description,
                "target_amount": goal.target_amount,
                "current_amount": goal.current_amount,
                "target_date": goal.target_date,
                "status": goal.status,
            },
        }


# ============================================================
# UPDATE GOAL
# ============================================================

@router.put("/{goal_id}")
def update_goal(
    goal_id: int,
    request: GoalUpdate,
):
    with SessionLocal() as db:

        goal = db.execute(
            select(Goal).where(
                Goal.id == goal_id,
                Goal.user_id == DEFAULT_USER_ID,
            )
        ).scalar_one_or_none()

        if goal is None:
            raise HTTPException(
                status_code=404,
                detail="Goal not found.",
            )

        if request.name is not None:
            goal.name = request.name.strip()

        if request.description is not None:
            goal.description = request.description.strip()

        if request.target_amount is not None:
            goal.target_amount = request.target_amount

        if request.target_date is not None:
            goal.target_date = request.target_date

        if request.status is not None:
            goal.status = request.status

        db.commit()
        db.refresh(goal)

        return {
            "success": True,
            "message": "Goal updated successfully.",
            "data": {
                "id": goal.id,
                "name": goal.name,
                "description": goal.description,
                "target_amount": goal.target_amount,
                "current_amount": goal.current_amount,
                "target_date": goal.target_date,
                "status": goal.status,
            },
        }


# ============================================================
# DELETE GOAL
# ============================================================

@router.delete("/{goal_id}")
def delete_goal(goal_id: int):
    with SessionLocal() as db:

        goal = db.execute(
            select(Goal).where(
                Goal.id == goal_id,
                Goal.user_id == DEFAULT_USER_ID,
            )
        ).scalar_one_or_none()

        if goal is None:
            raise HTTPException(
                status_code=404,
                detail="Goal not found.",
            )

        db.delete(goal)
        db.commit()

        return {
            "success": True,
            "message": "Goal deleted successfully.",
        }


# ============================================================
# ADD CONTRIBUTION
# ============================================================

@router.post("/{goal_id}/contributions")
def add_contribution(
    goal_id: int,
    request: ContributionCreate,
):
    with SessionLocal() as db:

        goal = db.execute(
            select(Goal).where(
                Goal.id == goal_id,
                Goal.user_id == DEFAULT_USER_ID,
            )
        ).scalar_one_or_none()

        if goal is None:
            raise HTTPException(
                status_code=404,
                detail="Goal not found.",
            )

        if goal.status == "completed":
            raise HTTPException(
                status_code=400,
                detail="This goal is already completed.",
            )

        remaining = (
            goal.target_amount
            - goal.current_amount
        )

        if request.amount > remaining:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Contribution is too large. "
                    f"Only {remaining:.2f} "
                    f"remaining to reach the goal."
                ),
            )

        contribution = GoalContribution(
            goal_id=goal.id,
            amount=request.amount,
            note=(
                request.note.strip()
                if request.note
                else None
            ),
        )

        db.add(contribution)

        goal.current_amount += request.amount

        if goal.current_amount >= goal.target_amount:
            goal.current_amount = goal.target_amount
            goal.status = "completed"

        db.commit()
        db.refresh(goal)
        db.refresh(contribution)

        progress = round(
            (
                goal.current_amount
                / goal.target_amount
            ) * 100
        )

        return {
            "success": True,
            "message": "Contribution added successfully.",
            "data": {
                "goal_id": goal.id,
                "goal_name": goal.name,
                "contribution": contribution.amount,
                "current_amount": goal.current_amount,
                "target_amount": goal.target_amount,
                "progress": progress,
                "status": goal.status,
            },
        }


# ============================================================
# GET CONTRIBUTION HISTORY
# ============================================================

@router.get("/{goal_id}/contributions")
def get_contributions(goal_id: int):
    with SessionLocal() as db:

        goal = db.execute(
            select(Goal).where(
                Goal.id == goal_id,
                Goal.user_id == DEFAULT_USER_ID,
            )
        ).scalar_one_or_none()

        if goal is None:
            raise HTTPException(
                status_code=404,
                detail="Goal not found.",
            )

        contributions = db.execute(
            select(GoalContribution)
            .where(
                GoalContribution.goal_id == goal_id
            )
            .order_by(
                GoalContribution.created_at.desc()
            )
        ).scalars().all()

        return {
            "success": True,
            "goal_id": goal.id,
            "goal_name": goal.name,
            "data": [
                {
                    "id": contribution.id,
                    "amount": contribution.amount,
                    "note": contribution.note,
                    "created_at": contribution.created_at,
                }
                for contribution in contributions
            ],
        }