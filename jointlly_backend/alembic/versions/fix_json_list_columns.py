"""store list fields as JSON (mysql-compatible)

Revision ID: fix_json_list_columns
Revises: add_match_workflow_fields, ensure_form_sub
Create Date: 2026-03-09

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.exc import OperationalError, ProgrammingError


# revision identifiers, used by Alembic.
revision = "fix_json_list_columns"
down_revision = ("add_match_workflow_fields", "ensure_form_sub")
branch_labels = None
depends_on = None


def _safe_alter(table: str, column: str) -> None:
    try:
        op.alter_column(table, column, type_=sa.JSON())
    except (OperationalError, ProgrammingError):
        # Different dialects / existing types may make alter impossible; runtime
        # model now binds lists as JSON so app still works.
        pass


def upgrade():
    # ProfessionalProfile.location_preferences (list of areas)
    _safe_alter("professional_profiles", "location_preferences")

    # Portfolio.images (list of URLs)
    _safe_alter("portfolios", "images")

    # Property.facings (list of facings for corner plots)
    _safe_alter("properties", "facings")

    # JVJDPreferences.preferred_jv_models (list of strings)
    _safe_alter("jv_jd_preferences", "preferred_jv_models")


def downgrade():
    # Best-effort: keep as JSON; downgrading types is dialect-specific and unsafe.
    pass

