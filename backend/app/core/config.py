from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    DATABASE_URL: str = "postgresql+psycopg://postgres:<PASSWORD>@localhost:5432/creatorpilot"
    PROJECT_NAME: str = "CreatorPilot AI"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    YOUTUBE_API_KEY: str = ""
    GEMINI_API_KEY: str = ""


settings = Settings()
