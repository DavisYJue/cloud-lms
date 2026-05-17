import os
import hashlib

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.query import query_rag
from app.store.elastic import count_chunks, get_manifest
from app.ingest import _ingest_file_by_path, _remove_file, cancel_flags

app = FastAPI(
    title="Goated LMS RAG API",
    description="Retrieval-Augmented Generation over your PDF documents.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

RAG_INTERNAL_SECRET = os.getenv("RAG_INTERNAL_SECRET", "changeme")


# Schemas

class QuestionRequest(BaseModel):
    question: str
    file_paths: list[str] | None = None  # None = no filter (admin)
    db_summary: str = ""                 # DB context (injected only at final LLM call)
    role: str = ""                       # User role (for role-aware prompt)

class AnswerResponse(BaseModel):
    question: str
    answer: str

class StatusResponse(BaseModel):
    status: str
    total_chunks: int

class IngestRequest(BaseModel):
    file_path: str
    secret: str

class DeleteRequest(BaseModel):
    file_path: str
    secret: str


# Helpers

def _check_secret(secret: str):
    if secret != RAG_INTERNAL_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden.")

def _hash_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(65536), b""):
            h.update(block)
    return h.hexdigest()


# Routes

@app.get("/", response_model=StatusResponse)
def health():
    try:
        chunks = count_chunks()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Elasticsearch unreachable: {e}")
    return {"status": "ok", "total_chunks": chunks}


@app.post("/ask", response_model=AnswerResponse)
def ask(body: QuestionRequest):
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    answer = query_rag(
        body.question,
        file_paths=body.file_paths,
        db_summary=body.db_summary,
        role=body.role,
    )
    return {"question": body.question, "answer": answer}


@app.post("/ingest")
def ingest(body: IngestRequest):
    _check_secret(body.secret)

    if not os.path.isfile(body.file_path):
        raise HTTPException(status_code=404, detail=f"File not found: {body.file_path}")

    if not body.file_path.lower().endswith(".pdf"):
        return {"skipped": True, "reason": "Not a PDF file."}

    file_name = body.file_path
    file_hash = _hash_file(body.file_path)

    manifest = get_manifest()
    if manifest.get(file_name) == file_hash:
        return {"skipped": True, "reason": "File already ingested and unchanged."}

    if file_name in manifest:
        _remove_file(file_name)

    cancel_flags.discard(file_name)
    _ingest_file_by_path(file_name, file_hash, body.file_path)

    if file_name in cancel_flags:
        cancel_flags.discard(file_name)
        _remove_file(file_name)
        return {"cancelled": True, "file": file_name}

    return {"success": True, "file": file_name}


@app.delete("/ingest")
def delete_ingested(body: DeleteRequest):
    _check_secret(body.secret)

    file_name = body.file_path
    cancel_flags.add(file_name)

    manifest = get_manifest()
    if file_name in manifest:
        _remove_file(file_name)
        cancel_flags.discard(file_name)
        return {"success": True, "file": file_name}

    return {"success": True, "file": file_name, "note": "Ingest in progress — will be cleaned up."}