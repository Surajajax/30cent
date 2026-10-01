# 30cent — AI Personal Finance Assistant

> An AI-powered personal finance application that combines financial data, intelligent assistance, financial goals, market information, and personalized knowledge into a single dashboard.

## 🚀 Overview

**30cent** is a full-stack personal finance application designed to help users understand and interact with their financial information through a modern web dashboard and an AI assistant.

The project combines:

* Financial account and transaction data
* Cashflow visualization
* Financial goals
* AI-powered financial assistance
* Persistent AI conversations and user memory
* Retrieval-Augmented Generation (RAG)
* Model Context Protocol (MCP) servers
* Market and financial information
* Authentication and user-specific data
* Plaid Sandbox integration for simulated banking data

The application is built with a **Next.js frontend** and **FastAPI backend**, with database persistence and dedicated services for AI, RAG, MCP, authentication, and financial data.

---

## ✨ Features

### 💳 Financial Account Integration

Connect simulated financial accounts through **Plaid Sandbox**.

The application can work with sandbox financial data such as:

* Bank accounts
* Account balances
* Transactions
* Financial activity

Plaid Sandbox is used for demonstration and development without requiring real banking information.

---

### 📊 Financial Dashboard

The main dashboard provides an overview of the user's financial activity.

Current frontend components include:

* Cashflow visualization
* Transaction history
* Financial calendar
* Dashboard navigation
* Financial data summaries

---

### 💰 Cashflow Tracking

30cent processes transaction information to provide a visual representation of financial cashflow.

The `Cashflow` component is responsible for presenting this information in the frontend.

---

### 🧾 Transaction History

Transactions retrieved from connected financial accounts can be displayed through the transaction interface.

The project includes a dedicated:

```text
TransactionList.tsx
```

component for presenting transaction information.

---

### 🎯 Financial Goals

Users can create and manage financial goals.

The backend contains dedicated goal services and database migrations for financial goals.

```text
backend/
└── app/
    └── services/
        └── goal_service.py
```

The frontend provides a dedicated goals page:

```text
frontend/
└── app/
    └── goals/
        └── page.tsx
```

---

## 🤖 AI Financial Assistant

30cent includes an AI agent designed to interact with financial information and application capabilities.

The backend AI system is organized into:

```text
backend/app/agent/
├── agent.py
├── memory.py
├── tools.py
└── user_memory.py
```

This separates the AI system into different responsibilities such as:

* Agent orchestration
* Tool usage
* Conversation memory
* User-specific memory

---

## 🧠 Conversation Memory

The application supports persistent AI conversations rather than treating every conversation as completely independent.

The backend contains dedicated memory functionality and database migrations for conversation memory.

```text
backend/app/agent/
├── memory.py
└── user_memory.py
```

This allows the AI experience to maintain useful context across interactions.

---

## 🔎 RAG — Retrieval-Augmented Generation

30cent includes a Retrieval-Augmented Generation pipeline.

The RAG system is organized into:

```text
backend/app/rag/
├── embeddings.py
├── ingest.py
├── retriever.py
└── vector_store.py
```

The system separates the RAG workflow into:

1. Document ingestion
2. Embedding generation
3. Vector storage
4. Relevant-document retrieval

Database migrations also exist for RAG documents and document source tracking.

---

## 🔌 MCP Servers

The backend contains dedicated MCP servers for different information domains:

```text
backend/app/mcp/
├── finance_server.py
├── market_server.py
└── news_server.py
```

This provides a modular architecture for exposing different capabilities to the AI system.

The current MCP structure separates:

* Finance capabilities
* Market information
* News information

---

## 📈 Market & Financial Information

The application includes frontend components for interacting with market information.

```text
frontend/components/finance/
├── MarketNews.tsx
├── MarketOverview.tsx
├── StockDetails.tsx
├── StockSearch.tsx
└── Watchlist.tsx
```

These components support functionality such as:

* Market overview
* Stock search
* Stock details
* Watchlists
* Market news

---

## 🔐 Authentication

30cent includes authentication and user-specific application data.

The frontend contains:

```text
frontend/components/AuthGuard.tsx
frontend/app/login/page.tsx
```

The backend contains dedicated authentication functionality:

```text
backend/app/auth.py
backend/app/routes/auth_routes.py
```

User-related database migrations are also included.

---

# 🏗️ Architecture

