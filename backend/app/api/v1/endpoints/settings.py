from typing import Any, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.endpoints.dashboard import get_system_diagnostics

router = APIRouter()


@router.get(
    "/diagnostics",
    summary="System and Service Diagnostics",
    description="Returns detailed database health, environment, and external API connection status.",
)
def get_diagnostics(
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    return get_system_diagnostics(db=db)
