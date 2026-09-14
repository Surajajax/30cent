import os

from dotenv import load_dotenv
from langchain_groq import ChatGroq


load_dotenv()


def create_llm():
    return ChatGroq(
        model="openai/gpt-oss-120b",
        temperature=0,
        api_key=os.getenv("GROQ_API_KEY"),
    )


if __name__ == "__main__":
    llm = create_llm()

    response = llm.invoke(
        "You are the AI assistant for 30cent. "
        "Introduce yourself in one short sentence."
    )

    print(response.content)