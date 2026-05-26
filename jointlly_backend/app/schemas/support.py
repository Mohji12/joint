"""
Schemas for support chatbot (no LLM).
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class SupportArticleOut(BaseModel):
    id: str
    title: str
    slug: str
    audience: str
    category: str
    keywords: List[str] = Field(default_factory=list)
    content_md: str

    model_config = ConfigDict(from_attributes=True)


class SupportChip(BaseModel):
    label: str
    action: Dict[str, Any]


class SupportFlowOption(BaseModel):
    id: str
    label: str
    action: Dict[str, Any]


class SupportFlowPayload(BaseModel):
    flowId: str
    nodeId: str
    prompt: str
    options: List[SupportFlowOption] = Field(default_factory=list)


class SupportEscalation(BaseModel):
    canCreateTicket: bool = True


class SupportChatRequest(BaseModel):
    message: str
    sessionId: Optional[str] = None
    route: Optional[str] = None
    role: Optional[str] = None
    context: Dict[str, Any] = Field(default_factory=dict)


class SupportChatResponse(BaseModel):
    message: str
    chips: List[SupportChip] = Field(default_factory=list)
    articles: List[SupportArticleOut] = Field(default_factory=list)
    flow: Optional[SupportFlowPayload] = None
    escalation: Optional[SupportEscalation] = None


class SupportSuggestionsResponse(BaseModel):
    chips: List[SupportChip] = Field(default_factory=list)


class SupportTicketCreateRequest(BaseModel):
    subject: str
    description: str = ""
    route: Optional[str] = None
    role: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SupportTicketCreateResponse(BaseModel):
    ticketId: str
    status: str


class SupportTicketOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    role: Optional[str] = None
    route: Optional[str] = None
    subject: str
    description: str
    status: str
    metadata_json: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)

