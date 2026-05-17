import time

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchAny,
    MatchValue,
    PointStruct,
    VectorParams,
)

from app.config import QDRANT_COLLECTION, QDRANT_HOST, QDRANT_PORT, VECTOR_SIZE

client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)


def init_collection() -> None:
    for attempt in range(1, 11):
        try:
            existing = {c.name for c in client.get_collections().collections}
            break
        except Exception as e:
            if attempt == 10:
                raise RuntimeError(f"Qdrant not reachable after 10 attempts: {e}")
            print(f"[Qdrant] Waiting for connection (attempt {attempt}/10)...")
            time.sleep(3)

    if QDRANT_COLLECTION not in existing:
        client.create_collection(
            collection_name=QDRANT_COLLECTION,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )
        print(f"[Qdrant] Created collection '{QDRANT_COLLECTION}'")
    else:
        print(f"[Qdrant] Collection '{QDRANT_COLLECTION}' already exists")


def upsert_chunk(chunk_id: str, vector: list[float], payload: dict) -> None:
    client.upsert(
        collection_name=QDRANT_COLLECTION,
        points=[PointStruct(id=chunk_id, vector=vector, payload=payload)],
    )


def delete_chunks_by_file(file_name: str) -> None:
    client.delete(
        collection_name=QDRANT_COLLECTION,
        points_selector=Filter(
            must=[FieldCondition(key="file_name", match=MatchValue(value=file_name))]
        ),
    )
    print(f"[Qdrant] Deleted vectors for: {file_name}")


def search(vector: list[float], limit: int = 10, file_names: list[str] | None = None) -> list:
    """
    Search for similar vectors.
    - file_names=None: no filter, search all chunks (admin)
    - file_names=[]: user has no accessible files, return empty immediately
    - file_names=[...]: filter to only those files
    """
    if file_names is not None and len(file_names) == 0:
        return []

    query_filter = None
    if file_names is not None:
        query_filter = Filter(
            must=[
                FieldCondition(
                    key="file_name",
                    match=MatchAny(any=file_names),
                )
            ]
        )

    return client.query_points(
        collection_name=QDRANT_COLLECTION,
        query=vector,
        limit=limit,
        query_filter=query_filter,
    ).points