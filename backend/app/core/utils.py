import re
from typing import Optional

ISO8601_DURATION_REGEX = re.compile(
    r"^P(?:(?P<weeks>\d+)W)?(?:(?P<days>\d+)D)?(?:T(?:(?P<hours>\d+)H)?(?:(?P<minutes>\d+)M)?(?:(?P<seconds>\d+)S)?)?$"
)


def parse_iso8601_duration(duration_str: Optional[str]) -> int:
    """
    Parses YouTube duration strings like 'PT1H2M10S', 'PT4M33S', 'PT45S' into total seconds.
    Returns 0 if invalid or empty.
    """
    if not duration_str or not isinstance(duration_str, str):
        return 0

    stripped = duration_str.strip()
    if not stripped or stripped == "P" or stripped == "PT":
        return 0

    match = ISO8601_DURATION_REGEX.match(stripped)
    if not match:
        return 0

    groups = match.groupdict()
    weeks = int(groups.get("weeks") or 0)
    days = int(groups.get("days") or 0)
    hours = int(groups.get("hours") or 0)
    minutes = int(groups.get("minutes") or 0)
    seconds = int(groups.get("seconds") or 0)

    total = weeks * 7 * 86400 + days * 86400 + hours * 3600 + minutes * 60 + seconds
    return total


def format_duration_seconds(duration_seconds: int) -> str:
    """
    Formats total seconds into MM:SS or H:MM:SS string (e.g., '14:32', '1:02:10').
    """
    if duration_seconds <= 0:
        return "0:00"

    hours = duration_seconds // 3600
    minutes = (duration_seconds % 3600) // 60
    seconds = duration_seconds % 60

    if hours > 0:
        return f"{hours}:{minutes:02d}:{seconds:02d}"
    return f"{minutes}:{seconds:02d}"
