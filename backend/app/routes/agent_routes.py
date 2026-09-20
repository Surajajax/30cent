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
    conversation_id: int | None = None


# =========================================================
# RESPONSE MODEL
# =========================================================

class AgentResponse(BaseModel):
    response: str
    conversation_id: int


# =========================================================
# CHAT ENDPOINT
# =========================================================

@router.post(
    "",
    response_model=AgentResponse,
)
async def agent_chat(request: AgentRequest):

    # -----------------------------------------------------
    # Validate message
    # -----------------------------------------------------

    if not request.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )

    # -----------------------------------------------------
    # Run AI agent
    # -----------------------------------------------------

    try:

        result = await run_agent(
            user_message=request.message,
            conversation_id=request.conversation_id,
        )

        # -------------------------------------------------
        # Return AI response + conversation ID
        # -------------------------------------------------

        return AgentResponse(
            response=result["response"],
            conversation_id=result["conversation_id"],
        )

    except Exception as e:

        print(
            f"Agent route error: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to process the AI request.",
        )