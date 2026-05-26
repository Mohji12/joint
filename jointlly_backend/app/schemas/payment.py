"""
Payment schemas
"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict, field_validator
from app.utils.constants import TransactionType, TransactionStatus


class CreateOrderRequest(BaseModel):
    amount: float = Field(..., gt=0)
    transaction_type: TransactionType
    project_id: Optional[UUID] = None
    match_id: Optional[UUID] = None
    currency: str = Field(default="INR", max_length=10)
    
    model_config = ConfigDict(strict=True)

    @field_validator("transaction_type", mode="before")
    @classmethod
    def coerce_transaction_type(cls, v):
        if isinstance(v, TransactionType):
            return v
        if isinstance(v, str):
            return TransactionType(v)
        return v


class CreateOrderResponse(BaseModel):
    transaction_id: UUID
    order_id: str
    amount: float
    currency: str
    razorpay_key_id: str
    
    model_config = ConfigDict(strict=True)


class VerifyPaymentRequest(BaseModel):
    transaction_id: UUID
    razorpay_payment_id: str = Field(..., min_length=1)
    razorpay_signature: str = Field(..., min_length=1)
    
    model_config = ConfigDict(strict=True)


class TransactionResponse(BaseModel):
    id: UUID
    user_id: UUID
    project_id: Optional[UUID]
    match_id: Optional[UUID]
    transaction_type: TransactionType
    amount: float
    currency: str
    razorpay_order_id: Optional[str]
    razorpay_payment_id: Optional[str]
    status: TransactionStatus
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True, strict=True)

    @field_validator("transaction_type", mode="before")
    @classmethod
    def coerce_response_transaction_type(cls, v):
        if isinstance(v, TransactionType):
            return v
        if isinstance(v, str):
            return TransactionType(v)
        return v

    @field_validator("status", mode="before")
    @classmethod
    def coerce_response_transaction_status(cls, v):
        if isinstance(v, TransactionStatus):
            return v
        if isinstance(v, str):
            return TransactionStatus(v)
        return v
