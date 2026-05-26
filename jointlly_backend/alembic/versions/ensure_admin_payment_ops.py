"""ensure admin payment ops columns exist (MySQL-compatible)

Revision ID: ensure_admin_payment_ops
Revises: ensure_admin_support_ops
Create Date: 2026-03-25

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "ensure_admin_payment_ops"
down_revision = "ensure_admin_support_ops"
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
    if "transactions" in existing_tables:
        if not _has_column(insp, "transactions", "admin_resolution_status"):
            op.add_column("transactions", sa.Column("admin_resolution_status", sa.String(20), nullable=True))
            op.create_index(
                "ix_transactions_admin_resolution_status",
                "transactions",
                ["admin_resolution_status"],
            )
        if not _has_column(insp, "transactions", "admin_notes"):
            op.add_column("transactions", sa.Column("admin_notes", sa.Text(), nullable=True))


def downgrade():
    bind = op.get_bind()
    insp = inspect(bind)
    existing_tables = set(insp.get_table_names())
    if "transactions" in existing_tables:
        if _has_column(insp, "transactions", "admin_resolution_status"):
            try:
                op.drop_index("ix_transactions_admin_resolution_status", table_name="transactions")
            except Exception:
                pass
            op.drop_column("transactions", "admin_resolution_status")
        if _has_column(insp, "transactions", "admin_notes"):
            op.drop_column("transactions", "admin_notes")

