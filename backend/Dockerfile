# Use a Python image with uv pre-installed or install it
FROM python:3.12-slim

# Copy uv from the official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set the working directory in the container
WORKDIR /app

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy the lock file and pyproject.toml
COPY pyproject.toml uv.lock ./

# Install dependencies using uv
# --frozen ensures we use the exact versions in uv.lock
# --no-install-project installs only dependencies, not the project itself
RUN uv sync --frozen --no-install-project --no-cache

# Copy the current directory contents into the container at /app
COPY . .

# Place the virtual environment in the PATH
ENV PATH="/app/.venv/bin:$PATH"

# Expose port 8000
EXPOSE 8000

# Run uvicorn server
# Note: --reload is removed for production. For dev, override CMD in docker-compose.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
