import asyncio
import os
import json
import sys

from dotenv import load_dotenv

from langchain_groq import ChatGroq
from langchain_mcp_adapters.client import MultiServerMCPClient

from langchain_core.messages import (
    SystemMessage,
    HumanMessage,
    AIMessage,
)

from langchain_core.tools import tool

from app.rag.retriever import retrieve_context

from app.agent.memory import (
    create_conversation,
    save_message,
    get_conversation_messages,
)
from app.agent.user_memory import (
    get_user_profile,
    update_user_profile,
)
from app.services.goal_service import (
    add_goal_contribution as add_goal_contribution_service,
    get_goals as get_goals_service,
    get_goal_contributions as get_goal_contributions_service,
)

load_dotenv()


# =========================================================
# LLM
# =========================================================

def create_llm():

    return ChatGroq(
        model="openai/gpt-oss-120b",
        temperature=0,
        api_key=os.getenv("GROQ_API_KEY"),
    )


# =========================================================
# MCP CLIENT
# =========================================================

async def create_mcp_client(user_id: str):

    if not user_id:
        raise ValueError("Authenticated user ID is required for MCP.")

    client = MultiServerMCPClient(
        {
            # -------------------------------------------------
            # FINANCE MCP
            # -------------------------------------------------

            "finance": {
                "transport": "stdio",
                "command": sys.executable,
                "args": [
                    "-m",
                    "app.mcp.finance_server",
                ],
                "env": {
                    "THIRTYCENT_USER_ID": user_id,
                },
            },

            # -------------------------------------------------
            # MARKET MCP
            # -------------------------------------------------

            "market": {
                "transport": "stdio",
                "command": sys.executable,
                "args": [
                    "-m",
                    "app.mcp.market_server",
                ],
            },

            # -------------------------------------------------
            # NEWS MCP
            # -------------------------------------------------

            "news": {
                "transport": "stdio",
                "command": sys.executable,
                "args": [
                    "-m",
                    "app.mcp.news_server",
                ],
            },
        }
    )

    return client


# =========================================================
# RAG TOOL
# =========================================================

@tool
def retrieve_financial_knowledge(query: str) -> str:
    """
    Search the 30cent financial knowledge base for stable
    financial education and general financial concepts.

    Use this tool for questions about:

    - budgeting
    - emergency funds
    - saving
    - investing basics
    - diversification
    - credit
    - debt
    - financial concepts

    Do NOT use this tool for:

    - current account balances
    - transactions
    - cashflow
    - current stock prices
    - current market conditions
    - current news
    """

    context = retrieve_context(
        query=query,
        limit=5,
    )

    if not context:
        return "No relevant financial knowledge was found."

    return context

# =========================================================
# USER-SCOPED PROFILE AND GOAL TOOLS
# =========================================================
# These tools are created inside run_agent() so the authenticated
# user_id is captured from FastAPI and cannot be chosen by the LLM.
# =========================================================


# =========================================================
# SYSTEM PROMPT
# =========================================================

