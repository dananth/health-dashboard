from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from models.schemas import ChatRequest
from services.ai_service import stream_chat

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/")
def chat(request: ChatRequest):
    messages = [m.model_dump() for m in request.messages]

    def event_stream():
        for token in stream_chat(messages, request.context):
            yield token

    return StreamingResponse(event_stream(), media_type="text/plain")
