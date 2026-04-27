"""
Pydantic request / response schemas.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class TreeCreate(BaseModel):
    """Request body for creating or updating a tree."""
    tree: dict


class TreeResponse(BaseModel):
    """Response body returned for tree operations."""
    id: int
    tree_json: dict
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
