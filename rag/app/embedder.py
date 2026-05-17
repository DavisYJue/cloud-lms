from sentence_transformers import SentenceTransformer

from app.config import EMBEDDING_MODEL

_model = SentenceTransformer(EMBEDDING_MODEL)


def embed(text: str) -> list[float]:
    return _model.encode(text, normalize_embeddings=True).tolist()