import asyncio
import os
import tempfile
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse, FileResponse
import logging

logger = logging.getLogger(__name__)

from services.utils.ingest import ingest_document
from services.utils.broadcaster import broadcaster
from services.agents.supervisor import Supervisor

router = APIRouter()
project_root = Path(__file__).resolve().parent.parent.parent

# ---------------------------------------------------------
# Core Endpoints (Moved from main.py)
# ---------------------------------------------------------

@router.get("/")
def read_root():
    return {"status": "ok", "message": "Backend is running"}

@router.websocket("/ws/transparency")
async def websocket_transparency(websocket: WebSocket):
    await broadcaster.connect(websocket)
    try:
        while True:
            # Keep the connection alive, we only broadcast from server to client
            await websocket.receive_text()
    except WebSocketDisconnect:
        broadcaster.disconnect(websocket)

@router.post("/chat")
async def chat(request: Request, message: dict):
    user_message = message.get("message", "")
    context = message.get("context", "")
    # Prefer request state over body (allows body override for advanced use cases)
    template_path = message.get("template_path") or getattr(request.app.state, "template_path", None)
    
    supervisor = Supervisor()
    
    async def generate():
        try:
            result = await supervisor.route(user_message, context, template_path=template_path)
            content = result.content
            for chunk in content.split():
                yield chunk + " "
            if result.file_path:
                yield f"\n\nFile: {result.file_path}"
        except Exception as e:
            print(f"[CHAT ERROR] {e}")
            yield f"Error: {str(e)}"
    
    return StreamingResponse(generate(), media_type="text/plain")

@router.post("/upload-template")
async def upload_template(request: Request, file: UploadFile = File(...)):
    """Saves a DOCX file to use as the template for document generation."""
    if not file.filename or not file.filename.lower().endswith(".docx"):
        raise HTTPException(status_code=400, detail="Template must be a .docx file")

    templates_dir = project_root / "data" / "uploads" / "templates"
    templates_dir.mkdir(parents=True, exist_ok=True)
    template_path = templates_dir / file.filename

    content = await file.read()
    template_path.write_bytes(content)

    # Store in app state so future chat requests pick it up automatically
    request.app.state.template_path = str(template_path)
    
    print(f"[TEMPLATE] Saved {len(content)} bytes to {template_path}")
    return {"status": "ok", "filename": file.filename, "path": str(template_path)}

@router.post("/ingest")
async def ingest_file(request: Request, file: UploadFile = File(...)):
    """Ingests document, saves to vector DB and context.md. Returns minimal."""
    file_path_str = str(file.filename) if file.filename else "unknown"
    
    docs_dir = project_root / "data" / "uploads" / "documents"
    docs_dir.mkdir(parents=True, exist_ok=True)
    save_path = docs_dir / file_path_str
    
    content = await file.read()
    file_size = len(content)
    save_path.write_bytes(content)
    
    uploaded_files_count = len(list(docs_dir.iterdir()))
    logger.info(f"Ingest started for file: {file.filename}, size: {file_size} bytes. Total uploaded files in dir: {uploaded_files_count}")

    try:
        doc = await asyncio.to_thread(ingest_document, str(save_path), request.app.state.converter)
        markdown = doc.export_to_markdown()
        
        # Save to data/context.md (ensures uvicorn doesn't reload if data/ is ignored)
        data_dir = project_root / "data"
        data_dir.mkdir(exist_ok=True)
        context_path = data_dir / "context.md"
        
        separator = f"\n\n---\n\n<!-- source: {file.filename} -->\n\n"
        with open(context_path, "a", encoding="utf-8") as f:
            f.write(separator + markdown)
            
        total_size = context_path.stat().st_size
        saved_files_count = context_path.read_text(encoding="utf-8").count("<!-- source:")
        
        logger.info(f"Ingest successful for file: {file.filename}. Appended {len(markdown)} chars. Total context.md size: {total_size} bytes. Total files saved to context.md: {saved_files_count}")
        
        return {"status": "ok", "filename": file.filename, "path": str(save_path)}
    except Exception as e:
        logger.error(f"Ingest error for file {file.filename}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/context")
async def clear_context():
    """Clear context.md to start fresh."""
    data_dir = project_root / "data"
    context_path = data_dir / "context.md"
    if context_path.exists():
        context_path.unlink()
    return {"status": "ok", "message": "Context cleared"}


# ---------------------------------------------------------
# Extended Endpoints (For Heavy Users)
# ---------------------------------------------------------

@router.get("/download")
async def download_file(path: str):
    """Downloads a file given its absolute path."""
    file_path = Path(path)
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    
    # In a real app, ensure 'path' is strictly within a designated directory to prevent LFI
    return FileResponse(path=file_path, filename=file_path.name)

@router.get("/sessions")
async def list_sessions():
    """Retrieve a list of all active or archived chat sessions."""
    # Stub implementation
    return {"status": "ok", "sessions": []}

@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """Retrieve full history and context of a specific chat session."""
    # Stub implementation
    return {"status": "ok", "session_id": session_id, "messages": []}

@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete a chat session."""
    # Stub implementation
    return {"status": "ok", "message": f"Session {session_id} deleted."}

@router.get("/assets")
async def list_assets():
    """List all ingested documents and assets in the Sovereign workspace."""
    # Stub implementation
    return {"status": "ok", "assets": []}

@router.delete("/assets/{asset_id}")
async def delete_asset(asset_id: str):
    """Remove an asset from the vector DB and local storage."""
    # Stub implementation
    return {"status": "ok", "message": f"Asset {asset_id} deleted."}

@router.post("/assets/{asset_id}/scan")
async def scan_asset(asset_id: str):
    """Trigger a deep security/malware scan on an uploaded asset."""
    # Stub implementation
    return {"status": "ok", "asset_id": asset_id, "scan_status": "clean"}

@router.post("/system/sandbox")
async def execute_sandbox(request: Request):
    """Execute arbitrary code in the secure docker sandbox."""
    # Stub implementation (could be wired up to sandbox_docker.py)
    return {"status": "ok", "output": "Sandbox execution started..."}
