from pydantic import BaseModel

class AnalyticsResponse(BaseModel):
    total_uploads: int
    total_bandwidth_bytes: int
    ai_quota_used: int
    ai_quota_total: int
    storage_limit_bytes: int
    tier: str