SYSTEM_PROMPT = """
You are the AI financial assistant for 30cent.

You have access to:

1. Personal finance data through Finance MCP.
2. Current market data through Market MCP.
3. Current financial news through News MCP.
4. Stable financial knowledge through the RAG tool.

You must use tools whenever the user's question requires
current, personal, market, stock, news, or knowledge-base
information.


=========================================================
FINANCE TOOLS
=========================================================

get_accounts
    Get connected bank accounts.

get_balance
    Get current checking account balance.

get_transactions
    Get transaction history.

get_cashflow
    Get calculated inflow, outflow, net cash flow,
    and spending by category.


=========================================================
MARKET TOOLS
=========================================================

get_market_overview
    Get S&P 500, NASDAQ, and Dow Jones.

get_stock_price
    Get current stock price information.

search_stock
    Search stocks by company name or ticker.

get_stock_history
    Get historical stock prices.

get_watchlist
    Get the 30cent watchlist.


=========================================================
NEWS TOOLS
=========================================================

get_market_news
    Get the latest general market and financial news.

get_company_news
    Get recent news for a specific company or stock.


=========================================================
RAG TOOL
=========================================================

retrieve_financial_knowledge

Use this tool for stable financial education and general
financial concepts.

Examples:

"What is an emergency fund?"
"What is diversification?"
"How does budgeting work?"
"What is an ETF?"
"What is a stock?"
"How does credit card debt work?"
"How can I track expenses?"
"What is cash flow?"

Do NOT use RAG for live or personal information.

For example:

"What's my current balance?"
    → get_balance

"Show my transactions."
    → get_transactions

"What's my cashflow?"
    → get_cashflow

"What's NVDA trading at right now?"
    → get_stock_price

"What's happening in the market?"
    → get_market_news


=========================================================
TOOL SELECTION
=========================================================

Use the appropriate tool whenever current, personal,
market, stock, news, or knowledge-base information is
required.

A question can require multiple tools.

For example:

"I have $110 in my account. What is an emergency fund?"

Use:

1. get_balance
2. retrieve_financial_knowledge

Then combine the results into one answer.


Another example:

"What is NVDA's current price and what is diversification?"

Use:

1. get_stock_price
2. retrieve_financial_knowledge


Another example:

"What is my balance and what is happening in the market?"

Use:

1. get_balance
2. get_market_news


=========================================================
COMPANY → STOCK SYMBOL
=========================================================

When company news or stock information is requested,
use the stock symbol.

Examples:

Nvidia → NVDA
Apple → AAPL
Microsoft → MSFT
Amazon → AMZN
Tesla → TSLA


=========================================================
STOCK TOOL ARGUMENTS
=========================================================

get_stock_price:

{
    "symbol": "NVDA"
}

Use "symbol", not "ticker".


get_company_news:

{
    "symbol": "NVDA"
}

Use "symbol".


search_stock:

{
    "query": "Apple"
}

Use "query".


=========================================================
FINANCIAL DATA RULES
=========================================================

MCP data is the source of truth.

Never invent financial information.

Never change:

- transaction dates
- transaction amounts
- account balances
- merchant names
- currencies
- categories

Never invent transactions.

For cash-flow calculations, trust get_cashflow.


=========================================================
MARKET DATA RULES
=========================================================

MCP market data is the source of truth.

Never invent stock prices.

Never invent market values.

Preserve exact values returned by market tools.

S&P 500, NASDAQ, and Dow Jones are index points,
not dollar prices.


=========================================================
NEWS DATA RULES
=========================================================

News tool results are the source of truth.

Never invent:

- headlines
- article sources
- article URLs
- publication information
- article summaries

Do not claim an article says something unless the returned
article supports it.


=========================================================
RAG RULES
=========================================================

RAG documents are the source of truth for stable financial
education.

When answering a question using retrieve_financial_knowledge:

1. Base the answer primarily on the retrieved context.
2. Do not introduce specific numbers, rules, recommendations,
   or claims that are not supported by the retrieved context.
3. Do not add outside financial guidelines unless the user
   explicitly asks for general information beyond the
   knowledge base.
4. If the retrieved context does not contain enough information,
   say that the knowledge base does not contain enough
   information to answer that part.
5. Preserve important qualifications and uncertainty from the
   retrieved documents.
6. Do not treat RAG documents as current market or account data.

For current information, always use the appropriate MCP tool.


=========================================================
CURRENT DATA RULE
=========================================================

If the user asks for:

- current
- latest
- today
- recent
- now
- price
- market status
- news
- balance
- transactions
- spending
- cash flow

use the appropriate live tool.

Do not answer current-data questions from memory.


=========================================================
CONVERSATION MEMORY
=========================================================

Previous messages in the conversation are available to you.

Use previous conversation context to understand references
such as:

- "that"
- "it"
- "this"
- "the previous one"
- "my balance"
- "that stock"
- "what about it?"

Do not repeat questions that have already been answered when
the previous conversation provides the required context.

However, previous conversation messages are NOT a substitute
for live financial, market, or news data.

If a previous message contains an old balance, stock price,
transaction, or news result, do not treat it as current.

Use the appropriate live tool whenever current information
is required.
=========================================================
FINANCIAL GOAL RULES:
=========================================================

The user can have financial goals stored in the database.

When the user explicitly asks to add, save, contribute,
or put money toward a goal, use the add_money_to_goal tool.

Examples:
- "Add $100 to my Iphone goal"
- "Put $50 into my laptop goal"
- "I saved another $200 for my emergency fund"

Do not claim that money was added unless the tool succeeds.

If the tool returns success=false, clearly explain the
returned message to the user.

Do not directly modify the database.

Do not invent goals.

If the goal name is ambiguous or cannot be found, ask the
user which goal they mean.

After a successful contribution, report:
- goal name
- amount added
- new current amount
- target amount
- progress
- status
==========================================================
FINANCIAL GOAL READING RULES:
==========================================================
When the user asks about their financial goals,
always use the get_my_goals tool to retrieve current
goal information.

Examples:
- "What are my goals?"
- "Show my goals"
- "How much have I saved for my Iphone?"
- "How much do I need for my laptop?"
- "What's my goal progress?"

Do not rely on old conversation messages for current
goal amounts.

Do not invent goals, amounts, progress, or target dates.

For questions about a specific goal, use the data returned
by get_my_goals.

Calculate remaining amount as:

target_amount - current_amount

Calculate progress as:

(current_amount / target_amount) * 100

When reporting a goal, include:
- goal name
- current amount
- target amount
- progress
- remaining amount
- target date
- status when useful

==========================================================
GOAL CONTRIBUTION HISTORY RULES:
==========================================================
When the user asks about contribution history for a
specific goal, use the get_goal_contributions tool.

Examples:
- "Show my Iphone contributions"
- "How much have I added to my Iphone goal?"
- "Show my laptop savings history"
- "What contributions have I made?"

Do not invent contribution amounts, dates, or notes.

When reporting contribution history, include:
- contribution amount
- note when available
- contribution date when available

You may also calculate the total contributed by summing
the returned contribution amounts.

If no contributions exist, clearly tell the user that
there are no contribution records for that goal.

=========================================================
TOOL ERROR RULE
=========================================================

If a tool returns an error:

Do not invent an answer.

Explain the problem briefly based on the returned error.

For example:

"No bank account is currently connected."

or:

"I couldn't retrieve the Nvidia news right now."


=========================================================
FINAL RESPONSE
=========================================================

After all required tools have been executed, answer the
user's original question directly.

Do not mention MCP.

Do not mention internal tool calls.

Do not mention the agent loop.

Do not mention tool execution details.

Do not ask the user to repeat the question.

Keep the answer concise and useful.

When appropriate, use:

- short paragraphs
- bullet points
- tables for comparisons

For financial values, include the currency when available.


=========================================================
IMPORTANT
=========================================================

Do not stop after the first tool call if the user's
question contains multiple independent requests.

Continue calling tools until all required information has
been collected.

Only produce the final answer after all required tool calls
are complete.
"""


