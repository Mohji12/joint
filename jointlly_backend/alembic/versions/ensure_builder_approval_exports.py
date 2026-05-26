"""ensure builder approval columns and export history table

Revision ID: ensure_builder_approval_exports
Revises: ensure_admin_payment_ops
Create Date: 2026-04-24
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "ensure_builder_approval_exports"
down_revision = "ensure_admin_payment_ops"
branch_labels = None
depends_on = None


def _has_column(insp, table: str, col: str) -> bool:
    try:
        return any(c["name"] == col for c in insp.get_columns(table))
    except Exception:
        return False


def _has_index(insp, table: str, idx: str) -> bool:
    try:
        return any(i["name"] == idx for i in insp.get_indexes(table))
    except Exception:
        return False


def upgrade():
    bind = op.get_bind()
    insp = inspect(bind)
    existing_tables = set(insp.get_table_names())

    if "professional_profiles" in existing_tables:
        if not _has_column(insp, "professional_profiles", "approval_status"):
            op.add_column(
                "professional_profiles",
                sa.Column("approval_status", sa.String(20), nullable=False, server_default="PENDING"),
            )
            op.create_index(
                "ix_professional_profiles_approval_status",
                "professional_profiles",
                ["approval_status"],
            )
            op.execute("UPDATE professional_profiles SET approval_status='PENDING' WHERE approval_status IS NULL")
            op.alter_column("professional_profiles", "approval_status", server_default=None)
        if not _has_column(insp, "professional_profiles", "approval_note"):
            op.add_column("professional_profiles", sa.Column("approval_note", sa.Text(), nullable=True))
        if not _has_column(insp, "professional_profiles", "approved_by_admin_user_id"):
            op.add_column(
                "professional_profiles",
                sa.Column("approved_by_admin_user_id", sa.String(length=32), nullable=True),
            )
            op.create_index(
                "ix_professional_profiles_approved_by_admin_user_id",
                "professional_profiles",
                ["approved_by_admin_user_id"],
            )
        if not _has_column(insp, "professional_profiles", "approved_at"):
            op.add_column("professional_profiles", sa.Column("approved_at", sa.DateTime(), nullable=True))
        if not _has_column(insp, "professional_profiles", "rejected_at"):
            op.add_column("professional_profiles", sa.Column("rejected_at", sa.DateTime(), nullable=True))

    if "admin_builder_exports" not in existing_tables:
        op.create_table(
            "admin_builder_exports",
            sa.Column("id", sa.String(length=32), nullable=False),
            sa.Column("scope", sa.String(length=20), nullable=False),
            sa.Column("builder_id", sa.String(length=36), nullable=True),
            sa.Column("generated_by", sa.String(length=32), nullable=False),
            sa.Column("file_url_or_path", sa.String(length=500), nullable=False),
            sa.Column("row_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_admin_builder_exports_id", "admin_builder_exports", ["id"])
        op.create_index("ix_admin_builder_exports_scope", "admin_builder_exports", ["scope"])
        op.create_index("ix_admin_builder_exports_builder_id", "admin_builder_exports", ["builder_id"])
        op.create_index("ix_admin_builder_exports_generated_by", "admin_builder_exports", ["generated_by"])
        op.create_index("ix_admin_builder_exports_created_at", "admin_builder_exports", ["created_at"])
        op.alter_column("admin_builder_exports", "row_count", server_default=None)


def downgrade():
    bind = op.get_bind()
    insp = inspect(bind)
    existing_tables = set(insp.get_table_names())

    if "admin_builder_exports" in existing_tables:
        for idx in (
            "ix_admin_builder_exports_created_at",
            "ix_admin_builder_exports_generated_by",
            "ix_admin_builder_exports_builder_id",
            "ix_admin_builder_exports_scope",
            "ix_admin_builder_exports_id",
        ):
            if _has_index(insp, "admin_builder_exports", idx):
                op.drop_index(idx, table_name="admin_builder_exports")
        op.drop_table("admin_builder_exports")

    if "professional_profiles" in existing_tables:
        if _has_column(insp, "professional_profiles", "rejected_at"):
            op.drop_column("professional_profiles", "rejected_at")
        if _has_column(insp, "professional_profiles", "approved_at"):
            op.drop_column("professional_profiles", "approved_at")
        if _has_column(insp, "professional_profiles", "approved_by_admin_user_id"):
            if _has_index(insp, "professional_profiles", "ix_professional_profiles_approved_by_admin_user_id"):
                op.drop_index("ix_professional_profiles_approved_by_admin_user_id", table_name="professional_profiles")
            op.drop_column("professional_profiles", "approved_by_admin_user_id")
        if _has_column(insp, "professional_profiles", "approval_note"):
            op.drop_column("professional_profiles", "approval_note")
        if _has_column(insp, "professional_profiles", "approval_status"):
            if _has_index(insp, "professional_profiles", "ix_professional_profiles_approval_status"):
                op.drop_index("ix_professional_profiles_approval_status", table_name="professional_profiles")
            op.drop_column("professional_profiles", "approval_status")
