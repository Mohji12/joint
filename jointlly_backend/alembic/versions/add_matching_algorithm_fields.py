"""add matching algorithm fields (lat/long, asset_class, budget_tier, match scores, etc.)

Revision ID: add_matching_algo
Revises: add_form_submissions
Create Date: 2026-02-25

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.exc import OperationalError, ProgrammingError

revision = "add_matching_algo"
down_revision = "add_form_submissions"
branch_labels = None
depends_on = None


def _run(callback):
    """Run a migration step; skip if table/column missing or already exists."""
    try:
        callback()
    except (ProgrammingError, OperationalError):
        pass


def upgrade():
    conn = op.get_bind()

    # Property: optional lat/long for geospatial matching
    def prop_cols():
        op.add_column("properties", sa.Column("latitude", sa.Float(), nullable=True))
        op.add_column("properties", sa.Column("longitude", sa.Float(), nullable=True))
    _run(prop_cols)

    # Project: optional asset_class and budget_tier for Tier 1/Tier 2
    def project_cols():
        op.add_column("projects", sa.Column("asset_class", sa.String(50), nullable=True))
        op.add_column("projects", sa.Column("budget_tier", sa.String(20), nullable=True))
        op.create_index(op.f("ix_projects_asset_class"), "projects", ["asset_class"], unique=False)
    _run(project_cols)

    # LocationPreference (builder hubs): optional lat/long — skip if table missing
    def loc_pref():
        op.add_column("location_preferences", sa.Column("latitude", sa.Float(), nullable=True))
        op.add_column("location_preferences", sa.Column("longitude", sa.Float(), nullable=True))
    _run(loc_pref)

    # ProfessionalProfile: current_bandwidth for timeline matching
    def prof_bandwidth():
        op.add_column("professional_profiles", sa.Column("current_bandwidth", sa.String(50), nullable=True))
    _run(prof_bandwidth)

    # Match: optional estimated_cost
    def match_cost():
        op.add_column("matches", sa.Column("estimated_cost", sa.Float(), nullable=True))
    _run(match_cost)

    # MatchScore: proximity_score, response_speed_score for trust formula
    def match_scores():
        op.add_column("match_scores", sa.Column("proximity_score", sa.Float(), nullable=True))
        op.add_column("match_scores", sa.Column("response_speed_score", sa.Float(), nullable=True))
    _run(match_scores)


def downgrade():
    op.drop_column("match_scores", "response_speed_score")
    op.drop_column("match_scores", "proximity_score")
    op.drop_column("matches", "estimated_cost")
    op.drop_column("professional_profiles", "current_bandwidth")
    op.drop_column("location_preferences", "longitude")
    op.drop_column("location_preferences", "latitude")
    op.drop_index(op.f("ix_projects_asset_class"), table_name="projects")
    op.drop_column("projects", "budget_tier")
    op.drop_column("projects", "asset_class")
    op.drop_column("properties", "longitude")
    op.drop_column("properties", "latitude")