# =========================================================
# NORMALIZE TOOL ARGUMENTS
# =========================================================

def normalize_tool_args(
    tool_name,
    tool_args,
):
    """
    Normalize occasional GPT-OSS argument variations.
    """

    if tool_args is None:
        return {}

    # GPT-OSS sometimes produces {"": {}}

    if tool_args == {"": {}}:
        return {}

    # -----------------------------------------------------
    # get_stock_price
    # ticker -> symbol
    # -----------------------------------------------------

    if tool_name == "get_stock_price":

        if (
            "ticker" in tool_args
            and "symbol" not in tool_args
        ):
            tool_args["symbol"] = tool_args.pop(
                "ticker"
            )

    # -----------------------------------------------------
    # search_stock
    # ticker -> query
    # -----------------------------------------------------

    if tool_name == "search_stock":

        if (
            "ticker" in tool_args
            and "query" not in tool_args
        ):
            tool_args["query"] = tool_args.pop(
                "ticker"
            )

    # -----------------------------------------------------
    # get_company_news
    # ticker -> symbol
    # -----------------------------------------------------

    if tool_name == "get_company_news":

        if (
            "ticker" in tool_args
            and "symbol" not in tool_args
        ):
            tool_args["symbol"] = tool_args.pop(
                "ticker"
            )

    return tool_args


# =========================================================
# CONVERT STORED MESSAGES TO LANGCHAIN MESSAGES
# =========================================================

def build_conversation_messages(
    history: list[dict],
):
    """
    Convert database messages into LangChain messages.
    """

    messages = []

    for message in history:

        role = message.get("role")
        content = message.get("content", "")

        if role == "user":

            messages.append(
                HumanMessage(
                    content=content
                )
            )

        elif role == "assistant":

            messages.append(
                AIMessage(
                    content=content
                )
            )

    return messages


# =========================================================
# RUN AGENT
# =========================================================

