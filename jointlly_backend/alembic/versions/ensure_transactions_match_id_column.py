"""Ensure transactions.match_id exists (MySQL / partial upgrades)

Revision ID: ensure_txn_match_id
Revises: add_marketplace_selection_states
Create Date: 2026-03-19

If add_marketplace_selection_states was marked applied but failed before commit on MySQL,
or the DB was created without this column, this migration adds it idempotently.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID


revision = "ensure_txn_match_id"
down_revision = "add_marketplace_selection_states"
branch_labels = None
depends_on = None


def _column_exists(connection, table: str, column: str) -> bool:
    dialect = connection.dialect.name
    if dialect == "mysql":
        r = connection.execute(
            text(
                "SELECT COUNT(*) FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :t AND COLUMN_NAME = :c"
            ),
            {"t": table, "c": column},
        )
        return r.scalar() > 0
    r = connection.execute(
        text(
            "SELECT COUNT(*) FROM information_schema.columns "
            "WHERE table_schema = current_schema() "
            "AND table_name = :t AND column_name = :c"
        ),
        {"t": table, "c": column},
    )
    return r.scalar() > 0


def upgrade():
    conn = op.get_bind()
    dialect = conn.dialect.name

    if _column_exists(conn, "transactions", "match_id"):
        return

    if dialect == "mysql":
        op.add_column(
            "transactions",
            sa.Column("match_id", sa.String(32), nullable=True),
        )
    else:
        op.add_column(
            "transactions",
            sa.Column("match_id", PG_UUID(as_uuid=True), nullable=True),
        )
    op.create_index(op.f("ix_transactions_match_id"), "transactions", ["match_id"], unique=False)
    op.create_foreign_key(
        "fk_transactions_match_id_matches",
        "transactions",
        "matches",
        ["match_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade():
    # No-op: column may have been created by add_marketplace_selection_states; dropping here
    # would break that revision chain. Use add_marketplace_selection_states downgrade if needed.
    pass
