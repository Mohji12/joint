"""
Custom exception classes and handlers
"""
import logging
from typing import Any, Dict
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError


class AppException(Exception):
    """Base application exception"""
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class NotFoundError(AppException):
    """Resource not found exception"""
    def __init__(self, resource: str, identifier: str):
        super().__init__(
            f"{resource} with id {identifier} not found",
            status_code=status.HTTP_404_NOT_FOUND
        )


class UnauthorizedError(AppException):
    """Unauthorized access exception"""
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message, status_code=status.HTTP_401_UNAUTHORIZED)


class ForbiddenError(AppException):
    """Forbidden access exception"""
    def __init__(self, message: str = "Forbidden"):
        super().__init__(message, status_code=status.HTTP_403_FORBIDDEN)


class ValidationError(AppException):
    """Validation error exception"""
    def __init__(self, message: str):
        super().__init__(message, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)


class ConflictError(AppException):
    """Resource conflict exception"""
    def __init__(self, message: str):
        super().__init__(message, status_code=status.HTTP_409_CONFLICT)


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handle application exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.message,
            "detail": str(exc)
        }
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Handle Pydantic validation errors"""
    errors = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"])
        errors.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"]
        })
    logging.warning("Request validation failed: %s %s errors=%s", request.method, request.url.path, errors)

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": True,
            "message": "Validation error",
            "detail": errors
        }
    )


async def integrity_error_handler(request: Request, exc: IntegrityError) -> JSONResponse:
    """Handle database integrity errors"""
    error_message = str(exc.orig) if exc.orig else "Database integrity error"
    
    # Check for common integrity errors
    if "unique constraint" in error_message.lower():
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "error": True,
                "message": "Resource already exists",
                "detail": error_message
            }
        )
    
    if "foreign key constraint" in error_message.lower():
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error": True,
                "message": "Invalid reference",
                "detail": error_message
            }
        )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": True,
            "message": "Database error",
            "detail": error_message
        }
    )


async def runtime_error_handler(request: Request, exc: RuntimeError) -> JSONResponse:
    """Handle config/setup RuntimeErrors (e.g. DB or JWT not configured) with 503 and clear message."""
    msg = str(exc)
    if "not configured" in msg.lower() or "database" in msg.lower() or "jwt" in msg.lower():
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": True,
                "message": "Service temporarily unavailable",
                "detail": msg,
            }
        )
    debug = getattr(request.app.state, "settings", None) and getattr(request.app.state.settings, "debug", False)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": True,
            "message": "Internal server error",
            "detail": msg if debug else "An error occurred",
        }
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle general exceptions"""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": True,
            "message": "Internal server error",
            "detail": str(exc) if request.app.state.settings.debug else "An error occurred"
        }
    )
