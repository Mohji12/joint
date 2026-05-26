"""ensure form_submissions table exists (MySQL-compatible)

Revision ID: ensure_form_sub
Revises: add_matching_algo
Create Date: 2026-03-08

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "ensure_form_sub"
down_revision = "add_matching_algo"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    insp = inspect(bind)
    if "form_submissions" in insp.get_table_names():
        return
    # Match users.id type: MySQL often stores UUID as CHAR(32). No FK to avoid type mismatch across envs.
    op.create_table(
        "form_submissions",
        sa.Column("id", sa.CHAR(32), primary_key=True),
        sa.Column("user_id", sa.CHAR(32), nullable=True, index=True),
        sa.Column("form_type", sa.String(50), nullable=False, index=True),
        sa.Column("side", sa.String(20), nullable=False, index=True),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table("form_submissions")
