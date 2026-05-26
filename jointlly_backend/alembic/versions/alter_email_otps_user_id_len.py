"""widen email_otps.user_id to 36 chars

Revision ID: alter_email_otps_user_id_len
Revises: add_email_otps
Create Date: 2026-03-17

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "alter_email_otps_user_id_len"
down_revision = "add_email_otps"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        "email_otps",
        "user_id",
        existing_type=sa.String(length=32),
        type_=sa.String(length=36),
        nullable=False,
    )


def downgrade():
    op.alter_column(
        "email_otps",
        "user_id",
        existing_type=sa.String(length=36),
        type_=sa.String(length=32),
        nullable=False,
    )

