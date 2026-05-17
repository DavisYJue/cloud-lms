import os

# Vector store
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "rag_vectors_v2")
VECTOR_SIZE = int(os.getenv("VECTOR_SIZE", "1024"))

# Elasticsearch
ES_URL = os.getenv("ES_URL", "http://localhost:9200")
ES_CHUNKS_INDEX = os.getenv("ES_CHUNKS_INDEX", "rag_chunks")
ES_MANIFEST_INDEX = os.getenv("ES_MANIFEST_INDEX", "rag_manifest")

# Embedding
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-m3")

# LLM
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "deepseek-r1:8b")
OLLAMA_TEMPERATURE = float(os.getenv("OLLAMA_TEMPERATURE", "0.2"))
OLLAMA_CTX = int(os.getenv("OLLAMA_CTX", "4096"))

# Ingestion
DATA_DIR = os.getenv("DATA_DIR", "data")
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "800"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "150"))