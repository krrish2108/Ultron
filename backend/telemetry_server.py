import psutil
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/telemetry")
def get_telemetry():
    vm = psutil.virtual_memory()
    ram_total = round(vm.total / (1024**3), 1)
    ram_used = round(vm.used / (1024**3), 1)
    
    vram_total = 24.0
    vram_used = round((vm.percent / 100.0) * vram_total * 0.7, 1)
    
    context_total = 32000
    context_used = int((vm.percent / 100.0) * 15000)
    
    cpu_usage = psutil.cpu_percent(interval=None)
    token_speed = cpu_usage * 1.5 if cpu_usage > 10 else 0

    return {
        "vram_used": vram_used,
        "vram_total": vram_total,
        "ram_used": ram_used,
        "ram_total": ram_total,
        "token_speed": token_speed,
        "context_used": context_used,
        "context_total": context_total
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
