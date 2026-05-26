"""
Payment router
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import require_authenticated
from app.models.user import User
from app.schemas.payment import (
    CreateOrderRequest,
    CreateOrderResponse,
    VerifyPaymentRequest,
    TransactionResponse
)
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["Payments"])

# Initialize payment service
payment_service = PaymentService()


@router.post("/create-order", response_model=CreateOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: CreateOrderRequest,
    current_user: User = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db)
):
    """Create Razorpay order"""
    order = await payment_service.create_order(
        db,
        current_user.id,
        order_data.amount,
        order_data.transaction_type,
        order_data.project_id,
        order_data.match_id,
        order_data.currency
    )
    return order


@router.post("/verify", response_model=TransactionResponse)
async def verify_payment(
    verify_data: VerifyPaymentRequest,
    current_user: User = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db)
):
    """Verify Razorpay payment"""
    transaction = await payment_service.verify_payment(
        db,
        verify_data.transaction_id,
        verify_data.razorpay_payment_id,
        verify_data.razorpay_signature
    )
    
    # Unlock features if applicable
    await payment_service.unlock_feasibility(db, transaction)
    await payment_service.unlock_builder_match_selection(db, transaction)
    
    return transaction


@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Handle Razorpay webhook"""
    webhook_data = await request.json()
    webhook_signature = request.headers.get("X-Razorpay-Signature")
    
    if not webhook_signature:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Missing webhook signature")
    
    webhook_data["razorpay_signature"] = webhook_signature
    
    transaction = await payment_service.handle_webhook(db, webhook_data)
    
    if transaction:
        # Unlock features if applicable
        await payment_service.unlock_feasibility(db, transaction)
        await payment_service.unlock_builder_match_selection(db, transaction)
    
    return {"status": "success"}


@router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    current_user: User = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db)
):
    """Get user transaction history"""
    transactions = await payment_service.get_transactions(db, current_user.id)
    return transactions
