import os
import shutil
import tempfile
from typing import Optional, Dict, Any
from pathlib import Path
from fastapi import UploadFile
from docling.document_converter import DocumentConverter
from docling_core.transforms.chunker.hybrid_chunker import HybridChunker
from services.utils.ingest import ingest_document
from services.utils.vector_db import QdrantStorage

def handle_rag_upload(upload_file: UploadFile, converter: DocumentConverter, metadata: Optional[Dict[str, Any]] = None,) -> int:
    """
    Saves the uploaded file to a temporary location, ingests via docling,
    chunks using HybridChunker, and uploads to QdrantStorage.
    Returns the number of inserted chunks.
    """
    if metadata is None:
        metadata = {}
        
    filename = upload_file.filename or "unknown"
    metadata["filename"] = filename

    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(filename).suffix) as tmp:
        try:
            shutil.copyfileobj(upload_file.file, tmp)
            tmp_path = Path(tmp.name)
        finally:
            upload_file.file.close()

    try:
        doc = ingest_document(tmp_path, converter)
        
        chunker = HybridChunker()
        chunks = list(chunker.chunk(doc))
        
        storage = QdrantStorage()
        inserted_count = storage.insert_chunks(chunks, metadata)
        return inserted_count
    finally:
        if tmp_path.exists():
            os.remove(tmp_path)
