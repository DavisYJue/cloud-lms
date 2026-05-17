import hashlib
import os
import uuid

from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import CHUNK_OVERLAP, CHUNK_SIZE, DATA_DIR, EMBEDDING_MODEL
from app.embedder import embed
from app.store.elastic import (
    delete_chunks_by_file as es_delete_chunks,
    delete_manifest_entry,
    get_manifest,
    index_chunk,
    upsert_manifest_entry,
)
from app.store.qdrant import delete_chunks_by_file as qdrant_delete_chunks, upsert_chunk

# In-memory set of file_names pending cancellation
cancel_flags: set[str] = set()

# Helpers

def _hash_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(65536), b""):
            h.update(block)
    return h.hexdigest()


def _load_and_chunk(path: str) -> list:
    if path.lower().endswith(".md"):
        docs = TextLoader(path, encoding="utf-8").load()
    else:
        docs = PyPDFLoader(path).load()
    return RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP
    ).split_documents(docs)


# Core operations

def _ingest_file(file_name: str, file_hash: str) -> None:
    """Ingest from the default DATA_DIR (used by sync_data_dir)."""
    path = os.path.join(DATA_DIR, file_name)
    _ingest_file_by_path(file_name, file_hash, path)


def _ingest_file_by_path(file_name: str, file_hash: str, absolute_path: str) -> None:
    """Ingest a PDF from any absolute path. file_name is used as the unique key."""
    print(f"  → Loading: {absolute_path}")

    chunks = _load_and_chunk(absolute_path)
    print(f"  → {len(chunks)} chunks to ingest")

    for i, doc in enumerate(chunks):
        # Check cancellation flag on every chunk
        if file_name in cancel_flags:
            print(f"  ✗ Ingest cancelled at chunk {i+1}/{len(chunks)}: {file_name}")
            return

        chunk_id = str(uuid.uuid4())
        text = doc.page_content
        page = doc.metadata.get("page", 0)

        chunk = {
            "chunk_id":        chunk_id,
            "file_name":       file_name,
            "file_hash":       file_hash,
            "chunk_index":     i,
            "text":            text,
            "embedding_model": EMBEDDING_MODEL,
            "metadata":        {"page": page, "source": file_name},
        }

        vector = embed(text)

        upsert_chunk(
            chunk_id=chunk_id,
            vector=vector,
            payload={
                "chunk_id":    chunk_id,
                "file_name":   file_name,
                "file_hash":   file_hash,
                "chunk_index": i,
                "metadata":    chunk["metadata"],
            },
        )
        index_chunk(chunk)
        print(f"  → [{i + 1}/{len(chunks)}] ingested chunk {chunk_id[:8]}...")

    upsert_manifest_entry(file_name, file_hash)
    print(f"  ✓ Done: {file_name}")


def _remove_file(file_name: str) -> None:
    print(f"  → Removing: {file_name}")
    qdrant_delete_chunks(file_name)
    es_delete_chunks(file_name)
    delete_manifest_entry(file_name)
    print(f"  ✓ Removed: {file_name}")


# Sync entry point

def sync_data_dir() -> None:
    """Diff /data against the manifest and apply changes.
    Only manages entries that originated from /data (no leading slash in key).
    Entries ingested via /ingest endpoint use absolute paths and are left untouched.
    """
    if not os.path.isdir(DATA_DIR):
        print(f"[Ingest] Data directory '{DATA_DIR}' not found — skipping.")
        return

    disk: dict[str, str] = {
        f: _hash_file(os.path.join(DATA_DIR, f))
        for f in os.listdir(DATA_DIR)
        if f.lower().endswith(".md")
    }

    full_manifest: dict[str, str] = get_manifest()

    # Only consider manifest entries that are plain filenames (from /data)
    # Entries from /ingest use absolute paths starting with "/"
    manifest: dict[str, str] = {
        k: v for k, v in full_manifest.items()
        if not k.startswith("/")
    }

    added     = [f for f in disk if f not in manifest]
    deleted   = [f for f in manifest if f not in disk]
    changed   = [f for f in disk if f in manifest and disk[f] != manifest[f]]
    unchanged = [f for f in disk if f in manifest and disk[f] == manifest[f]]

    print(
        f"\n[Ingest] Sync summary:\n"
        f"  New      : {len(added)}\n"
        f"  Changed  : {len(changed)}\n"
        f"  Deleted  : {len(deleted)}\n"
        f"  Unchanged: {len(unchanged)}\n"
    )

    for f in deleted:
        _remove_file(f)
    for f in changed:
        print(f"[Ingest] Re-ingesting changed file: {f}")
        _remove_file(f)
        _ingest_file(f, disk[f])
    for f in added:
        print(f"[Ingest] Ingesting new file: {f}")
        _ingest_file(f, disk[f])

    if not any([added, changed, deleted]):
        print("[Ingest] All files up to date — nothing to do.")