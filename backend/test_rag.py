from app.rag.retriever import retrieve_context


query = "How much money should I keep for emergencies?"

context = retrieve_context(query)

print("\n===== RAG RESULT =====\n")
print(context)