from langchain_core.tools import tool


@tool
def get_finance_status() -> str:
    """
    Get the current status of the 30cent finance system.
    Use this when the user asks about the finance system status.
    """

    return (
        "30cent finance system is connected and ready. "
        "Finance tools are available."
    )