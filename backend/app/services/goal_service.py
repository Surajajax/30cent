from datetime import datetime, timezone

from sqlalchemy import select

from app.database import SessionLocal
from app.models import Goal, GoalContribution


DEFAULT_USER_ID = "30cent-demo-user"


# ============================================================
# GET ALL GOALS
# ============================================================

def get_goals(
    user_id: str = DEFAULT_USER_ID,
):
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


# ============================================================
# RESOLVE GOAL
# ============================================================

def resolve_goal(
    goal_name: str,
    user_id: str = DEFAULT_USER_ID,
):
    """
    Resolve a user's goal by name.

    Matching order:
    1. Exact case-insensitive match
    2. Unique partial match

    Examples:

    "Iphone"
        -> Iphone

    "iphone"
        -> Iphone

    "Laptop"
        -> New Laptop

    "new laptop"
        -> New Laptop

    If multiple goals match, a ValueError is raised
    asking the user to clarify.

    If no goal matches, a ValueError is raised.
    """

    if not goal_name or not goal_name.strip():
        raise ValueError(
            "Goal name cannot be empty."
        )

    with SessionLocal() as db:
        goals = db.execute(
            select(Goal)
            .where(Goal.user_id == user_id)
        ).scalars().all()

        query = goal_name.strip().lower()

        # --------------------------------------------------------
        # 1. Exact case-insensitive match
        # --------------------------------------------------------

        for goal in goals:
            if goal.name.strip().lower() == query:
                return goal

        # --------------------------------------------------------
        # 2. Unique partial match
        # --------------------------------------------------------

        matches = [
            goal
            for goal in goals
            if query in goal.name.strip().lower()
        ]

        # Exactly one partial match
        if len(matches) == 1:
            return matches[0]

        # Multiple partial matches
        if len(matches) > 1:
            names = ", ".join(
                goal.name
                for goal in matches
            )

            raise ValueError(
                f"Multiple goals match '{goal_name}': "
                f"{names}. Please specify the goal name."
            )

        # No match
        raise ValueError(
            f"Goal '{goal_name}' was not found."
        )


# ============================================================
# FIND GOAL BY NAME
# ============================================================

def find_goal_by_name(
    goal_name: str,
    user_id: str = DEFAULT_USER_ID,
):
    """
    Find a user's goal by name.

    Supports:
    - exact case-insensitive matching
    - unique partial matching

    Returns None when no goal is found.
    """

    try:
        goal = resolve_goal(
            goal_name=goal_name,
            user_id=user_id,
        )

    except ValueError:
        return None

    return {
        "id": goal.id,
        "name": goal.name,
        "description": goal.description,
        "target_amount": goal.target_amount,
        "current_amount": goal.current_amount,
        "target_date": goal.target_date.isoformat(),
        "status": goal.status,
    }


# ============================================================
# GET GOAL CONTRIBUTIONS
# ============================================================

def get_goal_contributions(
    goal_name: str,
    user_id: str = DEFAULT_USER_ID,
):
    """
    Get contribution history for a user's goal.

    Supports:
    - exact goal name
    - case-insensitive goal name
    - unique partial goal name
    """

    with SessionLocal() as db:
        # --------------------------------------------------------
        # Resolve goal
        # --------------------------------------------------------

        query = goal_name.strip().lower()

        goals = db.execute(
            select(Goal)
            .where(Goal.user_id == user_id)
        ).scalars().all()

        # Exact match first
        goal = None

        for candidate in goals:
            if (
                candidate.name.strip().lower()
                == query
            ):
                goal = candidate
                break

        # Unique partial match
        if goal is None:
            matches = [
                candidate
                for candidate in goals
                if query in candidate.name.strip().lower()
            ]

            if len(matches) == 1:
                goal = matches[0]

            elif len(matches) > 1:
                names = ", ".join(
                    candidate.name
                    for candidate in matches
                )

                raise ValueError(
                    f"Multiple goals match '{goal_name}': "
                    f"{names}. Please specify the goal name."
                )

        # No match
        if goal is None:
            raise ValueError(
                f"Goal '{goal_name}' was not found."
            )

        # --------------------------------------------------------
        # Get contribution history
        # --------------------------------------------------------

        contributions = db.execute(
            select(GoalContribution)
            .where(
                GoalContribution.goal_id == goal.id
            )
            .order_by(
                GoalContribution.created_at.desc()
            )
        ).scalars().all()

        return {
            "goal_id": goal.id,
            "goal_name": goal.name,
            "target_amount": goal.target_amount,
            "current_amount": goal.current_amount,
            "status": goal.status,
            "contributions": [
                {
                    "id": contribution.id,
                    "amount": contribution.amount,
                    "note": contribution.note,
                    "created_at": (
                        contribution.created_at.isoformat()
                        if contribution.created_at
                        else None
                    ),
                }
                for contribution in contributions
            ],
        }


