from app.rag.vector_store import search_similar_documents


def retrieve_context(
    query: str,
    limit: int = 5,
) -> str:
    """
    Retrieve relevant financial knowledge and format it
    as context for the LLM.
    """

    documents = search_similar_documents(
        query=query,
        user_id="system",
        limit=limit,
    )

    if not documents:
        return ""

    context_parts = []

    for document in documents:
        context_parts.append(
            f"Source: {document['title']}\n"
            f"{document['content']}"
        )

    return "\n\n---\n\n".join(context_parts)