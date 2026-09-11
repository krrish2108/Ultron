import asyncio
import json
from typing import Set, Any
from fastapi import WebSocket

class Broadcaster:
    def __init__(self):
        self.connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.connections.remove(websocket)

    async def broadcast(self, event_type: str, data: Any):
        message = json.dumps({"type": event_type, "data": data})
        for connection in list(self.connections):
            try:
                await connection.send_text(message)
            except Exception as e:
                print(f"[BROADCASTER] Error sending to connection: {e}")
                self.disconnect(connection)

# Singleton instance
broadcaster = Broadcaster()
