"""
FastAPI application entry point (AWS Lambda Compatible)
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from mangum import Mangum
from app.config import settings
from app.database import close_db
from app.exceptions import (
    AppException,
    app_exception_handler,
    validation_exception_handler,
    general_exception_handler,
    integrity_error_handler,
    runtime_error_handler,
)
from sqlalchemy.exc import IntegrityError
from fastapi.exceptions import RequestValidationError

# Import routers
from app.api.v1 import (
    auth,
    admin,
    landowners,
    professionals,
    projects,
    matching,
    payments,
    uploads,
    forms,
    far,
    marketplace,
    support,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Ensure app email/matching logs appear alongside uvicorn (defaults often hide non-root INFO).
    logging.getLogger("jointlly").setLevel(logging.INFO)
    # Startup logic (if needed)
    yield
    # Shutdown logic
    await close_db()


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Real Estate Collaboration Platform Backend API",
    lifespan=lifespan
)

# CORS: allow every frontend origin (any host and port, e.g. localhost:3000, 8081, 5173, production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(IntegrityError, integrity_error_handler)
app.add_exception_handler(RuntimeError, runtime_error_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(landowners.router, prefix="/api/v1")
app.include_router(professionals.router, prefix="/api/v1")
app.include_router(projects.router, prefix="/api/v1")
app.include_router(matching.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(uploads.router, prefix="/api/v1")
app.include_router(forms.router, prefix="/api/v1")
app.include_router(far.router, prefix="/api/v1")
app.include_router(marketplace.router, prefix="/api/v1")
app.include_router(support.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "message": "Jointly Real Estate Platform API",
        "version": settings.app_version,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Store settings in app state
app.state.settings = settings


# Mangum expects API Gateway REST API (v1) event shape: httpMethod, path, queryStringParameters, etc.
# API Gateway HTTP API (v2, Payload 2.0) uses requestContext.http, rawPath, and may omit some v1 keys.
def _normalize_apigw_event(event: dict) -> dict:
    """Convert HTTP API v2 event to v1-like shape so Mangum can handle it."""
    if event.get("httpMethod") is not None:
        # Already REST API v1; ensure optional v1 keys exist so Mangum doesn't KeyError
        normalized = dict(event)
        normalized.setdefault("queryStringParameters", None)
        normalized.setdefault("multiValueQueryStringParameters", None)
        normalized.setdefault("headers", normalized.get("headers") or {})
        normalized.setdefault("multiValueHeaders", None)
        normalized.setdefault("body", None)
        normalized.setdefault("isBase64Encoded", False)
        return normalized
    req_ctx = event.get("requestContext") or {}
    http = req_ctx.get("http") or {}
    method = http.get("method")
    if method is None:
        return event  # Not HTTP API v2; let Mangum fail or handler return 400
    # Build v1-like event for Mangum from HTTP API v2
    path = event.get("rawPath") or http.get("path") or "/"
    normalized = dict(event)
    normalized["httpMethod"] = method.upper()
    normalized["path"] = path
    normalized.setdefault("queryStringParameters", None)
    normalized.setdefault("multiValueQueryStringParameters", None)
    normalized.setdefault("headers", event.get("headers") or {})
    normalized.setdefault("multiValueHeaders", None)
    normalized.setdefault("body", event.get("body"))
    normalized.setdefault("isBase64Encoded", event.get("isBase64Encoded", False))
    if "requestContext" not in normalized:
        normalized["requestContext"] = {}
    return normalized


# CORS headers for Lambda response: allow every frontend origin (any port, e.g. 3000, 8081, 5173)
_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
}


def _add_cors_to_response(response: dict) -> dict:
    """Ensure CORS headers are present on Lambda response (required for Lambda Function URL)."""
    if not isinstance(response, dict):
        return response
    headers = response.get("headers") or {}
    # Merge; don't overwrite if already set
    for key, value in _CORS_HEADERS.items():
        if key not in headers:
            headers[key] = value
    response["headers"] = headers
    return response


_asgi_handler = Mangum(app)


def handler(event: dict, context):
    """AWS Lambda entrypoint. Normalizes API Gateway v2 events so Mangum works with both v1 and v2."""
    try:
        normalized = _normalize_apigw_event(event)
        response = _asgi_handler(normalized, context)
        return _add_cors_to_response(response)
    except KeyError as e:
        # Non-HTTP invocation (e.g. direct test, other trigger)
        return _add_cors_to_response({
            "statusCode": 400,
            "headers": {"Content-Type": "application/json"},
            "body": '{"detail":"Invalid event: expected API Gateway HTTP request (missing %s)."}' % str(e),
        })