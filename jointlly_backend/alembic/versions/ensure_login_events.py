"""ensure login events table exists

Revision ID: ensure_login_events
Revises: ensure_builder_approval_exports
Create Date: 2026-04-25
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "ensure_login_events"
down_revision = "ensure_builder_approval_exports"
branch_labels = None
depends_on = None


def _has_index(insp, table: str, idx: str) -> bool:
    try:
        return any(i["name"] == idx for i in insp.get_indexes(table))
    except Exception:
        return False


def upgrade():
    bind = op.get_bind()
    insp = inspect(bind)
    existing_tables = set(insp.get_table_names())

    if "login_events" not in existing_tables:
        op.create_table(
            "login_events",
            sa.Column("id", sa.String(length=32), nullable=False),
            sa.Column("user_id", sa.String(length=36), nullable=False),
            sa.Column("email", sa.String(length=255), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_login_events_id", "login_events", ["id"])
        op.create_index("ix_login_events_user_id", "login_events", ["user_id"])
        op.create_index("ix_login_events_email", "login_events", ["email"])
        op.create_index("ix_login_events_created_at", "login_events", ["created_at"])


def downgrade():
    bind = op.get_bind()
    insp = inspect(bind)
    existing_tables = set(insp.get_table_names())
    if "login_events" in existing_tables:
        for idx in (
            "ix_login_events_created_at",
            "ix_login_events_email",
            "ix_login_events_user_id",
            "ix_login_events_id",
        ):
            if _has_index(insp, "login_events", idx):
                op.drop_index(idx, table_name="login_events")
        op.drop_table("login_events")