# ============================================================
# ADD GOAL CONTRIBUTION
# ============================================================

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

    Supports:
    - exact goal name
    - case-insensitive goal name
    - unique partial goal name
    """

    # --------------------------------------------------------
    # Validate amount
    # --------------------------------------------------------

    if amount <= 0:
        raise ValueError(
            "Contribution amount must be greater than zero."
        )

    with SessionLocal() as db:

        # --------------------------------------------------------
        # Resolve goal
        # --------------------------------------------------------

        query = goal_name.strip().lower()

        goals = db.execute(
            select(Goal)
            .where(Goal.user_id == user_id)
        ).scalars().all()

        # Exact match first
        goal = None

        for candidate in goals:
            if (
                candidate.name.strip().lower()
                == query
            ):
                goal = candidate
                break

        # Unique partial match
        if goal is None:
            matches = [
                candidate
                for candidate in goals
                if query in candidate.name.strip().lower()
            ]

            if len(matches) == 1:
                goal = matches[0]

            elif len(matches) > 1:
                names = ", ".join(
                    candidate.name
                    for candidate in matches
                )

                raise ValueError(
                    f"Multiple goals match '{goal_name}': "
                    f"{names}. Please specify the goal name."
                )

        # No match
        if goal is None:
            raise ValueError(
                f"Goal '{goal_name}' was not found."
            )

        # --------------------------------------------------------
        # Check completed goal
        # --------------------------------------------------------

        if goal.status == "completed":
            raise ValueError(
                f"Goal '{goal.name}' is already completed."
            )

        # --------------------------------------------------------
        # Calculate remaining amount
        # --------------------------------------------------------

        remaining = (
            goal.target_amount
            - goal.current_amount
        )

        # --------------------------------------------------------
        # Prevent contribution above target
        # --------------------------------------------------------

        if amount > remaining:
            raise ValueError(
                f"Contribution exceeds the remaining "
                f"amount of {remaining:.2f}."
            )

        # --------------------------------------------------------
        # Add contribution history
        # --------------------------------------------------------

        contribution = GoalContribution(
            goal_id=goal.id,
            amount=amount,
            note=note,
        )

        db.add(contribution)

        # --------------------------------------------------------
        # Update goal amount
        # --------------------------------------------------------

        goal.current_amount += amount

        # --------------------------------------------------------
        # Complete goal when target is reached
        # --------------------------------------------------------

        if goal.current_amount >= goal.target_amount:
            goal.current_amount = goal.target_amount
            goal.status = "completed"

        # --------------------------------------------------------
        # Update timestamp
        # --------------------------------------------------------

        goal.updated_at = datetime.now(
            timezone.utc
        )

        # --------------------------------------------------------
        # Save changes
        # --------------------------------------------------------

        db.commit()

        db.refresh(goal)
        db.refresh(contribution)

        # --------------------------------------------------------
        # Calculate progress
        # --------------------------------------------------------

        progress = (
            goal.current_amount
            / goal.target_amount
        ) * 100

        # --------------------------------------------------------
        # Return result
        # --------------------------------------------------------

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