# Agent Guidelines for SplitEasy

This repository contains **SplitEasy**, a full-stack expense splitter application built for the AI Dev Tools Zoomcamp 2026.

## Workspace Layout
- `_docs/specs.md`: Product and API specifications.
- `frontend/`: Single Page Application (Vite + JavaScript/HTML/CSS).
- `backend/`: FastAPI application managed via `uv`, backed by SQLAlchemy & SQLite.

## Code Standards
- Keep frontend modular with clear separation of UI components and API calls.
- In backend, follow standard FastAPI structures with Pydantic models for request/response validation.
- All database operations should be encapsulated in database/repository utility functions.
- Every API endpoint must have corresponding test coverage in `backend/tests/`.
