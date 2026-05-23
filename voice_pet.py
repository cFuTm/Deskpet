"""
负责：
1. 语音输入 (Vosk本地识别)
2. AI对话 (通用 OpenAI-compatible API)
3. 语音播报 (Edge TTS)
4. 通过桥接服务推送状态给C#桌面宠物

桌宠形象完全由C#端负责，支持用户自定义皮肤
"""

import json
import threading
import time
import re
from urllib import request

from chat_api import ChatAPI
from voice_handler_local import LocalVoiceHandler
from edge_tts_handler import EdgeTTSHandler
from config import BRIDGE_URL, BRIDGE_TIMEOUT, PET_NAME, WAKE_TIMEOUT


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


class VoicePetService:
    """纯后台语音桌宠服务 - 无UI，所有状态通过桥接推送"""
    
    def __init__(self):
        print("=" * 50)
        print("🐱 语音桌宠后台服务启动中...")
        print("=" * 50)
        
        self.api = ChatAPI()
        self.voice = LocalVoiceHandler()
        self.tts = EdgeTTSHandler()
        self.conversation_history = []
        
        # 状态控制
        self.is_processing = False
        self.is_speaking = False
        self.running = True
        self.bridge_last_error = ""
        self.voice_enabled = True
        self.is_awake = False
        self.awake_until = 0
        self._last_voice_enabled = True
        
        # 唤醒与自动休眠
        self.last_activity_time = time.time()
        self.wake_word = PET_NAME
        self.wake_timeout = WAKE_TIMEOUT
        
        # 情绪状态 - 用于推送给C#端
        self.current_emotion = "happy"
        
        # 检查API key
        if not self.api.is_api_key_valid():
            print("⚠️ 警告：未检测到有效的 API Key！")
            print("💡 请将API Key写入 key.txt 文件")
        
        print("✅ 语音桌宠后台服务初始化完成")
    
    # ==================== 桥接服务通信 ====================
    
    def _post_bridge(self, path, payload=None):
        """把当前状态推送给C#桌宠桥接服务"""
        if not BRIDGE_URL:
            return False
        
        body = json.dumps(payload or {}).encode("utf-8")
        req = request.Request(
            BRIDGE_URL + path,
            data=body,
            headers={"Content-Type": "application/json; charset=utf-8"},
            method="POST",
        )
        
        try:
            with request.urlopen(req, timeout=BRIDGE_TIMEOUT) as resp:
                resp.read()
            self.bridge_last_error = ""
            return True
        except Exception as exc:
            self.bridge_last_error = str(exc)
            return False

    def _get_bridge_status(self):
        """读取桥接服务状态，用于同步 C# 端的语音开关。"""
        if not BRIDGE_URL:
            return None

        try:
            with request.urlopen(BRIDGE_URL + "/control", timeout=BRIDGE_TIMEOUT) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as exc:
            self.bridge_last_error = str(exc)
            return None
    
    def bridge_thinking(self):
        """通知桥接服务：正在思考"""
        self._post_bridge("/think")
    
    def bridge_bubble(self, text, duration=8):
        """通知桥接服务：显示气泡文本"""
        if text:
            self._post_bridge("/bubble", {"text": text, "duration": duration})
    
    def bridge_reply(self, text):
        """通知桥接服务：推送一条回复气泡"""
        if text:
            self._post_bridge("/reply", {"text": text})

    def bridge_clear_bubble(self):
        """通知桥接服务：清除当前气泡文本"""
        self._post_bridge("/clear_bubble")
    
    def bridge_emotion(self, emotion):
        """通知桥接服务：设置情绪状态"""
        self._post_bridge("/emotion", {"emotion": emotion})

    def sync_voice_control(self):
        """同步桌宠右键菜单里的语音开关。"""
        state = self._get_bridge_status()
        if not state or "voice_enabled" not in state:
            return

        enabled = bool(state.get("voice_enabled"))
        if enabled == self._last_voice_enabled:
            self.voice_enabled = enabled
            return

        self._last_voice_enabled = enabled
        self.voice_enabled = enabled
        if enabled:
            print("🎙️ 语音交互已开启，等待唤醒词...")
            self.bridge_bubble(f"说“{self.wake_word}”就可以叫醒我啦", duration=4)
            self.start_auto_listening()
        else:
            print("🔇 语音交互已关闭")
            self.sleep()
            self.interrupt_speech()
            self.voice.stop_listening()
            self.bridge_bubble("语音交互已关闭", duration=4)
    
    # ==================== 语音处理 ====================
    
    def start_auto_listening(self):
        """启动自动语音监听"""
        if not self.voice_enabled:
            return
        print("🎙️ 启动自动语音监听...")
        self.voice.start_continuous_listening(callback=self.on_voice_input)
    
    def on_voice_input(self, text):
        """语音输入回调"""
        print(f"🎤 收到语音: {text}")
        
        # 过滤错误信息
        error_keywords = [
            "语音识别失败", "Audio source must be entered",
            "超时：没有检测到语音", "抱歉，我没有听清楚",
            "语音识别服务出错", "This audio source is already inside a context manager"
        ]
        
        if any(keyword in text for keyword in error_keywords):
            print(f"🚫 检测到错误信息，不发送给API: {text}")
            return

        if not self.voice_enabled:
            print("🔇 语音交互已关闭，忽略输入")
            return

        command = self.parse_wake_command(text)
        if command is None:
            print(f"💤 未唤醒，忽略输入。请先说“{self.wake_word}”")
            return
        
        self.update_activity()

        if not command:
            self.bridge_bubble(f"我在，接下来 {self.wake_timeout} 秒内可以直接说话", duration=4)
            self.bridge_emotion("happy")
            return

        self.bridge_thinking()
        self.process_voice_input(command)
    
    def update_activity(self):
        """更新用户活动时间"""
        self.last_activity_time = time.time()
        self.awake_until = self.last_activity_time + self.wake_timeout
        if not self.is_awake:
            print(f"✅ 已被“{self.wake_word}”唤醒")
        self.is_awake = True

    def normalize_text(self, text):
        """归一化识别文本，兼容 Vosk 可能插入的空格。"""
        return re.sub(r"[\s，。！？,.!?、~～：:；;“”\"'（）()]", "", text or "").lower()

    def parse_wake_command(self, text):
        """返回可处理命令；未唤醒且没有唤醒词时返回 None。"""
        normalized = self.normalize_text(text)
        wake = self.normalize_text(self.wake_word)

        if self.is_awake:
            if normalized.startswith(wake):
                command = normalized[len(wake):].strip()
                return command
            return text.strip()

        index = normalized.find(wake)
        if index < 0:
            return None

        command = normalized[index + len(wake):].strip()
        return command

    def sleep(self):
        """进入休眠，只保留唤醒词监听。"""
        if self.is_awake:
            print("💤 已自动休眠，等待下一次唤醒")
        self.is_awake = False
        self.awake_until = 0
        self.bridge_emotion("sleepy")
    
    def process_voice_input(self, text):
        """处理语音输入"""
        if self.is_processing or self.is_speaking:
            return
        
        self.is_processing = True
        print(f"🤔 正在处理: {text}")
        
        def process_thread():
            try:
                self.bridge_thinking()
                self.bridge_emotion("thinking")
                
                # 获取AI回复
                response = self.get_ai_response(text)
                
                if response:
                    # 提取情绪和清理文本
                    emotion, cleaned_response = self.extract_emotion_from_response(response)
                    print(f"🤖 AI回复: {cleaned_response}")
                    
                    # 推送回复和情绪到桥接服务
                    self.bridge_reply(cleaned_response)
                    self.bridge_emotion(emotion)
                    self.current_emotion = emotion
                    
                    # 播放语音
                    self.is_speaking = True
                    self.tts.speak(cleaned_response)
                    
                    # 等待TTS播放完成
                    while self.tts.is_speaking:
                        time.sleep(0.1)
                    
                    self.is_speaking = False
                    self.bridge_clear_bubble()
                    
            except Exception as e:
                print(f"语音处理失败: {str(e)}")
            finally:
                self.is_processing = False
        
        thread = threading.Thread(target=process_thread)
        thread.daemon = True
        thread.start()
    
    def get_ai_response(self, text):
        """获取AI回复"""
        try:
            response = self.api.chat(text, self.conversation_history)
            
            # 更新对话历史
            self.conversation_history.append({"role": "user", "content": text})
            self.conversation_history.append({"role": "assistant", "content": response})
            
            # 限制历史长度
            if len(self.conversation_history) > 10:
                self.conversation_history = self.conversation_history[-10:]
            
            return response
        except Exception as e:
            print(f"获取AI回复失败: {str(e)}")
            return None
    
    def extract_emotion_from_response(self, response_text):
        """从AI回复中提取情绪标签"""
        emotion_match = re.search(r'\[emotion:(\w+)\]', response_text)
        if emotion_match:
            emotion = self.normalize_emotion(emotion_match.group(1))
            clean_text = re.sub(r'\[emotion:\w+\]\s*', '', response_text).strip()
            return emotion, clean_text
        return 'normal', response_text

    def normalize_emotion(self, emotion):
        """把模型输出归一到桌宠支持的 9 种情绪。"""
        emotion = (emotion or "normal").strip().lower()
        emotion = EMOTION_ALIASES.get(emotion, emotion)
        if emotion in PET_EMOTIONS:
            return emotion
        return "normal"
    
    # ==================== 自动休眠 ====================
    
    def start_idle_monitor(self):
        """启动自动休眠监听"""
        def idle_loop():
            while self.running:
                time.sleep(1)
                if self.is_awake and not self.is_processing and not self.is_speaking:
                    if time.time() >= self.awake_until:
                        self.sleep()
        
        thread = threading.Thread(target=idle_loop, daemon=True)
        thread.start()
        print("⏰ 自动休眠监控已启动")
    
    # ==================== 打断语音 ====================
    
    def interrupt_speech(self):
        """打断当前的语音播放"""
        try:
            if hasattr(self, 'tts') and self.tts:
                self.tts.stop_speaking()
            if hasattr(self, 'voice') and self.voice:
                self.voice.stop_speaking()
            self.is_speaking = False
            print("🤐 语音播放已被打断")
        except Exception as e:
            print(f"打断语音失败: {str(e)}")
    
    def stop_all_speech(self):
        """停止所有语音播放"""
        self.interrupt_speech()
    
    # ==================== 启动与运行 ====================
    
    def startup_greeting(self):
        """启动问候语"""
        def greeting_thread():
            greeting = f"你好主人！我是{self.wake_word}，说“{self.wake_word}”就可以叫醒我~"
            print(f"👋 {greeting}")
            self.bridge_bubble(greeting)
            self.tts.speak(greeting)
            
            while self.tts.is_speaking:
                time.sleep(0.1)
            
            self.is_speaking = False
            self.bridge_clear_bubble()
            self.start_auto_listening()
        
        thread = threading.Thread(target=greeting_thread, daemon=True)
        thread.start()
    
    def run(self):
        """运行服务"""
        try:
            print("🚀 语音桌宠后台服务已启动")
            print("💡 请确保桥接服务 (pet_bridge.py) 和 C# 桌宠 (DesktopPet.exe) 已启动")
            print(f"💡 唤醒词：{self.wake_word}；唤醒后 {self.wake_timeout} 秒无对话会自动休眠")
            print("-" * 50)
            
            # 启动闲置监控
            self.start_idle_monitor()
            
            # 播放启动问候语
            self.startup_greeting()
            
            # 保持主线程运行
            while self.running:
                self.sync_voice_control()
                time.sleep(1)
                
        except KeyboardInterrupt:
            print("\n👋 用户请求退出")
        except Exception as e:
            print(f"❌ 运行异常: {str(e)}")
        finally:
            self.shutdown()
    
    def shutdown(self):
        """关闭服务"""
        print("🛑 正在关闭语音桌宠服务...")
        self.running = False
        self.voice.stop_listening()
        self.tts.stop_speaking()
        self.interrupt_speech()
        print("✅ 语音桌宠服务已关闭")


if __name__ == "__main__":
    service = VoicePetService()
    service.run()
