from pathlib import Path
import time
from docling.document_converter import DocumentConverter
from docling_core.transforms.chunker.hybrid_chunker import HybridChunker

_chunker = HybridChunker()
def ingest_document(file_path: str | Path, converter : DocumentConverter):
    """
    Ingests a document using docling and returns its doc object.
    """

    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")   
    start = time.time()
    result = converter.convert(path)
    print(f"[INGEST] Converted in {time.time() - start} seconds")
    return result.document

def chunk_document(doc):
    """
    Chunks a docling document using HybridChunker.
    """
    chunks = list(_chunker.chunk(doc))
    return chunks

if __name__ == "__main__":
    # Test path - replace with a real file if testing directly
    pass
