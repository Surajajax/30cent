from datetime import datetime, timezone

from sqlalchemy import select

from app.database import SessionLocal
from app.models import Goal, GoalContribution


DEFAULT_USER_ID = "30cent-demo-user"


def get_goals(user_id: str = DEFAULT_USER_ID):
    """
    Get all financial goals for a user.
    """

    with SessionLocal() as db:
        goals = db.execute(
            select(Goal)
            .where(Goal.user_id == user_id)
            .order_by(Goal.created_at.desc())
        ).scalars().all()

        return [
            {
                "id": goal.id,
                "name": goal.name,
                "description": goal.description,
                "target_amount": goal.target_amount,
                "current_amount": goal.current_amount,
                "target_date": goal.target_date.isoformat(),
                "status": goal.status,
            }
            for goal in goals
        ]


def find_goal_by_name(
    goal_name: str,
    user_id: str = DEFAULT_USER_ID,
):
    """
    Find a user's goal by name.

    Matching is case-insensitive.
    """

    with SessionLocal() as db:
        goals = db.execute(
            select(Goal)
            .where(Goal.user_id == user_id)
        ).scalars().all()

        goal_name_normalized = goal_name.strip().lower()

        for goal in goals:
            if goal.name.strip().lower() == goal_name_normalized:
                return {
                    "id": goal.id,
                    "name": goal.name,
                    "description": goal.description,
                    "target_amount": goal.target_amount,
                    "current_amount": goal.current_amount,
                    "target_date": goal.target_date.isoformat(),
                    "status": goal.status,
                }

        return None


def add_goal_contribution(
    goal_name: str,
    amount: float,
    note: str | None = None,
    user_id: str = DEFAULT_USER_ID,
):
    """
    Add money to a user's financial goal.

    Validates:
    - goal exists
    - amount is positive
    - goal is not completed
    - contribution does not exceed remaining amount

    Updates:
    - goal current_amount
    - goal status
    - contribution history
    """

    if amount <= 0:
        raise ValueError(
            "Contribution amount must be greater than zero."
        )

    with SessionLocal() as db:
        goals = db.execute(
            select(Goal)
            .where(Goal.user_id == user_id)
        ).scalars().all()

        goal_name_normalized = goal_name.strip().lower()

        goal = None

        for candidate in goals:
            if (
                candidate.name.strip().lower()
                == goal_name_normalized
            ):
                goal = candidate
                break

        if goal is None:
            raise ValueError(
                f"Goal '{goal_name}' was not found."
            )

        if goal.status == "completed":
            raise ValueError(
                f"Goal '{goal.name}' is already completed."
            )

        remaining = (
            goal.target_amount -
            goal.current_amount
        )

        if amount > remaining:
            raise ValueError(
                f"Contribution exceeds the remaining "
                f"amount of {remaining:.2f}."
            )

        # Add contribution history
        contribution = GoalContribution(
            goal_id=goal.id,
            amount=amount,
            note=note,
        )

        db.add(contribution)

        # Update goal amount
        goal.current_amount += amount

        # Prevent tiny floating-point leftovers
        if goal.current_amount >= goal.target_amount:
            goal.current_amount = goal.target_amount
            goal.status = "completed"

        goal.updated_at = datetime.now(timezone.utc)

        db.commit()

        db.refresh(goal)
        db.refresh(contribution)

        progress = (
            goal.current_amount /
            goal.target_amount
        ) * 100

        return {
            "goal_id": goal.id,
            "goal_name": goal.name,
            "contribution": amount,
            "current_amount": goal.current_amount,
            "target_amount": goal.target_amount,
            "progress": round(progress, 2),
            "status": goal.status,
            "contribution_id": contribution.id,
        }