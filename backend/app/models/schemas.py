from pydantic import BaseModel
from typing import List, Optional

class ChatRequest(BaseModel):
    bot_id: str
    query: str # Frontend sends 'message', but we use 'query' internally

class ChatResponse(BaseModel):
    response: str

class DocumentUploadResponse(BaseModel):
    bot_id: str
    message: str
    widget_code: str

class Bot(BaseModel):
    id: str
    name: str
    company_name: str
    collection_name: str
