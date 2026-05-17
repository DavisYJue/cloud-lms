"""
main.py — RAG system entry point.

  1. Init storage (Qdrant + Elasticsearch)
  2. Sync /data against the manifest
  3. Start FastAPI server
"""

import uvicorn

from app.store import init_collection, init_indices
from app.ingest import sync_data_dir

DIVIDER = "=" * 60


def main() -> None:
    print(f"\n{DIVIDER}")
    print("  [Init] Setting up storage...")
    init_collection()
    init_indices()

    print("\n  [Sync] Checking data directory for changes...")
    sync_data_dir()

    print(f"\n{DIVIDER}")
    print("  RAG API ready at http://0.0.0.0:8000")
    print(f"{DIVIDER}\n")

    uvicorn.run(
        "app.api:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
    )


if __name__ == "__main__":
    main()