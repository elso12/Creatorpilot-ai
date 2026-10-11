from datetime import datetime
from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class VideoSnapshot(Base):
    __tablename__ = "video_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    video_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("videos.id", ondelete="CASCADE"), index=True, nullable=False
    )
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    view_count: Mapped[int] = mapped_column(BigInteger, nullable=False)
    like_count: Mapped[int] = mapped_column(BigInteger, nullable=False)
    comment_count: Mapped[int] = mapped_column(BigInteger, nullable=False)

    video: Mapped["Video"] = relationship("Video", back_populates="snapshots")
