.PHONY: install-backend install-frontend test-backend test-frontend lint-backend lint-frontend dev-backend dev-frontend build

install-backend:
	cd backend && uv sync

install-frontend:
	cd frontend && bun install

test-backend:
	cd backend && uv run pytest

test-frontend:
	cd frontend && bun run test

lint-backend:
	cd backend && uv run ruff check .

lint-frontend:
	cd frontend && bun run lint

dev-backend:
	cd backend && uv run uvicorn main:app --reload

dev-frontend:
	cd frontend && bun run dev

build:
	docker-compose build
