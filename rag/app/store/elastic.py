from elasticsearch import Elasticsearch

from app.config import ES_CHUNKS_INDEX, ES_MANIFEST_INDEX, ES_URL

es = Elasticsearch(ES_URL)


# Init

def init_indices() -> None:
    _create_chunks_index()
    _create_manifest_index()


def _create_chunks_index() -> None:
    if es.indices.exists(index=ES_CHUNKS_INDEX):
        return
    es.indices.create(
        index=ES_CHUNKS_INDEX,
        mappings={
            "properties": {
                "chunk_id":        {"type": "keyword"},
                "file_name":       {"type": "keyword"},
                "file_hash":       {"type": "keyword"},
                "chunk_index":     {"type": "integer"},
                "text":            {"type": "text"},
                "embedding_model": {"type": "keyword"},
                "metadata": {
                    "properties": {
                        "page":   {"type": "integer"},
                        "source": {"type": "keyword"},
                    }
                },
            }
        },
    )
    print(f"[ES] Created index '{ES_CHUNKS_INDEX}'")


def _create_manifest_index() -> None:
    if es.indices.exists(index=ES_MANIFEST_INDEX):
        return
    es.indices.create(
        index=ES_MANIFEST_INDEX,
        mappings={
            "properties": {
                "file_name": {"type": "keyword"},
                "file_hash": {"type": "keyword"},
            }
        },
    )
    print(f"[ES] Created index '{ES_MANIFEST_INDEX}'")


# Chunks

def index_chunk(chunk: dict) -> None:
    es.index(
        index=ES_CHUNKS_INDEX,
        id=chunk["chunk_id"],
        document=chunk,
        refresh=True,
    )


def get_chunks(chunk_ids: list[str]) -> list[dict]:
    if not chunk_ids:
        return []
    res = es.search(
        index=ES_CHUNKS_INDEX,
        size=len(chunk_ids),
        query={"terms": {"chunk_id": chunk_ids}},
    )
    return [
        {
            "chunk_id":    hit["_source"]["chunk_id"],
            "file_name":   hit["_source"].get("file_name", ""),
            "chunk_index": hit["_source"].get("chunk_index", -1),
            "text":        hit["_source"]["text"],
            "metadata":    hit["_source"].get("metadata", {}),
        }
        for hit in res["hits"]["hits"]
    ]


def delete_chunks_by_file(file_name: str) -> None:
    es.delete_by_query(
        index=ES_CHUNKS_INDEX,
        body={"query": {"term": {"file_name": file_name}}},
        refresh=True,
    )
    print(f"[ES] Deleted chunks for: {file_name}")


def count_chunks() -> int:
    return es.count(index=ES_CHUNKS_INDEX)["count"]


# Manifest

def get_manifest() -> dict[str, str]:
    try:
        res = es.search(index=ES_MANIFEST_INDEX, size=10_000, query={"match_all": {}})
        return {h["_source"]["file_name"]: h["_source"]["file_hash"] for h in res["hits"]["hits"]}
    except Exception:
        return {}


def upsert_manifest_entry(file_name: str, file_hash: str) -> None:
    es.index(
        index=ES_MANIFEST_INDEX,
        id=file_name,
        document={"file_name": file_name, "file_hash": file_hash},
        refresh=True,
    )


def delete_manifest_entry(file_name: str) -> None:
    try:
        es.delete(index=ES_MANIFEST_INDEX, id=file_name, refresh=True)
    except Exception:
        pass