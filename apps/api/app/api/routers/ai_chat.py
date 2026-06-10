from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from app.db.database import get_session
from app.schemas.ai_chat import ChatInstructionRequest, ChatInstructionResponse
from app.services.ai_chat_service import AIChatService
from app.services.storage_service import StorageService
from app.services.image_processing import ImageProcessingService

router = APIRouter(tags=["AI Chat"])

def get_ai_chat_service(session: Session = Depends(get_session)) -> AIChatService:
    return AIChatService(
        session=session, 
        storage_service=StorageService(), 
        image_processor=ImageProcessingService()
    )

@router.post("/instruction", response_model=ChatInstructionResponse)
async def send_instruction(
    request: ChatInstructionRequest,
    ai_service: AIChatService = Depends(get_ai_chat_service)
):
    result = await ai_service.process_instruction(
        instruction=request.instruction,
        base_image_url=request.base_image_url
    )
    return ChatInstructionResponse(**result)
