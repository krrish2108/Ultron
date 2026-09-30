import psutil
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/telemetry")
def get_telemetry():
    # 1. System RAM (Real)
    vm = psutil.virtual_memory()
    ram_total = round(vm.total / (1024**3), 1)
    ram_used = round(vm.used / (1024**3), 1)
    
    # 2. VRAM (Real, using GPUtil if available)
    vram_total = 0.0
    vram_used = 0.0
    try:
        import GPUtil # type: ignore
        gpus = GPUtil.getGPUs()
        if gpus:
            gpu = gpus[0]
            vram_total = round(gpu.memoryTotal / 1024, 1) # GPUtil returns MB, convert to GB
            vram_used = round(gpu.memoryUsed / 1024, 1)
        else:
            vram_total = 8.0 # Fallback fake if no GPU detected
            vram_used = 2.4
    except ImportError:
        vram_total = 8.0 # Fallback if GPUtil is not installed
        vram_used = 2.4
    
    # 3. Context Window (Simulated dynamically based on load)
    context_total = 32000
    context_used = int((vm.percent / 100.0) * 15000)
    
    # 4. Token Speed (Simulated, spikes when CPU is active)
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
