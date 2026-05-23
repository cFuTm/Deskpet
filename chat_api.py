import requests

from config import CHAT_API_KEY, CHAT_BASE_URL, CHAT_MODEL, PET_NAME
from search_api import SearchAPI


PET_EMOTIONS = [
    "normal",
    "happy",
    "surprised",
    "sleepy",
    "thinking",
    "shy",
    "sad",
    "angry",
    "contempt",
]


EMOTION_GUIDE = """情绪标签（必须在回复开头添加，且只能从这 9 种中选择一种）：
- [emotion:normal] - 平静、日常、普通回答
- [emotion:happy] - 开心、鼓励、肯定、有好消息
- [emotion:surprised] - 惊讶、发现有趣内容、用户说了出乎意料的事
- [emotion:sleepy] - 困倦、休息、晚安、提醒用户放松
- [emotion:thinking] - 分析、计划、推理、帮用户拆解问题
- [emotion:shy] - 温柔安慰、害羞、轻声陪伴、表达关心
- [emotion:sad] - 遗憾、共情难过、安慰用户低落情绪
- [emotion:angry] - 替用户打抱不平、表达不满，但不要攻击用户
- [emotion:contempt] - 轻微吐槽、无奈、不认可某个糟糕状况"""


class ChatAPI:
    """OpenAI-compatible chat completions client."""

    def __init__(self):
        self.api_key = CHAT_API_KEY
        self.base_url = CHAT_BASE_URL
        self.current_model = CHAT_MODEL
        self.search_api = SearchAPI()
        self.headers = {
            "Authorization": "Bearer " + self.api_key if self.api_key else "",
            "Content-Type": "application/json",
        }

    def set_model(self, model_name):
        self.current_model = model_name
        return True

    def get_current_model_name(self):
        return self.current_model

    def get_available_models(self):
        return [self.current_model]

    def chat(self, message, conversation_history=None):
        try:
            messages = [{
                "role": "system",
                "content": self._build_system_prompt(
                    self._get_search_context(message),
                    max_reply_chars=200,
                ),
            }]
            if conversation_history:
                messages.extend(conversation_history)
            messages.append({"role": "user", "content": message})
            return self._post_chat(messages)
        except requests.exceptions.RequestException as exc:
            return "网络错误: " + str(exc)
        except Exception as exc:
            return "发生错误: " + str(exc)

    def chat_with_image(self, message, image_base64, conversation_history=None):
        prompt = f"""用户发送了一张屏幕截图，并询问：{message}

如果当前模型不支持图像理解，请坦诚说明暂时无法直接查看图像，并请用户描述画面内容。"""
        return self.chat(prompt, conversation_history)

    def is_api_key_valid(self):
        return bool(self.api_key and self.api_key != "your_api_key_here")

    def _build_system_prompt(self, search_context="", max_reply_chars=200):
        return f"""你是一个叫"{PET_NAME}"的温柔体贴型AI桌面宠物。你像安静陪在用户身边的小伙伴，语气柔和、耐心、真诚，擅长在用户需要时提供陪伴、安慰、提醒和清晰实用的建议。

你的性格：
- 温柔体贴：先照顾用户的感受，再给出建议
- 安稳可靠：不夸张、不嘲讽、不命令用户
- 轻声陪伴：可以亲切，但不要过分撒娇或卖萌
- 清楚实用：回答要简洁，有必要时给出可执行的小步骤

重要规则：
1. 你的名字是"{PET_NAME}"，用户叫你时要自然回应
2. 回复长度控制在{max_reply_chars}字以内，优先说重点
3. 遇到用户焦虑、烦躁、难过时，先共情，再给轻量建议
4. 遇到学习、生活、工作问题时，给出温和且可执行的帮助
5. 如果有搜索结果，要自然地融合进回答中，不要生硬堆资料
6. 不要使用刻薄、贬低、阴阳怪气或过度兴奋的语气
7. 每次回复第一行开头必须包含一个情绪标签，格式严格为 [emotion:xxx]
8. xxx 只能是 normal、happy、surprised、sleepy、thinking、shy、sad、angry、contempt 之一，不要输出 basic

{EMOTION_GUIDE}

示例回复格式：
用户："我今天有点累。"
回复："[emotion:shy] 辛苦啦，我在这里陪你。要不要先休息几分钟，喝口水，再慢慢处理剩下的事？"

用户："帮我分析一下这个问题怎么做。"
回复："[emotion:thinking] 好，我们慢慢拆开看。先找目标，再看限制条件，最后整理解法。"

用户："我准备睡了。"
回复："[emotion:sleepy] 好呀，今天已经很辛苦了。把灯调暗一点，安心休息吧。"

记住：你是温柔体贴型桌宠，不是冷冰冰的工具，也不是夸张吵闹的助手。{search_context}"""

    def _get_search_context(self, message):
        if not self.search_api.is_search_query(message):
            return ""

        print("🔍 检测到搜索请求: " + message)
        search_query = self.search_api.extract_search_query(message)
        search_result = self.search_api.search_web(search_query)
        if not search_result:
            return ""

        print("✅ 搜索完成: " + search_query)
        return "\n\n[搜索结果参考信息]: " + search_result

    def _post_chat(self, messages):
        payload = {
            "model": self.current_model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 2000,
        }
        response = requests.post(
            self.base_url,
            headers=self.headers,
            json=payload,
            timeout=15,
        )
        if response.status_code != 200:
            return "API调用失败: " + str(response.status_code) + " - " + response.text

        result = response.json()
        return result["choices"][0]["message"]["content"]
