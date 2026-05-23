#!/usr/bin/env python3
"""
桌宠桥接服务。

Python 语音服务通过 POST 接口推送状态，C# 桌宠通过 GET /status 轮询状态。
"""
import http.server
import json
import threading
import time
from collections import deque


PORT = 9101
PET_EMOTIONS = {
    "normal",
    "happy",
    "surprised",
    "sleepy",
    "thinking",
    "shy",
    "sad",
    "angry",
    "contempt",
}
EMOTION_ALIASES = {
    "basic": "normal",
    "idle": "normal",
    "responding": "happy",
}


class PetState:
    def __init__(self):
        self.status = "idle"
        self.mood = "happy"
        self.bubble = ""
        self.bubble_token = 0
        self.last_reply = ""
        self.last_reply_time = ""
        self.bubble_expire = 0
        self.online = True
        self.voice_enabled = True
        self._lock = threading.Lock()
        self._bubble_queue = deque()
        self._last_bubble_pop = 0
        self._bubble_interval = 1.5
        self._last_think_time = 0

    def set_bubble(self, text, duration=8):
        if not text:
            return
        with self._lock:
            self._bubble_queue.append({"text": text, "duration": duration})

    def set_reply(self, text):
        if not text:
            return
        with self._lock:
            self._bubble_queue.append({"text": text, "duration": 8})

    def set_thinking(self):
        with self._lock:
            self.status = "thinking"
            self.mood = "thinking"
            if self.bubble:
                self.bubble_token += 1
                self.bubble = ""
                self.bubble_expire = 0
            self._last_think_time = time.time()

    def clear_bubble(self):
        with self._lock:
            if self.bubble:
                self.bubble = ""
                self.bubble_expire = 0
                self.bubble_token += 1
            if not self._bubble_queue and self.status != "thinking":
                self.status = "idle"

    def set_emotion(self, emotion):
        with self._lock:
            self.mood = normalize_emotion(emotion)

    def set_voice_enabled(self, enabled):
        with self._lock:
            self.voice_enabled = bool(enabled)
            if not self.voice_enabled:
                self.status = "idle"
                self.mood = "sleepy"
                if self.bubble:
                    self.bubble = ""
                    self.bubble_expire = 0
                    self.bubble_token += 1

    def get_control(self):
        with self._lock:
            return {"voice_enabled": self.voice_enabled}

    def get_state(self):
        with self._lock:
            now = time.time()

            if self.status == "thinking" and now - self._last_think_time > 10:
                self.status = "idle"
                self.mood = "normal"

            if self._bubble_queue and now - self._last_bubble_pop >= self._bubble_interval:
                popped = self._bubble_queue.popleft()
                self.bubble = popped["text"]
                self.bubble_expire = now + popped.get("duration", 8)
                self.last_reply = popped["text"]
                self.last_reply_time = time.strftime("%H:%M:%S")
                self.status = "responding"
                self._last_bubble_pop = now
                self.bubble_token += 1

            if self.bubble_expire < now and self.status != "thinking":
                if self.bubble:
                    self.bubble = ""
                    self.bubble_token += 1
                if not self._bubble_queue:
                    self.status = "idle"

            return {
                "online": self.online,
                "status": self.status,
                "mood": self.mood,
                "bubble": self.bubble,
                "bubble_token": str(self.bubble_token),
                "last_reply": self.last_reply,
                "last_reply_time": self.last_reply_time,
                "voice_enabled": self.voice_enabled,
                "queue_size": len(self._bubble_queue),
                "timestamp": time.strftime("%H:%M:%S"),
            }


state = PetState()


def normalize_emotion(emotion):
    emotion = (emotion or "normal").strip().lower()
    emotion = EMOTION_ALIASES.get(emotion, emotion)
    if emotion in PET_EMOTIONS:
        return emotion
    return "normal"


class BridgeHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/status":
            self._json(state.get_state())
        elif self.path == "/control":
            self._json(state.get_control())
        elif self.path == "/health":
            self._json({"status": "ok", "time": time.strftime("%H:%M:%S")})
        elif self.path == "/ping":
            self._json({"pong": True})
        else:
            self.send_error(404)

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length) or b"{}")
        except Exception:
            self.send_error(400)
            return

        if self.path == "/bubble":
            state.set_bubble(body.get("text", ""), body.get("duration", 4))
            self._json({"ok": True})
        elif self.path == "/reply":
            state.set_reply(body.get("text", ""))
            self._json({"ok": True})
        elif self.path == "/clear_bubble":
            state.clear_bubble()
            self._json({"ok": True})
        elif self.path == "/think":
            state.set_thinking()
            self._json({"ok": True})
        elif self.path == "/emotion":
            emotion = body.get("emotion", "happy")
            state.set_emotion(emotion)
            self._json({"ok": True, "emotion": emotion})
        elif self.path == "/voice":
            enabled = body.get("enabled")
            if enabled is None:
                enabled = not state.voice_enabled
            state.set_voice_enabled(enabled)
            self._json({"ok": True, "voice_enabled": state.voice_enabled})
        else:
            self.send_error(404)

    def _json(self, data):
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def log_message(self, *args):
        pass


def serve():
    server = http.server.HTTPServer(("0.0.0.0", PORT), BridgeHandler)
    print("桌宠桥接服务已启动 :" + str(PORT))
    server.serve_forever()


if __name__ == "__main__":
    serve()
