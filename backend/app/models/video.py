from datetime import datetime
from typing import List, Optional
from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Video(Base):
    __tablename__ = "videos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    youtube_video_id: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, nullable=False
    )
    channel_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("channels.id", ondelete="CASCADE"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    published_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    view_count: Mapped[int] = mapped_column(
        BigInteger, default=0, server_default="0", nullable=False
    )
    like_count: Mapped[int] = mapped_column(
        BigInteger, default=0, server_default="0", nullable=False
    )
    comment_count: Mapped[int] = mapped_column(
        BigInteger, default=0, server_default="0", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    channel: Mapped[Optional["Channel"]] = relationship(
        "Channel", back_populates="videos"
    )
    snapshots: Mapped[List["VideoSnapshot"]] = relationship(
        "VideoSnapshot", back_populates="video", cascade="all, delete-orphan"
    )
