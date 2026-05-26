# Jointly - Real Estate Collaboration Platform Backend

A production-ready FastAPI backend for a two-sided real-estate collaboration platform connecting Landowners/Property Owners and Professionals (Builders, Developers, Interior Designers, Contractors).

## Features

- **JWT-based Authentication** with role-based access control (LANDOWNER, PROFESSIONAL, ADMIN)
- **Landowner Workflows**: Profile creation, property management, FAR calculation, PID verification, project creation
- **Professional Workflows**: Profile onboarding, capabilities, licenses, portfolio, tier-based pricing
- **FAR & Feasibility Calculations**: Automated calculations based on Bengaluru BBMP rules
- **Scoring-based Matching Engine**: Intelligent matching between projects and professionals
- **Payment Integration**: Razorpay integration for verification, feasibility unlocks, and priority listings
- **Clean Architecture**: Router → Service → Model pattern with no business logic in routers

## Technology Stack

- FastAPI 0.115+
- SQLAlchemy 2.0 (async)
- PostgreSQL (asyncpg)
- Pydantic v2
- Alembic for migrations
- JWT authentication
- Razorpay payments

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Jointly
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Set up database**
   ```bash
   # Create PostgreSQL database
   createdb jointly_db

   # Run migrations
   alembic upgrade head
   ```

6. **Run the application**
   ```bash
   uvicorn app.main:app --reload
   ```

## API Documentation

Once the server is running, access:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
app/
├── api/           # API routers
├── models/        # SQLAlchemy models
├── schemas/       # Pydantic schemas
├── services/      # Business logic
└── utils/         # Utilities
```

## Seed demo builder portfolio (Projects page)

The builder **Account → Projects** UI lists rows from the `portfolios` table (`GET /api/v1/professionals/portfolio`). To insert sample projects for a user who already has a **PROFESSIONAL** account and `professional_profiles` row:

```bash
# From jointlly_backend, venv activated, DATABASE_URL set in .env
python scripts/seed_builder_portfolio_dummy.py your-builder@email.com
```

The script is idempotent (skips if names starting with `JP Demo:` already exist). Use `--force` to insert another batch anyway.

## License

MIT
