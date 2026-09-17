from sqlalchemy import select

from app.database import SessionLocal
from app.models import Document
from app.rag.embeddings import embed_text


def add_document(
    title: str,
    content: str,
    embedding: list[float],
    source: str,
    chunk_index: int,
    user_id: str = "system",
    metadata: dict | None = None,
):
    """
    Insert a document chunk if it does not already exist.
    """

    with SessionLocal() as db:
        # Check whether this exact document chunk already exists.
        existing = db.execute(
            select(Document).where(
                Document.user_id == user_id,
                Document.source == source,
                Document.chunk_index == chunk_index,
            )
        ).scalar_one_or_none()

        if existing:
            print(
                f"Skipping existing chunk: "
                f"{source} #{chunk_index}"
            )
            return existing.id

        # Create the document.
        document = Document(
            user_id=user_id,
            title=title,
            source=source,
            chunk_index=chunk_index,
            content=content,
            document_metadata=metadata,
            embedding=embedding,
        )

        db.add(document)
        db.commit()
        db.refresh(document)

        return document.id


def search_similar_documents(
    query: str,
    user_id: str = "system",
    limit: int = 5,
):
    """
    Perform semantic similarity search using pgvector.
    """

    query_embedding = embed_text(query)

    distance = Document.embedding.cosine_distance(
        query_embedding
    ).label("distance")

    with SessionLocal() as db:
        results = db.execute(
            select(Document, distance)
            .where(Document.user_id == user_id)
            .order_by(distance)
            .limit(limit)
        ).all()

        documents = []

        for document, similarity_distance in results:
            documents.append(
                {
                    "id": document.id,
                    "title": document.title,
                    "source": document.source,
                    "chunk_index": document.chunk_index,
                    "content": document.content,
                    "metadata": document.document_metadata,
                    "distance": float(similarity_distance),
                }
            )

        return documents