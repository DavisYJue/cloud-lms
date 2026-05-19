import ast
import re

from langchain_ollama import ChatOllama

from app.config import OLLAMA_BASE_URL, OLLAMA_CTX, OLLAMA_MODEL, OLLAMA_TEMPERATURE
from app.embedder import embed
from app.store.elastic import get_chunks
from app.store.qdrant import search

_llm = ChatOllama(
    model=OLLAMA_MODEL,
    base_url=OLLAMA_BASE_URL,
    temperature=OLLAMA_TEMPERATURE,
    num_ctx=OLLAMA_CTX,
    timeout=120,
    stop=["Enter command number:", "Observation:"],
    extra_body={"think": False},
)


# Role notes

_ROLE_NOTES = {
    "student":        "The user is a student. They can only see their own data.",
    "teacher":        "The user is a teacher. They can see their courses, students, TAs, and submissions.",
    "assistant":      "The user is a teaching assistant. They can see assigned courses and participant courses.",
    "administrator":  "The user is an administrator with access to all system data.",
}

_OFF_TOPIC_RESPONSE = (
    "I can only answer questions related to this LMS — "
    "your courses, assignments, grades, materials, and system features."
)


# Prompts

def _build_rag_prompt(question: str, contexts: list[dict], db_summary: str = "", role: str = "") -> str:
    role_note = _ROLE_NOTES.get(role, "")

    db_section = f"DATABASE CONTEXT:\n{db_summary}" if db_summary else ""

    if contexts:
        context_text = "\n\n".join(
            f"[DOC {i + 1} | {c.get('file_name', '')} p.{c.get('metadata', {}).get('page', '?')}]\n{c['text']}"
            for i, c in enumerate(contexts)
        )
        doc_section = f"DOCUMENT CONTEXT:\n{context_text}"
    else:
        doc_section = "DOCUMENT CONTEXT:\nNo relevant documents found."

    return f"""You are a university LMS assistant. {role_note}

RULES:
- Use DATABASE CONTEXT for operational data: grades, submissions, enrollments, profiles.
- Use DOCUMENT CONTEXT for academic/content questions from course PDFs.
- Only refuse with "You do not have access to this feature." if the user explicitly tries to perform an action their role cannot do (e.g. a student trying to add a course). Do NOT block informational questions about how the system works or what pages/routes exist.
- If DOCUMENT CONTEXT says "No relevant documents found" AND the DATABASE CONTEXT does not contain the answer, you MUST reply with exactly: "{_OFF_TOPIC_RESPONSE}" — do NOT use your own training knowledge under any circumstances.
- Do NOT hallucinate. If a grade or submission is not in the data, say it's not found.
- Be concise and factual. Cite document/page when relevant.

{db_section}

{doc_section}

QUESTION:
{question}

ANSWER:""".strip()


_DECOMPOSE_PROMPT = """\
Break this question into simple, focused sub-queries for a search engine.
Return only a Python list of strings, nothing else. No explanation, no markdown, no backticks.

Question: {question}
Example output: ["What is JavaScript?", "What is C++?", "What is Python?"]
Output:"""


# LLM helpers

def _call_llm(prompt: str) -> str:
    try:
        raw = _llm.invoke(prompt).content
        # Strip any residual <think>...</think> blocks just in case
        return re.sub(r"<think>[\s\S]*?</think>", "", raw, flags=re.IGNORECASE).strip()
    except Exception as e:
        return f"LLM error: {e}"


def _decompose(question: str) -> list[str]:
    raw = _call_llm(_DECOMPOSE_PROMPT.format(question=question)).strip()
    cleaned = re.sub(r"^```[a-z]*\n?", "", raw)
    cleaned = re.sub(r"```$", "", cleaned).strip()
    try:
        result = ast.literal_eval(cleaned)
        if isinstance(result, list) and all(isinstance(q, str) for q in result):
            print(f"[Query] Decomposed into {len(result)} sub-queries: {result}")
            return result
    except Exception:
        pass
    return [question]


# RAG pipeline

def query_rag(
    question: str,
    file_paths: list[str] | None = None,
    db_summary: str = "",
    role: str = "",
) -> str:
    # Try direct search first, skip decomposition if get enough hits
    direct_hits = search(embed(question), limit=10, file_names=file_paths)

    seen: set[str] = set()
    chunk_ids: list[str] = []

    for hit in direct_hits:
        cid = getattr(hit, "id", None) or hit.payload.get("chunk_id")
        if cid and cid not in seen:
            seen.add(cid)
            chunk_ids.append(cid)

    # Only decompose if direct search returned fewer than 3 chunks
    if len(chunk_ids) < 3:
        sub_questions = _decompose(question)
        print(f"[Query] Direct search returned {len(chunk_ids)} chunks — decomposing into sub-queries.")
        for sq in sub_questions:
            for hit in search(embed(sq), limit=5, file_names=file_paths):
                cid = getattr(hit, "id", None) or hit.payload.get("chunk_id")
                if cid and cid not in seen:
                    seen.add(cid)
                    chunk_ids.append(cid)
    else:
        print(f"[Query] Direct search returned {len(chunk_ids)} chunks — skipping decomposition.")

    # Cap total chunks sent to LLM to avoid bloating the context
    chunk_ids = chunk_ids[:10]

    # Fetch from Elasticsearch
    contexts = get_chunks(chunk_ids) if chunk_ids else []

    # Print context
    if contexts:
        print(f"\n[RAG] Retrieved {len(contexts)} chunks:")
        for i, c in enumerate(contexts):
            print(f"\n--- DOC {i+1} | {c.get('file_name', 'unknown')} p.{c.get('metadata', {}).get('page', '?')} ---")
            print(c['text'])
        print("\n" + "=" * 60 + "\n")
    else:
        print("[RAG] No chunks retrieved.\n")

    # Hard-stop off-topic questions before hitting the LLM
    if not contexts and not db_summary.strip():
        print("[RAG] No context and no DB summary — returning off-topic response.")
        return _OFF_TOPIC_RESPONSE

    # DB summary injected
    return _call_llm(_build_rag_prompt(question, contexts, db_summary, role))