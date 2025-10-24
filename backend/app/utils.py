import queue
import json
from datetime import datetime

class NonBlockingQueue:
    def __init__(self, maxsize=1):
        self.queue = queue.Queue(maxsize)

    def put(self, item):
        if self.queue.full():
            self.queue.get_nowait()  # Discard the oldest item
        self.queue.put_nowait(item)

    def get(self):
        try:
            return self.queue.get_nowait()
        except queue.Empty:
            return None

def format_as_json(data):
    """Formats a dictionary as a JSON string."""
    return json.dumps(data)

def get_current_timestamp():
    """Returns the current timestamp in ISO 8601 format."""
    return datetime.utcnow().isoformat() + "Z"
