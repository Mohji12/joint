"""add marketplace selection states and transaction match link

Revision ID: add_marketplace_selection_states
Revises: fix_json_list_columns
Create Date: 2026-03-19
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID


revision = "add_marketplace_selection_states"
down_revision = "fix_json_list_columns"
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


def _add_enum_value_if_missing(enum_name: str, enum_value: str) -> None:
    op.execute(
        sa.text(
            """
            DO $$
            BEGIN
              IF NOT EXISTS (
                SELECT 1
                FROM pg_enum e
                JOIN pg_type t ON e.enumtypid = t.oid
                WHERE t.typname = :enum_name
                  AND e.enumlabel = :enum_value
              ) THEN
                EXECUTE 'ALTER TYPE ' || quote_ident(:enum_name) || ' ADD VALUE ' || quote_literal(:enum_value);
              END IF;
            END
            $$;
            """
        ).bindparams(enum_name=enum_name, enum_value=enum_value)
    )


def upgrade():
    conn = op.get_bind()
    dialect = conn.dialect.name

    if not _column_exists(conn, "transactions", "match_id"):
        # MySQL stores app UUIDs as 32-char hex (no dashes), matching users.id / matches.id
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

    # PostgreSQL-only: native enums; MySQL uses VARCHAR/ENUM handled separately or via ORM
    if dialect == "postgresql":
        _add_enum_value_if_missing("match_status", "LANDOWNER_SELECTED")
        _add_enum_value_if_missing("match_status", "BUILDER_SELECTED_PAID")
        _add_enum_value_if_missing("match_status", "CONNECTED")
        _add_enum_value_if_missing("transaction_type", "BUILDER_MATCH_SELECTION")


def downgrade():
    op.drop_constraint("fk_transactions_match_id_matches", "transactions", type_="foreignkey")
    op.drop_index(op.f("ix_transactions_match_id"), table_name="transactions")
    op.drop_column("transactions", "match_id")
    # Enum values are intentionally left in place for compatibility.
