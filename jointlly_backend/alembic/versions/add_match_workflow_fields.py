"""add workflow fields to matches

Revision ID: add_match_workflow_fields
Revises: add_email_verification_default
Create Date: 2026-02-27

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "add_match_workflow_fields"
down_revision = "add_email_verification_default"
branch_labels = None
depends_on = None


def upgrade():
    # New boolean flags and timestamps for mutual interest & monitoring
    op.add_column("matches", sa.Column("express_interest_landowner", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.add_column("matches", sa.Column("express_interest_builder", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.add_column("matches", sa.Column("mutual_interest_at", sa.DateTime(), nullable=True))
    op.add_column("matches", sa.Column("gatekeeper_unlocked_at", sa.DateTime(), nullable=True))
    op.add_column("matches", sa.Column("t7_email_sent_at", sa.DateTime(), nullable=True))
    op.add_column("matches", sa.Column("t30_email_sent_at", sa.DateTime(), nullable=True))
    # Deal & success fee fields
    op.add_column("matches", sa.Column("deal_value", sa.Float(), nullable=True))
    op.add_column("matches", sa.Column("deal_status", sa.String(length=50), nullable=True))
    op.add_column("matches", sa.Column("success_fee_percent", sa.Float(), nullable=True))
    op.add_column("matches", sa.Column("success_fee_amount_total", sa.Float(), nullable=True))
    op.add_column("matches", sa.Column("success_fee_amount_builder", sa.Float(), nullable=True))
    op.add_column("matches", sa.Column("success_fee_amount_landowner", sa.Float(), nullable=True))

    # Remove server_default from new boolean columns to avoid affecting ORM defaults
    op.alter_column("matches", "express_interest_landowner", server_default=None)
    op.alter_column("matches", "express_interest_builder", server_default=None)


def downgrade():
    op.drop_column("matches", "success_fee_amount_landowner")
    op.drop_column("matches", "success_fee_amount_builder")
    op.drop_column("matches", "success_fee_amount_total")
    op.drop_column("matches", "success_fee_percent")
    op.drop_column("matches", "deal_status")
    op.drop_column("matches", "deal_value")
    op.drop_column("matches", "t30_email_sent_at")
    op.drop_column("matches", "t7_email_sent_at")
    op.drop_column("matches", "gatekeeper_unlocked_at")
    op.drop_column("matches", "mutual_interest_at")
    op.drop_column("matches", "express_interest_builder")
    op.drop_column("matches", "express_interest_landowner")

