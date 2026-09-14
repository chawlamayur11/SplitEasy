# SplitEasy 💰

**SplitEasy** is an AI-assisted full-stack expense splitting web application built as part of **Homework 2 of the AI Dev Tools Zoomcamp 2026**.

## Features
- 👥 **Group Management**: Create groups and add participants.
- 💵 **Expense Tracking**: Log shared group expenses with equal or exact split amounts.
- 📊 **Balance Calculation**: Automatically compute net balances and optimal "who owes whom" settlements.
- 🤝 **Settlement**: Mark debts as settled with real-time balance updates.

## Tech Stack
- **Frontend**: Vite, HTML5, CSS3, JavaScript (ES6+)
- **Backend**: FastAPI (Python), `uv` package manager
- **Database**: SQLite with SQLAlchemy ORM
- **Testing**: `pytest`

## Quick Start

### 1. Backend Setup
```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```
Backend API will be running at `http://localhost:8000`. API docs available at `http://localhost:8000/docs`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend app will be available at `http://localhost:5173`.

### 3. Running Tests
```bash
cd backend
uv run pytest
```

---

## Homework 2 Submission Details
- **Q1 (Project Idea)**: Expense splitter
- **Q2 (App Name)**: SplitEasy
- **Q3 (Git Commit SHA1)**: See git history or run `git rev-parse HEAD`
- **Q4 (Frontend Command)**: `npm run dev`
- **Q5 (Backend Command)**: `uv run uvicorn app.main:app --reload`
- **Q6 (Frontend Backend URL)**: `http://localhost:8000`
- **Q7 (Test Command)**: `uv run pytest`
