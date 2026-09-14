import asyncio
import os
import json

from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_core.messages import (
    SystemMessage,
    HumanMessage,
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

async def create_mcp_client():

    client = MultiServerMCPClient(
        {

            # -------------------------------------------------
            # FINANCE MCP
            # -------------------------------------------------

            "finance": {
                "transport": "stdio",
                "command": "python",
                "args": [
                    "-m",
                    "app.mcp.finance_server",
                ],
            },


            # -------------------------------------------------
            # MARKET MCP
            # -------------------------------------------------

            "market": {
                "transport": "stdio",
                "command": "python",
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
                "command": "python",
                "args": [
                    "-m",
                    "app.mcp.news_server",
                ],
            },

        }
    )

    return client


# =========================================================
# SYSTEM PROMPT
# =========================================================

SYSTEM_PROMPT = """
You are the AI financial assistant for 30cent.

You have access to the user's personal finance data,
current market data, and financial news through tools.

You must use tools whenever the user's question requires
current, personal, market, stock, or news information.


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
TOOL SELECTION
=========================================================

Use the appropriate tool whenever current or personal
data is required.


FINANCE EXAMPLES

"What is my balance?"
→ get_balance

"Show my transactions."
→ get_transactions

"How much did I spend?"
→ get_cashflow

"Show my bank accounts."
→ get_accounts


MARKET EXAMPLES

"What is Nvidia's price?"
→ get_stock_price

"How is the market doing?"
→ get_market_overview

"Show Nvidia's history."
→ get_stock_history

"Search for Apple."
→ search_stock

"How is my watchlist?"
→ get_watchlist


NEWS EXAMPLES

"What's happening in the market?"
→ get_market_news

"What's the latest market news?"
→ get_market_news

"Give me today's financial news."
→ get_market_news

"What are the major market headlines?"
→ get_market_news

"What's the latest Nvidia news?"
→ get_company_news

"What's happening with Apple?"
→ get_company_news

"Show me Tesla news."
→ get_company_news

"Why is Nvidia in the news?"
→ get_company_news

"Give me recent Microsoft news."
→ get_company_news


=========================================================
COMPANY → STOCK SYMBOL
=========================================================

When company news is requested, use the stock symbol.

Examples:

Nvidia → NVDA

Apple → AAPL

Microsoft → MSFT

Amazon → AMZN

Tesla → TSLA


=========================================================
MULTIPLE TOOLS
=========================================================

A user question may require multiple tools.

For example:

"What is my checking balance and Nvidia's price?"

You should call:

1. get_balance
2. get_stock_price

Then combine the results into one final answer.

Do NOT stop after calling only one tool if another
part of the user's question still requires data.


Another example:

"What is Nvidia's price and what is the latest Nvidia news?"

You should call:

1. get_stock_price
2. get_company_news

Then combine the results.


Another example:

"What is my balance and what is happening in the market?"

You should call:

1. get_balance
2. get_market_news

Then combine the results.


=========================================================
STOCK TOOL ARGUMENTS
=========================================================

When calling get_stock_price, the argument must be:

{
    "symbol": "NVDA"
}

Use "symbol", not "ticker".


When calling get_company_news, the argument must be:

{
    "symbol": "NVDA"
}

Use "symbol" for the stock symbol.


When calling search_stock, the argument must be:

{
    "query": "Apple"
}

Use "query" for the search text.


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

Do not claim that an article says something unless
the returned article supports it.

When summarizing news:

1. Clearly state what the article reports.
2. Separate the reported information from your own
   explanation when necessary.
3. Do not fabricate missing details.

If no relevant news is returned, say that no relevant
news was found.


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

use the appropriate tool.

Do not answer from memory when a tool can provide
the current information.


=========================================================
TOOL ERROR RULE
=========================================================

If a tool returns:

{
    "success": false
}

do not invent an answer.

Explain the problem briefly based on the returned
error.

For example:

"No bank account is currently connected."

or:

"I couldn't retrieve the Nvidia news right now."


=========================================================
FINAL RESPONSE
=========================================================

After all required tools have been executed, answer
the user's original question directly.

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

For financial values, include the currency when
the tool provides it.


=========================================================
IMPORTANT
=========================================================

Do not stop after the first tool call if the user's
question contains multiple independent requests.

Continue calling tools until all required information
has been collected.

Only produce the final answer after all required
tool calls are complete.
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
# RUN AGENT
# =========================================================

async def run_agent(user_message: str):

    # -----------------------------------------------------
    # Create LLM
    # -----------------------------------------------------

    llm = create_llm()


    # -----------------------------------------------------
    # Create MCP client
    # -----------------------------------------------------

    client = await create_mcp_client()


    # -----------------------------------------------------
    # Get all MCP tools
    # -----------------------------------------------------

    tools = await client.get_tools()


    # -----------------------------------------------------
    # Print available tools
    # -----------------------------------------------------

    print("\nMCP TOOLS:")

    for tool in tools:

        print(
            f"- {tool.name}"
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
        ),

        HumanMessage(
            content=user_message
        ),

    ]


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
        # Final answer
        # -------------------------------------------------

        if not response.tool_calls:

            return response.content


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
            tool.name: tool
            for tool in tools
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


            # Normalize arguments

            tool_args = normalize_tool_args(
                tool_name,
                tool_args,
            )


            print(
                f"\nEXECUTING MCP TOOL: "
                f"{tool_name}"
            )


            print(
                f"ARGS: {tool_args}"
            )


            # -------------------------------------------------
            # Find tool
            # -------------------------------------------------

            tool = tools_by_name.get(
                tool_name
            )


            if tool is None:

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
            # Execute MCP tool
            # -------------------------------------------------

            try:

                result = await tool.ainvoke(
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

    return (
        "I was unable to complete the request "
        "because too many tool calls were required."
    )


# =========================================================
# TEST
# =========================================================

if __name__ == "__main__":

    answer = asyncio.run(
        run_agent(
            "What is the latest news about Nvidia?"
        )
    )


    print("\nFINAL ANSWER:")
    print(answer)