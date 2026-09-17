from pathlib import Path

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.rag.embeddings import embed_documents
from app.rag.vector_store import add_document


BASE_DIR = Path(__file__).resolve().parents[2]

DOCUMENTS_DIR = BASE_DIR / "rag_documents"


def ingest_document(file_path: Path):
    print(f"Reading: {file_path}")

    text = file_path.read_text(
        encoding="utf-8"
    ).strip()

    if not text:
        print("Skipping empty document.")
        return

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100,
    )

    chunks = splitter.split_text(text)

    print(f"Created {len(chunks)} chunks")

    embeddings = embed_documents(chunks)

    source = file_path.name

    for index, (chunk, embedding) in enumerate(
        zip(chunks, embeddings),
        start=1,
    ):
        document_id = add_document(
            title=f"{file_path.stem} - chunk {index}",
            content=chunk,
            embedding=embedding,
            source=source,
            chunk_index=index,
            user_id="system",
            metadata={
                "source": source,
                "chunk": index,
            },
        )

        print(
            f"Processed chunk {index}/{len(chunks)} "
            f"(id={document_id})"
        )


def main():
    files = sorted(
        DOCUMENTS_DIR.glob("*.txt")
    )

    if not files:
        print(
            f"No documents found in {DOCUMENTS_DIR}"
        )
        return

    for file_path in files:
        ingest_document(file_path)

    print("\nRAG ingestion completed.")


if __name__ == "__main__":
    main()