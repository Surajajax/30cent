from langchain_huggingface import HuggingFaceEmbeddings


MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


embeddings = HuggingFaceEmbeddings(
    model_name=MODEL_NAME,
)


def embed_text(text: str) -> list[float]:
    """
    Convert a single text string into a 384-dimensional embedding.
    """
    return embeddings.embed_query(text)


def embed_documents(texts: list[str]) -> list[list[float]]:
    """
    Convert multiple text strings into embeddings.
    """
    return embeddings.embed_documents(texts)