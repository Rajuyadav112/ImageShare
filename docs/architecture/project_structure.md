# Project Structure & Monorepo Design
## Phase 4 Deliverable (Polyglot Monorepo: Next.js + FastAPI)

---

## 1. Monorepo Folder Structure

Since we are combining a **TypeScript Frontend (Next.js)** with a **Python Backend (FastAPI)** for AI integrations, we are using a Polyglot Monorepo. We recommend using **Turborepo** to orchestrate tasks across both languages.

```text
aurashare-monorepo/
├── apps/
│   ├── web/               # Next.js (App Router) Frontend (TypeScript)
│   │   ├── package.json
│   │   └── src/
│   └── api/               # FastAPI Backend (Python)
│       ├── pyproject.toml
│       ├── requirements.txt
│       └── app/
│
├── packages/
│   ├── ui/                # Shared UI Components (Shadcn UI, Tailwind)
│   └── config/            # Shared ESLint/Prettier configs for frontend
│
├── docs/                  # Project Documentation
│   ├── architecture/      # System, DB, and Monorepo design documents
│   └── diary/             # Developer changelogs / decision records
│
├── infrastructure/        # Infrastructure as Code & Deployment
│   └── docker/            # Dockerfiles (web.Dockerfile, api.Dockerfile)
│
└── turbo.json             # Monorepo task runner configuration
```

---

## 2. Naming Conventions

### 2.1 Python Backend (FastAPI)
* **snake_case**: File names, folder names, variables, and functions (e.g., `image_service.py`, `upload_image()`).
* **PascalCase**: Pydantic Models, SQLModel classes, and standard Python classes (e.g., `ImageModel`, `UserAuth`).
* **UPPER_SNAKE_CASE**: Environment variables and constants.

### 2.2 TypeScript Frontend (Next.js)
* **kebab-case**: Folders and utility files (e.g., `image-gallery`, `format-date.ts`).
* **PascalCase**: React Components and Interfaces (e.g., `UploadZone.tsx`, `UserProps`).
* **camelCase**: Variables and functions.

---

## 3. Coding Standards

### 3.1 Backend (Python)
* **Type Hinting**: All Python code MUST use strict type hints.
* **Formatter/Linter**: Use **Ruff** or **Black + ruff** for blazing fast linting and formatting. Line length set to 88.
* **ORM**: Use **SQLModel** (which wraps Pydantic and SQLAlchemy) for interacting with Supabase.
* **AI Tooling**: Use standard official SDKs (e.g., `openai` python package) and wrap external calls in `try/except` with proper logging.

### 3.2 Frontend (TypeScript)
* **Strict mode**: Enforced (`"strict": true`). Avoid `any`.
* **ESLint/Prettier**: Globally configured in `@packages/config`.
* **State Management**: React Query for fetching data from the FastAPI endpoints.

### 3.3 API Design & Parity
* Because we cannot natively share TypeScript interfaces with Python, the FastAPI backend will act as the single source of truth. 
* FastAPI will auto-generate the `openapi.json` schema. We will use a tool like `openapi-typescript` or `orval` in the frontend to automatically generate the TypeScript types matching the backend.
