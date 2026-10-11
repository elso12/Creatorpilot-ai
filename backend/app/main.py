from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints.ai_studio import router as ai_studio_router
from app.api.v1.endpoints.competitors import router as competitors_router
from app.api.v1.endpoints.dashboard import router as dashboard_router
from app.api.v1.endpoints.planner import router as planner_router
from app.api.v1.endpoints.research import router as research_router
from app.api.v1.endpoints.settings import router as settings_router
from app.api.v1.router import api_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/api/v1/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
app.include_router(research_router, prefix="/api/v1/research", tags=["research"])
app.include_router(competitors_router, prefix="/api/v1/competitors", tags=["competitors"])
app.include_router(ai_studio_router, prefix="/api/v1/ai", tags=["ai"])
app.include_router(planner_router, prefix="/api/v1/planner", tags=["planner"])
app.include_router(dashboard_router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(settings_router, prefix="/api/v1/settings", tags=["settings"])


@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs": "/docs",
        "health": "/api/v1/health",
    }
