"""
Matching schemas
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict, field_validator
from app.utils.constants import MatchStatus


class MatchScoreResponse(BaseModel):
    id: UUID
    match_id: UUID
    project_type_score: Optional[float]
    location_score: Optional[float]
    project_size_score: Optional[float]
    pricing_score: Optional[float]
    capability_score: Optional[float]
    verification_score: Optional[float]
    proximity_score: Optional[float]
    response_speed_score: Optional[float]
    total_score: float
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True, strict=True)


class MatchResponse(BaseModel):
    id: UUID
    project_id: UUID
    professional_id: UUID
    match_score: float
    estimated_cost: Optional[float] = None
    status: MatchStatus
    # Mutual interest and workflow fields
    express_interest_landowner: bool = False
    express_interest_builder: bool = False
    mutual_interest_at: Optional[datetime] = None
    gatekeeper_unlocked_at: Optional[datetime] = None
    t7_email_sent_at: Optional[datetime] = None
    t30_email_sent_at: Optional[datetime] = None
    deal_value: Optional[float] = None
    deal_status: Optional[str] = None
    success_fee_percent: Optional[float] = None
    success_fee_amount_total: Optional[float] = None
    success_fee_amount_builder: Optional[float] = None
    success_fee_amount_landowner: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    match_score_details: Optional[MatchScoreResponse] = None

    @field_validator("status", mode="before")
    @classmethod
    def coerce_status(cls, v):
        """
        Handle legacy/invalid DB values gracefully (e.g., empty string) and
        coerce plain strings to MatchStatus enum.
        """
        if isinstance(v, MatchStatus):
            return v
        if isinstance(v, str):
            value = v.strip()
            if not value:
                return MatchStatus.CONNECTED
            try:
                return MatchStatus(value)
            except ValueError:
                return MatchStatus.CONNECTED
        return MatchStatus.CONNECTED
    
    model_config = ConfigDict(from_attributes=True, strict=True)


class LandownerSelectRequest(BaseModel):
    match_id: UUID

    model_config = ConfigDict(strict=True)


class BuilderSelectInitiateResponse(BaseModel):
    match: MatchResponse
    transaction_id: UUID
    order_id: str
    amount: float
    currency: str
    razorpay_key_id: Optional[str] = None

    model_config = ConfigDict(strict=True)


class BuilderSelectConfirmRequest(BaseModel):
    transaction_id: UUID

    model_config = ConfigDict(strict=True)


class MatchConnectionEventResponse(BaseModel):
    match: MatchResponse
    selection_side: str
    payment_required: bool
    payment_status: Optional[str] = None
    payment_transaction_id: Optional[UUID] = None
    email_dispatched: bool = False

    model_config = ConfigDict(strict=True)
