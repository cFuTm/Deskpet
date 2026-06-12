"""
桌宠配置文件。
包含 API 密钥、模型参数、GUI 设置和桌宠人格等全局配置。
"""
import os

# ====== 文本对话模型 ======
# 填写你的 API key（直接改下面字符串，或通过环境变量 CHAT_API_KEY 设置）
CHAT_API_KEY = os.getenv("CHAT_API_KEY", "yourkey")
CHAT_BASE_URL = os.getenv("CHAT_BASE_URL", "https://api.deepseek.com")
CHAT_MODEL = os.getenv("CHAT_MODEL", "deepseek-v4-pro")

# ====== GUI 配置 ======
WINDOW_WIDTH = 400
WINDOW_HEIGHT = 600
WINDOW_TITLE = "可爱桌宠"

# ====== 桌宠人格与语音唤醒配置 ======
PET_NAME = "小鲸"
WAKE_TIMEOUT = 15

# ====== 桌面宠物桥接服务 ======
BRIDGE_URL = "http://localhost:9101"
BRIDGE_TIMEOUT = 1.5
