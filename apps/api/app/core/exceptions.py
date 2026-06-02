from fastapi import Request, status
from fastapi.responses import JSONResponse
import structlog

logger = structlog.get_logger()

class AuraException(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code

async def aura_exception_handler(request: Request, exc: AuraException):
    logger.error("aura_exception", path=request.url.path, status=exc.status_code, error=exc.message)
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.message},
    )

async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("unhandled_exception", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "error": "An unexpected error occurred. Please try again later."},
    )
