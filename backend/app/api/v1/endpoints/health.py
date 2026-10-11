from typing import Any, Dict
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db

router = APIRouter()


@router.get("/health")
def health_check() -> Dict[str, Any]:
    return {
        "status": "ok",
        "project": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
    }


@router.get("/health/db")
def health_db_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    try:
        db_version = db.execute(text("SELECT version();")).scalar()
        return {
            "status": "connected",
            "database": "PostgreSQL",
            "version": db_version,
        }
    except Exception as exc:
        return {
            "status": "error",
            "message": str(exc),
        }
