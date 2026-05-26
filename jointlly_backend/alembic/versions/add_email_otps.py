"""add email_otps table for OTP verification

Revision ID: add_email_otps
Revises: add_email_verification_default
Create Date: 2026-03-17

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "add_email_otps"
down_revision = "add_email_verification_default"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "email_otps",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("user_id", sa.String(32), nullable=False, index=True),
        sa.Column("email", sa.String(255), nullable=False, index=True),
        sa.Column("purpose", sa.String(50), nullable=False, index=True),
        sa.Column("otp_hash", sa.String(128), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False, index=True),
        sa.Column("attempts", sa.String(10), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table("email_otps")

