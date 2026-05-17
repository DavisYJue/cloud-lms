FROM python:3.13-slim

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Install dependencies
COPY pyproject.toml .
RUN uv sync --no-dev

# Copy application code
COPY app/ app/
COPY main.py .

# Pre-download embedding model
RUN uv run python - <<'EOF'
from sentence_transformers import SentenceTransformer
SentenceTransformer("BAAI/bge-m3")
EOF

# Run as non-root
RUN useradd -m raguser
USER raguser

VOLUME ["/app/data"]

CMD ["uv", "run", "python", "main.py"]