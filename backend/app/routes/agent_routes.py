from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.agent.agent import run_agent


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/agent",
    tags=["AI Agent"],
)


# =========================================================
# REQUEST MODEL
# =========================================================

class AgentRequest(BaseModel):
    message: str


# =========================================================
# RESPONSE MODEL
# =========================================================

class AgentResponse(BaseModel):
    response: str


# =========================================================
# CHAT ENDPOINT
# =========================================================

@router.post(
    "",
    response_model=AgentResponse,
)
async def agent_chat(request: AgentRequest):

    if not request.message.strip():

        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )

    try:

        answer = await run_agent(
            request.message
        )

        return AgentResponse(
            response=answer
        )

    except Exception as e:

        print(
            f"Agent route error: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to process the AI request.",
        )