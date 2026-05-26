"""ensure support chatbot tables exist (MySQL-compatible)

Revision ID: ensure_support_tables
Revises: ensure_txn_match_id
Create Date: 2026-03-25

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "ensure_support_tables"
down_revision = "ensure_txn_match_id"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    insp = inspect(bind)
    existing = set(insp.get_table_names())

    if "support_articles" not in existing:
        op.create_table(
            "support_articles",
            sa.Column("id", sa.String(32), primary_key=True),
            sa.Column("title", sa.String(255), nullable=False, index=True),
            sa.Column("slug", sa.String(255), nullable=False, unique=True, index=True),
            sa.Column("audience", sa.String(20), nullable=False, index=True, server_default="all"),
            sa.Column("category", sa.String(50), nullable=False, index=True, server_default="general"),
            sa.Column("keywords", sa.JSON(), nullable=False),
            sa.Column("content_md", sa.Text(), nullable=False),
            sa.Column("steps_json", sa.JSON(), nullable=True),
            sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true(), index=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )

    if "support_flows" not in existing:
        op.create_table(
            "support_flows",
            sa.Column("id", sa.String(32), primary_key=True),
            sa.Column("name", sa.String(255), nullable=False, index=True),
            sa.Column("audience", sa.String(20), nullable=False, index=True, server_default="all"),
            sa.Column("trigger_keywords", sa.JSON(), nullable=False),
            sa.Column("nodes_json", sa.JSON(), nullable=False),
            sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true(), index=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )

    if "support_tickets" not in existing:
        op.create_table(
            "support_tickets",
            sa.Column("id", sa.String(32), primary_key=True),
            sa.Column("user_id", sa.String(36), nullable=True, index=True),
            sa.Column("role", sa.String(20), nullable=True, index=True),
            sa.Column("route", sa.String(255), nullable=True, index=True),
            sa.Column("subject", sa.String(255), nullable=False, index=True),
            sa.Column("description", sa.Text(), nullable=False),
            sa.Column("status", sa.String(20), nullable=False, index=True, server_default="open"),
            sa.Column("metadata_json", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )


def downgrade():
    # Safe drops (if present)
    bind = op.get_bind()
    insp = inspect(bind)
    existing = set(insp.get_table_names())
    if "support_tickets" in existing:
        op.drop_table("support_tickets")
    if "support_flows" in existing:
        op.drop_table("support_flows")
    if "support_articles" in existing:
        op.drop_table("support_articles")

