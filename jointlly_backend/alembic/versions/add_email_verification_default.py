"""set default is_active to false for email verification

Revision ID: add_email_verification_default
Revises: add_user_avatar_phone
Create Date: 2026-02-27

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "add_email_verification_default"
down_revision = "add_user_avatar_phone"
branch_labels = None
depends_on = None


def upgrade():
    # New users should be inactive until they verify their email.
    op.alter_column(
        "users",
        "is_active",
        existing_type=sa.String(length=10),
        nullable=False,
        server_default="false",
    )

    # Ensure all existing users remain active so they are not locked out.
    op.execute("UPDATE users SET is_active = 'true' WHERE is_active IS NULL OR is_active = ''")


def downgrade():
    # Restore previous default for is_active.
    op.alter_column(
        "users",
        "is_active",
        existing_type=sa.String(length=10),
        nullable=False,
        server_default="true",
    )

