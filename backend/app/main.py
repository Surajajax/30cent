from fastapi import FastAPI

app = FastAPI(
    title="30Cent API",
    description="AI-Powered Personal Finance API",
    version="1.0.0",
)

@app.get("/")
def root():
    return {
        "message": "Welcome to 30Cent API 🚀"
    }