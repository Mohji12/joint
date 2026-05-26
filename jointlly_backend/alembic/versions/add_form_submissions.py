"""add form_submissions table

Revision ID: add_form_submissions
Revises: add_name_to_users
Create Date: 2026-02-21

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "add_form_submissions"
down_revision = "add_name_to_users"
branch_labels = None
depends_on = None


def upgrade():
    # Use dialect-neutral types so migration works on both MySQL and PostgreSQL
    op.create_table(
        "form_submissions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("form_type", sa.String(50), nullable=False, index=True),
        sa.Column("side", sa.String(20), nullable=False, index=True),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table("form_submissions")