async def run_agent(
    user_message: str,
    conversation_id: int | None = None,
    user_id: str = "",
):

    # -----------------------------------------------------
    # Validate message
    # -----------------------------------------------------

    if not user_id:
        raise ValueError("Authenticated user ID is required.")


    # -----------------------------------------------------
    # Create conversation if needed
    # -----------------------------------------------------

    if conversation_id is None:

        conversation_id = create_conversation(
            title=user_message[:80],
            user_id=user_id,
        )

        print(
            f"\nNEW CONVERSATION: "
            f"{conversation_id}"
        )

    else:

        print(
            f"\nUSING CONVERSATION: "
            f"{conversation_id}"
        )


    # -----------------------------------------------------
    # Save user message
    # -----------------------------------------------------

    save_message(
        conversation_id=conversation_id,
        role="user",
        content=user_message,
        user_id=user_id,
    )


    # -----------------------------------------------------
    # Load previous conversation
    # -----------------------------------------------------

    history = get_conversation_messages(
        conversation_id=conversation_id,
        user_id=user_id,
    )


    print(
        f"CONVERSATION HISTORY: "
        f"{len(history)} messages"
    )


    # -----------------------------------------------------
    # Create LLM
    # -----------------------------------------------------

    llm = create_llm()


    # -----------------------------------------------------
    # Create MCP client
    # -----------------------------------------------------

    client = await create_mcp_client(user_id)


    # -----------------------------------------------------
    # Get MCP tools
    # -----------------------------------------------------

    mcp_tools = await client.get_tools()


    # -----------------------------------------------------
    # Add RAG tools
    # -----------------------------------------------------

    rag_tools = [
        retrieve_financial_knowledge,
    ]

    # -----------------------------------------------------
    # USER-SCOPED PROFILE TOOLS
    # -----------------------------------------------------
    #
    # user_id comes from FastAPI authentication.
    # The LLM never receives user_id as a tool argument.
    #

    @tool
    def get_my_profile() -> dict:
        """
        Retrieve the authenticated user's permanent profile
        information, such as name or preferred currency.
        """
        return get_user_profile(
            user_id=user_id,
        )

    @tool
    def update_my_profile(
        name: str | None = None,
        currency: str | None = None,
    ) -> dict:
        """
        Save or update the authenticated user's permanent
        profile information.
        """
        return update_user_profile(
            name=name,
            currency=currency,
            user_id=user_id,
        )

    # -----------------------------------------------------
    # USER-SCOPED GOAL TOOLS
    # -----------------------------------------------------

    @tool
    def get_my_goals() -> dict:
        """
        Retrieve all financial goals belonging to the
        authenticated user.
        """
        try:
            goals = get_goals_service(
                user_id=user_id,
            )

            return {
                "success": True,
                "goals": goals,
            }

        except Exception as error:
            print(
                f"Get goals tool error: {error}"
            )

            return {
                "success": False,
                "message": "Unable to retrieve your goals.",
            }

    @tool
    def get_goal_contributions(
        goal_name: str,
    ) -> dict:
        """
        Retrieve contribution history for one of the
        authenticated user's financial goals.
        """
        try:
            result = get_goal_contributions_service(
                goal_name=goal_name,
                user_id=user_id,
            )

            return {
                "success": True,
                "data": result,
            }

        except ValueError as error:
            return {
                "success": False,
                "message": str(error),
            }

        except Exception as error:
            print(
                f"Get goal contributions tool error: {error}"
            )

            return {
                "success": False,
                "message": (
                    "Unable to retrieve goal contribution history."
                ),
            }

    @tool
    def add_money_to_goal(
        goal_name: str,
        amount: float,
        note: str | None = None,
    ) -> dict:
        """
        Add money to one of the authenticated user's
        financial goals.
        """
        try:
            result = add_goal_contribution_service(
                goal_name=goal_name,
                amount=amount,
                note=note,
                user_id=user_id,
            )

            return {
                "success": True,
                "message": (
                    f"Added ${amount:.2f} to "
                    f"{result['goal_name']}."
                ),
                "data": result,
            }

        except ValueError as error:
            return {
                "success": False,
                "message": str(error),
            }

        except Exception as error:
            print(
                f"Goal contribution tool error: {error}"
            )

            return {
                "success": False,
                "message": (
                    "Unable to update the financial goal."
                ),
            }

    user_memory_tools = [
        get_my_profile,
        update_my_profile,
    ]

    goal_tools = [
        get_my_goals,
        get_goal_contributions,
        add_money_to_goal,
    ]

    tools = (
        mcp_tools
        + rag_tools
        + user_memory_tools
        + goal_tools
    )


    # -----------------------------------------------------
    # Print available tools
    # -----------------------------------------------------

    print("\nAVAILABLE TOOLS:")

    for available_tool in tools:

        print(
            f"- {available_tool.name}"
        )


    # -----------------------------------------------------
    # Bind tools to LLM
    # -----------------------------------------------------

    llm_with_tools = llm.bind_tools(
        tools
    )


    # -----------------------------------------------------
    # Initial messages
    # -----------------------------------------------------

    messages = [
        SystemMessage(
            content=SYSTEM_PROMPT
        )
    ]

    # Add previous conversation
    # EXCEPT the current user message.
    #
    # The current message was already saved above,
    # so remove it from the history we send to the
    # model to avoid sending it twice.

    previous_history = history[:-1]

    messages.extend(
        build_conversation_messages(
            previous_history
        )
    )

    # Add current user message.

    messages.append(
        HumanMessage(
            content=user_message
        )
    )


    # -----------------------------------------------------
    # Agent loop
    # -----------------------------------------------------

    max_iterations = 10


    for iteration in range(
        max_iterations
    ):

        print(
            f"\n--- AGENT ITERATION "
            f"{iteration + 1} ---"
        )


        # -------------------------------------------------
        # Ask LLM what to do
        # -------------------------------------------------

        response = await llm_with_tools.ainvoke(
            messages
        )


        print("\nLLM RESPONSE:")
        print(response.content)


        print("\nTOOL CALLS:")
        print(response.tool_calls)


        # -------------------------------------------------
        # No more tools
        # -------------------------------------------------

        if not response.tool_calls:

            final_answer = response.content

            # Save assistant response
            save_message(
                conversation_id=conversation_id,
                role="assistant",
                content=final_answer,
                user_id=user_id,
            )

            return{
                
                "response": final_answer,
                "conversation_id": conversation_id,
                
            }


        # -------------------------------------------------
        # Add assistant response
        # -------------------------------------------------

        messages.append(
            response
        )


        # -------------------------------------------------
        # Tool lookup
        # -------------------------------------------------

        tools_by_name = {
            available_tool.name: available_tool
            for available_tool in tools
        }


        # -------------------------------------------------
        # Execute requested tools
        # -------------------------------------------------

        for tool_call in response.tool_calls:

            tool_name = tool_call["name"]

            tool_args = tool_call.get(
                "args",
                {},
            )


            # -------------------------------------------------
            # Normalize arguments
            # -------------------------------------------------

            tool_args = normalize_tool_args(
                tool_name,
                tool_args,
            )


            print(
                f"\nEXECUTING TOOL: "
                f"{tool_name}"
            )

            print(
                f"ARGS: {tool_args}"
            )


            # -------------------------------------------------
            # Find tool
            # -------------------------------------------------

            selected_tool = tools_by_name.get(
                tool_name
            )


            if selected_tool is None:

                print(
                    f"UNKNOWN TOOL: "
                    f"{tool_name}"
                )


                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call["id"],
                        "content": json.dumps(
                            {
                                "success": False,
                                "error": (
                                    f"Unknown tool: "
                                    f"{tool_name}"
                                ),
                            }
                        ),
                    }
                )

                continue


            # -------------------------------------------------
            # Execute tool
            # -------------------------------------------------

            try:

                result = await selected_tool.ainvoke(
                    tool_args
                )


                print(
                    f"TOOL RESULT: "
                    f"{result}"
                )


                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call["id"],
                        "content": str(result),
                    }
                )


            except Exception as e:

                print(
                    f"TOOL ERROR: "
                    f"{e}"
                )


                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call["id"],
                        "content": json.dumps(
                            {
                                "success": False,
                                "error": str(e),
                            }
                        ),
                    }
                )


    # -----------------------------------------------------
    # Safety fallback
    # -----------------------------------------------------

    final_answer = (
        "I was unable to complete the request "
        "because too many tool calls were required."
    )

    save_message(
        conversation_id=conversation_id,
        role="assistant",
        content=final_answer,
        user_id=user_id,
    )

    return{
        
        "response": final_answer,
        "conversation_id": conversation_id,
    }


# =========================================================
# TEST
# =========================================================

if __name__ == "__main__":

    async def test():

        conversation_id = None

        test_user_id = os.getenv(
            "TEST_USER_ID",
            "cc9e830a-3e96-4b2b-8b3d-968654486d5e",
        )

        answer = await run_agent(
            "What is my current checking balance?",
            conversation_id=conversation_id,
            user_id=test_user_id,
        )

        print("\nFINAL ANSWER:")
        print(answer)

    asyncio.run(test())