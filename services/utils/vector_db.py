from qdrant_client import QdrantClient
from qdrant_client.models import Fusion, FusionQuery, Prefetch, SparseVector, Distance, VectorParams, PointStruct, SparseVectorParams
from typing import TYPE_CHECKING, List, Dict, Any, Optional

if TYPE_CHECKING:
    from fastembed import TextEmbedding, SparseTextEmbedding
    from fastembed.rerank.cross_encoder import TextCrossEncoder


import numpy as np
from qdrant_client.models import Modifier
from pathlib import Path as _Path

_MODELS_DIR = _Path(__file__).resolve().parent.parent.parent / "models"

# Module-level singletons — survive across requests, only reload on process restart.
_dense_model: Optional["TextEmbedding"] = None
_sparse_model: Optional["SparseTextEmbedding"] = None
_cross_encoder: Optional["TextCrossEncoder"] = None

def _get_dense_model(name: str = "BAAI/bge-small-en-v1.5") -> "TextEmbedding":
    global _dense_model
    if _dense_model is None:
        from fastembed import TextEmbedding
        _dense_model = TextEmbedding(model_name=name, cache_dir=str(_MODELS_DIR / 'dense_model'))
    return _dense_model

def _get_sparse_model(name: str = "prithivida/Splade_PP_en_v1") -> "SparseTextEmbedding":
    global _sparse_model
    if _sparse_model is None:
        from fastembed import SparseTextEmbedding
        _sparse_model = SparseTextEmbedding(model_name=name, cache_dir=str(_MODELS_DIR / 'sparse_model'))
    return _sparse_model

def _get_cross_encoder(name: str = 'jinaai/jina-reranker-v2-base-multilingual') -> "TextCrossEncoder":
    global _cross_encoder
    if _cross_encoder is None:
        from fastembed.rerank.cross_encoder import TextCrossEncoder

        _cross_encoder = TextCrossEncoder(model_name=name, cache_dir=str(_MODELS_DIR / 'cross_encoder_model'))
    return _cross_encoder


class QdrantStorage:
    def __init__(self, host: str = 'localhost', port: int = 6333, dense_model_name: str = "BAAI/bge-small-en-v1.5", sparse_model_name: str = "prithivida/Splade_PP_en_v1"):
        self.client = QdrantClient(host=host, port=port)
        self._dense_model_name = dense_model_name
        self._sparse_model_name = sparse_model_name
        self.vector_size = 384  # bge-small-en-v1.5 embedding size

    @property
    def dense_model(self) -> "TextEmbedding":
        return _get_dense_model(self._dense_model_name)

    @property
    def sparse_model(self) -> "SparseTextEmbedding":
        return _get_sparse_model(self._sparse_model_name)
    
    def create_collection(self, collection: str, vector_size: int = 384) -> bool:
        """
        Create a collection with dense and sparse vectors.
        """
        self.vector_size = vector_size
        if self.client.collection_exists(collection):
            return False
        
        self.client.create_collection(
            collection_name=collection,
            vectors_config={
                "dense": VectorParams(size=vector_size, distance=Distance.COSINE)
            },
            sparse_vectors_config={
                "sparse": SparseVectorParams(modifier=Modifier.IDF)
            }
        )
        return True
    
    def insert_point(self, text: str, payload: Dict[str, Any], collection: str = "documents") -> bool:
        """
        Insert a single point with dense and sparse embeddings.
        """
        # Generate embeddings
        dense_embedding = list(self.dense_model.embed([text]))[0].tolist()
        sparse = list(self.sparse_model.embed([text]))[0]
        
        # Create point
        point = PointStruct(
            id=np.random.randint(1, 1000000),
            vector={
                "dense": dense_embedding,
                "sparse": SparseVector(
                    indices=sparse.indices.tolist(),
                    values=sparse.values.tolist()
                )
            },
            payload={"text": text, **payload}
        )
        
        self.client.upsert(
            collection_name=collection,
            points=[point]
        )
        return True
    
    def insert_chunks(self, chunks: List[Any], metadata: Dict[str, Any], collection: str = "documents") -> int:
        """
        Insert multiple chunks with embeddings.
        Returns the number of inserted chunks.
        """
        if not chunks:
            return 0
        
        # Create collection if not exists
        self.create_collection(collection, self.vector_size)
        
        points = []
        for i, chunk in enumerate(chunks):
            text = chunk.text if hasattr(chunk, 'text') else str(chunk)
            
            # Generate embeddings
            dense_embedding = list(self.dense_model.embed([text]))[0].tolist()
            sparse = list(self.sparse_model.embed([text]))[0]
            
            # Add metadata to payload
            chunk_metadata = {**metadata, "chunk_index": i}
            if hasattr(chunk, 'metadata'):
                chunk_metadata.update(chunk.metadata)
            
            point = PointStruct(
                id=i,
                vector={
                    "dense": dense_embedding,
                    "sparse": SparseVector(
                        indices=sparse.indices.tolist(),
                        values=sparse.values.tolist()
                    )
                },
                payload={"text": text, **chunk_metadata}
            )
            points.append(point)
        
        if points:
            self.client.upsert(
                collection_name=collection,
                points=points
            )
        
        return len(points)
    
    def query(self, query: str, collection: str = "documents", limit: int = 5) -> List[Dict[str, Any]]:
        """
        Query the collection using hybrid search (dense + sparse) with cross-encoder reranking.
        Returns list of results with text and payload.
        """
        if not self.client.collection_exists(collection):
            return []

        # Generate query embeddings
        dense_embedding = list(self.dense_model.embed([query]))[0].tolist()
        sparse = list(self.sparse_model.embed([query]))[0]

        # Over-fetch candidates for reranking
        prefetch_limit = max(limit * 4, 20)

        search_result = self.client.query_points(
            collection_name=collection,
            prefetch=[
                Prefetch(query=dense_embedding, using="dense", limit=prefetch_limit),
                Prefetch(
                    query=SparseVector(
                        indices=sparse.indices.tolist(),
                        values=sparse.values.tolist()
                    ),
                    using="sparse",
                    limit=prefetch_limit
                ),
            ],
            query=FusionQuery(fusion=Fusion.RRF),
            limit=prefetch_limit,
        )

        if not search_result.points:
            return []

        # Rerank with cross-encoder
        cross_encoder = _get_cross_encoder()
        documents = [
            (point.payload or {}).get("text", "") for point in search_result.points
        ]
        rerank_scores = list(cross_encoder.rerank(query, documents))

        # Pair points with rerank scores and sort descending
        scored = sorted(
            zip(search_result.points, rerank_scores),
            key=lambda x: x[1],
            reverse=True,
        )

        # Format top results
        results = []
        for point, score in scored[:limit]:
            payload = point.payload or {}
            results.append({
                "id": point.id,
                "text": payload.get("text", ""),
                "score": float(score),
                "metadata": {k: v for k, v in payload.items() if k != "text"}
            })
        return results


# Alias for backward compatibility
VectorDatabase = QdrantStorage