"""ensure admin support ops tables/columns exist (MySQL-compatible)

Revision ID: ensure_admin_support_ops
Revises: ensure_support_tables
Create Date: 2026-03-25

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "ensure_admin_support_ops"
down_revision = "ensure_support_tables"
branch_labels = None
depends_on = None


def _has_column(insp, table: str, col: str) -> bool:
    try:
        return any(c["name"] == col for c in insp.get_columns(table))
    except Exception:
        return False


def upgrade():
    bind = op.get_bind()
    insp = inspect(bind)
    existing_tables = set(insp.get_table_names())

    if "support_tickets" in existing_tables:
        if not _has_column(insp, "support_tickets", "assigned_to"):
            op.add_column("support_tickets", sa.Column("assigned_to", sa.String(36), nullable=True))
            op.create_index("ix_support_tickets_assigned_to", "support_tickets", ["assigned_to"])
        if not _has_column(insp, "support_tickets", "admin_notes"):
            op.add_column("support_tickets", sa.Column("admin_notes", sa.Text(), nullable=True))

    if "admin_audit_logs" not in existing_tables:
        op.create_table(
            "admin_audit_logs",
            sa.Column("id", sa.String(32), primary_key=True),
            sa.Column("admin_user_id", sa.String(36), nullable=False, index=True),
            sa.Column("action", sa.String(100), nullable=False, index=True),
            sa.Column("entity_type", sa.String(50), nullable=False, index=True),
            sa.Column("entity_id", sa.String(64), nullable=False, index=True),
            sa.Column("before_json", sa.JSON(), nullable=True),
            sa.Column("after_json", sa.JSON(), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )


def downgrade():
    bind = op.get_bind()
    insp = inspect(bind)
    existing_tables = set(insp.get_table_names())
    if "admin_audit_logs" in existing_tables:
        op.drop_table("admin_audit_logs")

    if "support_tickets" in existing_tables:
        if _has_column(insp, "support_tickets", "assigned_to"):
            try:
                op.drop_index("ix_support_tickets_assigned_to", table_name="support_tickets")
            except Exception:
                pass
            op.drop_column("support_tickets", "assigned_to")
        if _has_column(insp, "support_tickets", "admin_notes"):
            op.drop_column("support_tickets", "admin_notes")

