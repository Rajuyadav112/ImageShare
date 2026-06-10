from pydantic import BaseModel
from typing import Optional

class ChatInstructionRequest(BaseModel):
    instruction: str
    base_image_url: Optional[str] = None
    
class ChatInstructionResponse(BaseModel):
    message: str
    generated_image_url: str
    image_id: str
