import asyncio
import sys
from pathlib import Path

project_root = Path(__file__).resolve().parent.parent.parent
if str(project_root) not in sys.path and project_root.exists():
    sys.path.insert(0, str(project_root))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path as FilePath
from contextlib import asynccontextmanager

from services.app.routes import router



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
        device=AcceleratorDevice.CUDA,
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

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)