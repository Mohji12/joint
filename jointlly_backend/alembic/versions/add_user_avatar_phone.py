"""add avatar_url and phone to users

Revision ID: add_user_avatar_phone
Revises: add_form_submissions
Create Date: 2026-02-21

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

revision = "add_user_avatar_phone"
down_revision = "add_form_submissions"
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
    return False


def upgrade():
    conn = op.get_bind()
    if not _column_exists(conn, "users", "avatar_url"):
        op.add_column("users", sa.Column("avatar_url", sa.String(500), nullable=True))
    if not _column_exists(conn, "users", "phone"):
        op.add_column("users", sa.Column("phone", sa.String(20), nullable=True))


def downgrade():
    op.drop_column("users", "phone")
    op.drop_column("users", "avatar_url")