```text
                         ┌──────────────────────┐
                         │       30cent         │
                         │ Personal Finance App │
                         └──────────┬───────────┘
                                    │
                 ┌──────────────────┴──────────────────┐
                 │                                     │
        ┌────────▼────────┐                   ┌────────▼────────┐
        │   Next.js       │                   │    FastAPI      │
        │    Frontend     │◄────── API ─────►│     Backend      │
        └────────┬────────┘                   └────────┬────────┘
                 │                                     │
        ┌────────▼────────┐             ┌──────────────┼──────────────┐
        │ UI Components   │             │              │              │
        │                 │             │              │              │
        │ • Dashboard     │        ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
        │ • Cashflow      │        │  Plaid  │   │   AI    │   │  RAG    │
        │ • Transactions  │        │ Sandbox │   │  Agent  │   │ System  │
        │ • Goals         │        └─────────┘   └────┬────┘   └─────────┘
        │ • Market Data  │                             │
        └─────────────────┘                      ┌─────▼─────┐
                                                 │    MCP    │
                                                 │  Servers  │
                                                 └───────────┘
                                                       │
                                     ┌─────────────────┼─────────────────┐
                                     │                 │                 │
                                ┌────▼────┐       ┌────▼────┐      ┌────▼────┐
                                │ Finance │       │ Market  │      │  News   │
                                │   MCP   │       │   MCP   │      │   MCP   │
                                └─────────┘       └─────────┘      └─────────┘

                              ┌──────────────────────┐
                              │      Supabase /      │
                              │   PostgreSQL DB      │
                              └──────────────────────┘
```

---

# 🛠️ Tech Stack

## Frontend

| Technology      | Purpose                                  |
| --------------- | ---------------------------------------- |
| Next.js         | Full-stack React framework / frontend    |
| React           | UI development                           |
| TypeScript      | Type-safe frontend development           |
| CSS             | Application styling                      |
| Supabase Client | Frontend authentication/data integration |

## Backend

| Technology            | Purpose                          |
| --------------------- | -------------------------------- |
| Python                | Backend development              |
| FastAPI               | REST API                         |
| SQLAlchemy            | Database interaction             |
| Alembic               | Database migrations              |
| PostgreSQL / Supabase | Persistent database              |
| Plaid                 | Financial account integration    |
| MCP                   | Modular AI tool servers          |
| RAG                   | Knowledge retrieval              |
| Embeddings            | Semantic document representation |

## AI

| Technology          | Purpose                         |
| ------------------- | ------------------------------- |
| AI Agent            | Financial assistant             |
| RAG                 | Context retrieval               |
| Vector Store        | Retrieval infrastructure        |
| MCP                 | Tool and capability integration |
| Conversation Memory | Persistent AI context           |
| User Memory         | User-specific context           |

---

# 📁 Project Structure

```text
30cent/
│
├── backend/
│   ├── alembic/
│   │   └── versions/
│   │       ├── add_financial_goals.py
│   │       ├── create_plaid_tables.py
│   │       ├── add_conversation_memory.py
│   │       ├── add_rag_documents.py
│   │       ├── add_user_profiles.py
│   │       └── add_rag_document_source_tracking.py
│   │
│   ├── app/
│   │   ├── agent/
│   │   │   ├── agent.py
│   │   │   ├── memory.py
│   │   │   ├── tools.py
│   │   │   └── user_memory.py
│   │   │
│   │   ├── mcp/
│   │   │   ├── finance_server.py
│   │   │   ├── market_server.py
│   │   │   └── news_server.py
│   │   │
│   │   ├── rag/
│   │   │   ├── embeddings.py
│   │   │   ├── ingest.py
│   │   │   ├── retriever.py
│   │   │   └── vector_store.py
│   │   │
│   │   ├── routes/
│   │   │   ├── agent_routes.py
│   │   │   ├── auth_routes.py
│   │   │   ├── goal_routes.py
│   │   │   ├── market_routes.py
│   │   │   ├── news_routes.py
│   │   │   └── stock_routes.py
│   │   │
│   │   ├── services/
│   │   │   └── goal_service.py
│   │   │
│   │   ├── auth.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── plaid_client.py
│   │   ├── plaid_routes.py
│   │   └── main.py
│   │
│   ├── requirements.txt
│   └── alembic.ini
│
├── frontend/
│   ├── app/
│   │   ├── ai/
│   │   ├── connect/
│   │   ├── finance/
│   │   ├── goals/
│   │   ├── login/
│   │   ├── auth-test/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── finance/
│   │   │   ├── MarketNews.tsx
│   │   │   ├── MarketOverview.tsx
│   │   │   ├── StockDetails.tsx
│   │   │   ├── StockSearch.tsx
│   │   │   └── Watchlist.tsx
│   │   │
│   │   ├── AuthGuard.tsx
│   │   ├── Cashflow.tsx
│   │   ├── FinancialCalendar.tsx
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── TransactionList.tsx
│   │
│   ├── lib/
│   │   ├── api-auth.ts
│   │   ├── api.ts
│   │   └── supabase.ts
│   │
│   ├── package.json
│   └── next.config.ts
│
└── README.md
```

