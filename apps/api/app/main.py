from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import setup_logging
from app.core.exceptions import AuraException, aura_exception_handler, global_exception_handler
from app.db.database import init_db
from app.api.routers import auth

# Initialize structured logging
setup_logging()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
app.add_exception_handler(AuraException, aura_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/health")
def health_check():
    return {"status": "ok", "version": settings.VERSION}

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth")
# app.include_router(images.router, prefix=f"{settings.API_V1_STR}/images")
