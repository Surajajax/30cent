"""add user id to plaid items

Revision ID: ca74afd4f472
Revises: 223befa28a9e
Create Date: 2026-09-24
"""

from alembic import op
import sqlalchemy as sa


revision = "ca74afd4f472"
down_revision = "223befa28a9e"
branch_labels = None
depends_on = None


# Your current Supabase Auth user ID
USER_ID = "cc9e830a-3e96-4b2b-8b3d-968654486d5e"


def upgrade():
    # 1. Add the column temporarily as nullable
    op.add_column(
        "plaid_items",
        sa.Column(
            "user_id",
            sa.String(length=255),
            nullable=True,
        ),
    )

    # 2. Assign the existing Plaid row to your current user
    op.execute(
        sa.text(
            """
            UPDATE plaid_items
            SET user_id = :user_id
            WHERE user_id IS NULL
            """
        ).bindparams(user_id=USER_ID)
    )

    # 3. Now that every existing row has a user_id,
    #    make the column NOT NULL
    op.alter_column(
        "plaid_items",
        "user_id",
        existing_type=sa.String(length=255),
        nullable=False,
    )

    # 4. Add an index for faster user-scoped queries
    op.create_index(
        "ix_plaid_items_user_id",
        "plaid_items",
        ["user_id"],
        unique=False,
    )


def downgrade():
    op.drop_index(
        "ix_plaid_items_user_id",
        table_name="plaid_items",
    )

    op.drop_column(
        "plaid_items",
        "user_id",
    )   