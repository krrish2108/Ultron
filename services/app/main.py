import asyncio
import sys
from pathlib import Path

project_root = Path(__file__).resolve().parent.parent.parent
if str(project_root) not in sys.path and project_root.exists():
    sys.path.insert(0, str(project_root))

from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path as FilePath
import tempfile
import os
from contextlib import asynccontextmanager
from services.utils.ingest import ingest_document, chunk_document
from services.utils.config import QDRANT_HOST, QDRANT_PORT



def startup_docling():  
    from docling.document_converter import DocumentConverter
    from docling.datamodel.pipeline_options import (
    PdfPipelineOptions, RapidOcrOptions, OcrMode,
    )
    
    from docling.datamodel.accelerator_options import AcceleratorDevice,  AcceleratorOptions
    from docling.document_converter import DocumentConverter, PdfFormatOption
    from docling.datamodel.base_models import InputFormat

    pipeline_options = PdfPipelineOptions()
    pipeline_options.accelerator_options = AcceleratorOptions(
        num_threads=8,
        device=AcceleratorDevice.AUTO,
    )

    pipeline_options.do_ocr = True
    pipeline_options.ocr_options = RapidOcrOptions(
        lang=["english"],
        backend="torch",           # required for CUDA — "onnxruntime" default ignores your GPU
        text_score=0.5,            # RapidOCR's equivalent of confidence_threshold
        mode=OcrMode.PDF_AWARE_LAYOUT_REGIONS,
    )

    converter = DocumentConverter(

    allowed_formats=[InputFormat.PDF, InputFormat.XLSX, InputFormat.PPTX, InputFormat.DOCX],
    format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)}
    )

    return converter   

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[STARTUP] Loading Docling weights...")
    converter = startup_docling()
    # Force weight load by converting a trivial document
    warmup_pdf = Path(__file__).parent / "assets" / "warmup.pdf"
    if warmup_pdf.exists():
        converter.convert(str(warmup_pdf))
    else:
        print("[STARTUP] WARNING: no warmup PDF found — GPU models will cold-start on first real request")

    app.state.converter = converter
    app.state.template_path = None
    print("[STARTUP] Docling ready.")
    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Backend is running"}


@app.post("/chat")
async def chat(request: Request, message: dict):
    user_message = message.get("message", "")
    context = message.get("context", "")
    # Prefer request state over body (allows body override for advanced use cases)
    template_path = message.get("template_path") or getattr(request.app.state, "template_path", None)
    
    from services.agents.supervisor import Supervisor
    supervisor = Supervisor()
    
    async def generate():
        try:
            result = await supervisor.route(user_message, context, template_path=template_path)
            content = result.content
            if result.file_path:
                content += f"\n\nFile: {result.file_path}"
            for chunk in content.split():
                yield chunk + " "
        except Exception as e:
            print(f"[CHAT ERROR] {e}")
            yield f"Error: {str(e)}"
    
    return StreamingResponse(generate(), media_type="text/plain")

@app.post("/upload-template")
async def upload_template(request: Request, file: UploadFile = File(...)):
    """Saves a DOCX file to use as the template for document generation."""
    if not file.filename or not file.filename.lower().endswith(".docx"):
        raise HTTPException(status_code=400, detail="Template must be a .docx file")

    data_dir = project_root / "data"
    data_dir.mkdir(exist_ok=True)
    template_path = data_dir / "template.docx"

    content = await file.read()
    template_path.write_bytes(content)

    # Store in app state so future chat requests pick it up automatically
    request.app.state.template_path = str(template_path)
    
    print(f"[TEMPLATE] Saved {len(content)} bytes to {template_path}")
    return {"status": "ok", "filename": file.filename, "path": str(template_path)}


@app.post("/ingest")
async def ingest_file(request: Request, file: UploadFile = File(...)):
    """Ingests document, saves to vector DB and context.md. Returns minimal."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=FilePath(str(file.filename)).suffix) as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_path = temp_file.name

    try:
        doc = await asyncio.to_thread(ingest_document, temp_path, request.app.state.converter)
        markdown = doc.export_to_markdown()
        
        # Save to data/context.md (ensures uvicorn doesn't reload if data/ is ignored)
        data_dir = project_root / "data"
        data_dir.mkdir(exist_ok=True)
        context_path = data_dir / "context.md"
        context_path.write_text(markdown, encoding="utf-8")
        print(f"[INGEST] Saved {len(markdown)} chars to {context_path}")
        
        
        return {"status": "ok", "filename": file.filename}
    except Exception as e:
        print(f"[INGEST ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)