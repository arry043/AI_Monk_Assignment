"""
SQLAlchemy ORM models.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Text, DateTime
from database import Base


class Tree(Base):
    """Stores a complete tree hierarchy as a JSON blob."""

    __tablename__ = "trees"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tree_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=True)