---

# 🔄 How the Application Works

A simplified application flow looks like this:

```text
User
 │
 ▼
Next.js Frontend
 │
 ├── Dashboard
 ├── Finance
 ├── Goals
 ├── Connect
 ├── AI Assistant
 └── Market Information
 │
 ▼
FastAPI Backend
 │
 ├── Authentication
 ├── Financial APIs
 ├── Plaid Integration
 ├── Goal Services
 ├── AI Agent
 ├── RAG
 └── MCP
 │
 ├───────────────┐
 ▼               ▼
Database       External Services
 │               │
 ▼               ├── Plaid Sandbox
Supabase        │
PostgreSQL      └── Market / News sources
```

---

# ⚙️ Getting Started

## 1. Clone the repository

```bash
git clone https://github.com/Surajajax/30cent.git
cd 30cent
```

---

## 2. Backend Setup

Navigate to the backend:

```bash
cd backend
```

Create a virtual environment:

### Windows

```bash
python -m venv .venv
```

Activate it:

```bash
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## 3. Configure Backend Environment Variables

Create:

```text
backend/.env
```

Add the environment variables required by the backend services.

For example:

```env
DATABASE_URL=your_database_connection_string

PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox

SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

> Do not commit `.env` files or API keys to Git.

---

## 4. Database Setup

The project uses **Alembic** for database migrations.

From the `backend` directory:

```bash
alembic upgrade head
```

This applies the project's database migrations.

---

## 5. Start the Backend

From:

```text
backend/
```

run:

```bash
uvicorn app.main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

FastAPI's interactive API documentation can be accessed through:

```text
http://127.0.0.1:8000/docs
```

---

# 💻 Frontend Setup

Open another terminal and navigate to:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:3000
```

---

# 🏦 Plaid Sandbox

30cent uses **Plaid Sandbox** for development and demonstration of financial account functionality.

The Connect section allows the application to work with simulated banking data without connecting a real bank account.

The backend contains dedicated Plaid functionality:

```text
backend/app/plaid_client.py
backend/app/plaid_routes.py
```

The frontend connection interface is located at:

```text
frontend/app/connect/page.tsx
```

Plaid Sandbox credentials should be stored in the backend environment file and never committed to Git.

---

# 🧪 Testing

The backend currently contains tests related to AI memory and RAG functionality:

```text
backend/test_memory.py
backend/test_rag.py
```

Run tests according to the project's configured Python testing environment.

---

# 🔒 Security

Sensitive configuration should remain outside source control.

The project uses environment files for credentials such as:

* Database credentials
* Plaid credentials
* Supabase credentials
* AI/API credentials

Recommended practice:

```text
.env
.env.local
.venv/
.next/
__pycache__/
```

should remain excluded from Git.

---

# 🗺️ Roadmap

Potential future improvements include:

* [ ] Production banking integrations
* [ ] Improved financial analytics
* [ ] Budget recommendations
* [ ] More advanced AI financial planning
* [ ] Improved RAG document management
* [ ] More MCP tools
* [ ] Automated financial insights
* [ ] Advanced portfolio tracking
* [ ] Notifications and financial alerts
* [ ] Production deployment
* [ ] Improved testing and observability

---
# 🎯 What This Project Demonstrates

30cent brings together several areas of modern software engineering:

* Full-stack application development
* REST API development
* Authentication
* Database design
* Database migrations
* Financial API integration
* AI agent development
* Persistent conversation memory
* Retrieval-Augmented Generation
* Vector search architecture
* MCP-based tool integration
* Financial data visualization
* Market data interfaces
* TypeScript and Python development

The project is designed as a practical demonstration of how **AI systems can interact with structured financial data and external tools inside a full-stack application**.

---

# 👨‍💻 Author

**Suraj Saravanan**

B.Tech — Artificial Intelligence & Data Science

GitHub: [Surajajax](https://github.com/Surajajax)

LinkedIn: [Suraj Saravanan](https://www.linkedin.com/in/suraj-saravanan-p)

---

## 📄 License

This project is intended for educational, portfolio, and demonstration purposes.
