from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth import get_current_user_id
from app.agent.agent import run_agent
from app.agent.memory import get_latest_conversation


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
async def agent_chat(
    request: AgentRequest,
    user_id: str = Depends(get_current_user_id),
):
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
            user_id=user_id,
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


# =========================================================
# GET LATEST CONVERSATION
# =========================================================

@router.get("/conversations/latest")
async def get_latest_agent_conversation(
    user_id: str = Depends(get_current_user_id),
):
    try:
        conversation = get_latest_conversation(
            user_id=user_id,
        )

        if not conversation:
            return {
                "conversation": None,
            }

        return {
            "conversation": conversation,
        }

    except Exception as e:
        print(
            f"Latest conversation route error: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to load the latest conversation.",
        )