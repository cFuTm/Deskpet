"""
语音交互AI桌宠
透明界面，语音输入输出，连续随机动画播放
"""

import tkinter as tk
from tkinter import messagebox, simpledialog
import json
import threading
import time
from PIL import Image, ImageTk, ImageSequence
import os
import random
import re
from urllib import request

from deepseek_api import DeepSeekAPI
from voice_handler_local import LocalVoiceHandler  # 改为使用本地语音识别
from edge_tts_handler import EdgeTTSHandler
from config import WINDOW_TITLE, BRIDGE_URL, BRIDGE_TIMEOUT

class VoicePet:
    def __init__(self):
        self.root = tk.Tk()
        self.api = DeepSeekAPI()
        self.voice = LocalVoiceHandler()  # 使用本地语音处理器
        self.tts = EdgeTTSHandler()
        self.conversation_history = []
        
        # 状态控制
        self.is_processing = False
        self.is_speaking = False
        self.bridge_last_error = ""
        
        # 连续动画控制
        self.idle_animations = ["基础01.gif", "基础02.gif", "基础03.gif", "基础04.gif", "基础05.gif"]
        self.animation_queue = []
        self.current_animation_index = 0
        self.animation_timer = None
        self.animation_change_interval = 5000  # 改为5秒切换一次动画
        self.animation_frame_timer = None  # 添加动画帧计时器
        self.is_playing_event_animation = False  # 标记是否在播放事件动画
        
        # 闲置聊天功能
        self.idle_timer = None
        self.idle_timeout = 30000  # 30秒闲置时间
        self.last_activity_time = time.time()
        self.idle_phrases = [
            "主人~还在吗？笨逼好无聊哦",
            "嘿嘿~主人在干什么呢？",
            "笨逼想和主人聊天啦~",
            "主人别忘了笨逼呀！",
            "咦？主人是不是走了？笨逼等你回来~",
            "无聊无聊，主人快来陪笨逼玩嘛",
            "笨逼在这里等主人，不要不理我呀",
            "主人主人，笨逼有话要说~"
        ]
        
        # 初始化动画队列
        self.shuffle_animation_queue()
        
        # 加载桌宠图片
        self.load_pet_image()
        
        self.setup_window()
        self.setup_ui()
        
        # 创建右键菜单
        self.create_context_menu()
        
        # 启动连续动画系统
        self.start_continuous_animation()
        
        # 启动闲置监听计时器
        self.start_idle_timer()
        
        # 先播放启动问候语，然后再启动监听
        self.startup_greeting()
        
        # 检查API key
        if not self.api.is_api_key_valid():
            result = messagebox.askyesno(
                "API Key 未设置", 
                "未检测到有效的DeepSeek API Key！\n\n是否现在设置？"
            )
            if result:
                self.set_api_key()
    
    def shuffle_animation_queue(self):
        """打乱动画播放顺序"""
        self.animation_queue = self.idle_animations.copy()
        random.shuffle(self.animation_queue)
        self.current_animation_index = 0
        print(f"🔀 动画播放顺序: {' -> '.join(self.animation_queue)}")

    def _post_bridge(self, path, payload=None):
        """把当前状态推给 C# 桌宠桥接服务。"""
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

    def bridge_thinking(self):
        """通知桥接服务：正在思考。"""
        self._post_bridge("/think")

    def bridge_bubble(self, text, duration=8):
        """通知桥接服务：显示气泡。"""
        if text:
            self._post_bridge("/bubble", {"text": text, "duration": duration})

    def bridge_reply(self, text):
        """通知桥接服务：推送一条回复气泡。"""
        if text:
            self._post_bridge("/reply", {"text": text})
    
    def load_pet_image(self):
        """加载桌宠图片（支持动画GIF）"""
        try:
            # 加载队列中的第一个动画
            if self.animation_queue:
                first_animation = self.animation_queue[0]
                animation_path = os.path.join("image", first_animation)
                
                if os.path.exists(animation_path):
                    print(f"🎬 加载动画: {first_animation}")
                    self.load_animated_gif(animation_path)
                else:
                    self.pet_photo = None
                    self.pet_small_photo = None
                    print("❌ 桌宠图片未找到")
        except Exception as e:
            self.pet_photo = None
            self.pet_small_photo = None
            print(f"加载桌宠图片失败: {str(e)}")
    
    def start_continuous_animation(self):
        """启动连续动画系统"""
        self.schedule_next_animation()
    
    def schedule_next_animation(self):
        """安排下一个动画"""
        # 只有在非事件动画状态下才安排下一个动画
        if not self.is_playing_event_animation:
            if self.animation_timer:
                self.root.after_cancel(self.animation_timer)
            
            self.animation_timer = self.root.after(
                self.animation_change_interval, 
                self.switch_to_next_animation
            )
    
    def switch_to_next_animation(self):
        """切换到下一个动画 - 0间隔无缝切换"""
        if self.is_playing_event_animation:
            return  # 如果正在播放事件动画，不切换
            
        try:
            # 立即停止当前动画帧播放
            if self.animation_frame_timer:
                self.root.after_cancel(self.animation_frame_timer)
            
            # 移动到下一个动画
            self.current_animation_index += 1
            
            # 如果播放完所有动画，重新打乱顺序
            if self.current_animation_index >= len(self.animation_queue):
                self.shuffle_animation_queue()
            
            # 获取下一个动画
            next_animation = self.animation_queue[self.current_animation_index]
            animation_path = os.path.join("image", next_animation)
            
            if os.path.exists(animation_path):
                print(f"🔄 切换到动画: {next_animation}")
                self.load_animated_gif(animation_path)
                
                # 立即更新UI并开始播放 - 0间隔
                if hasattr(self, 'pet_label') and self.pet_photo:
                    self.pet_label.configure(image=self.pet_photo)
                    self.start_animation()
            
            # 立即安排下一次切换 - 0间隔
            self.schedule_next_animation()
        except Exception as e:
            print(f"切换动画时出错: {str(e)}")
            # 出错时继续安排下一次切换
            self.schedule_next_animation()

    def load_animated_gif(self, gif_path):
        """加载动画GIF"""
        self.gif_image = Image.open(gif_path)
        self.gif_frames = []
        
        # 提取所有帧
        for frame in ImageSequence.Iterator(self.gif_image):
            # 调整大小
            frame_resized = frame.resize((150, 150), Image.Resampling.LANCZOS)
            # 转换为RGBA确保透明度
            if frame_resized.mode != 'RGBA':
                frame_resized = frame_resized.convert('RGBA')
            
            photo = ImageTk.PhotoImage(frame_resized)
            self.gif_frames.append(photo)
        
        if self.gif_frames:
            self.pet_photo = self.gif_frames[0]  # 设置第一帧为默认
            self.is_animated = True
            self.frame_index = 0
            
            # 设置pet_image属性为第一帧的PIL图像（用于动画效果）
            first_frame = self.gif_image.copy()
            if first_frame.mode != 'RGBA':
                first_frame = first_frame.convert('RGBA')
            self.pet_image = first_frame.resize((150, 150), Image.Resampling.LANCZOS)
            
            # 创建小尺寸版本（使用第一帧）
            small_frame = self.gif_image.copy()
            if small_frame.mode != 'RGBA':
                small_frame = small_frame.convert('RGBA')
            small_frame = small_frame.resize((32, 32), Image.Resampling.LANCZOS)
            self.pet_small_photo = ImageTk.PhotoImage(small_frame)
            
            print(f"✅ 加载了 {len(self.gif_frames)} 帧动画")
        else:
            self.pet_photo = None
            self.is_animated = False
    
    def start_animation(self):
        """开始GIF动画"""
        if hasattr(self, 'is_animated') and self.is_animated and hasattr(self, 'gif_frames'):
            self.animate_gif()
    
    def stop_animation(self):
        """停止当前动画播放"""
        if self.animation_frame_timer:
            self.root.after_cancel(self.animation_frame_timer)
            self.animation_frame_timer = None
    
    def animate_gif(self):
        """播放GIF动画帧 - 确保5秒播放时长"""
        if hasattr(self, 'is_animated') and self.is_animated and hasattr(self, 'gif_frames'):
            try:
                # 添加边界检查，防止索引越界和空帧列表
                if (hasattr(self, 'pet_label') and self.pet_label and 
                    self.gif_frames and len(self.gif_frames) > 0):
                    
                    # 确保帧索引在有效范围内
                    if not hasattr(self, 'frame_index') or self.frame_index >= len(self.gif_frames):
                        self.frame_index = 0
                    
                    frame = self.gif_frames[self.frame_index]
                    self.pet_label.configure(image=frame)
                    
                    # 安全的模运算 - 确保帧数大于0
                    if len(self.gif_frames) > 0:
                        self.frame_index = (self.frame_index + 1) % len(self.gif_frames)
                    else:
                        self.frame_index = 0
                    
                    # 计算帧间隔：5000ms / 总帧数 = 每帧间隔
                    # 这样确保整个动画正好播放5秒
                    frame_interval = 5000 // len(self.gif_frames) if len(self.gif_frames) > 0 else 42
                    
                    # 安排下一帧播放
                    self.animation_frame_timer = self.root.after(frame_interval, self.animate_gif)
                else:
                    # 如果帧列表为空，停止动画
                    print("⚠️ 动画帧列表为空，停止动画播放")
                    self.is_animated = False
            except Exception as e:
                print(f"动画播放出错: {str(e)}")
                # 重置帧索引并重试
                self.frame_index = 0
                self.is_animated = False
    
    def setup_window(self):
        """设置透明窗口"""
        self.root.title(WINDOW_TITLE)
        
        # 设置窗口为透明背景
        self.root.configure(bg='black')
        self.root.attributes('-transparentcolor', 'black')  # 黑色部分透明
        self.root.attributes('-topmost', True)  # 置顶显示
        self.root.overrideredirect(True)  # 无边框窗口
        
        # 窗口大小和位置
        window_width = 200
        window_height = 220
        
        # 获取屏幕尺寸
        screen_width = self.root.winfo_screenwidth()
        screen_height = self.root.winfo_screenheight()
        
        # 计算窗口位置（右下角）
        x = screen_width - window_width - 50
        y = screen_height - window_height - 100
        
        self.root.geometry(f"{window_width}x{window_height}+{x}+{y}")
        
        # 绑定拖拽事件
        self.root.bind("<Button-1>", self.start_drag)
        self.root.bind("<B1-Motion>", self.drag_window)
        self.root.bind("<Button-3>", self.show_right_menu)

    def setup_ui(self):
        """设置用户界面"""
        # 主框架 - 透明背景
        main_frame = tk.Frame(self.root, bg='black')
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # 桌宠图片
        if self.pet_photo:
            self.pet_label = tk.Label(
                main_frame,
                image=self.pet_photo,
                bg='black',
                cursor="hand2"
            )
            self.pet_label.pack(pady=10)
            self.pet_label.bind("<Button-1>", self.on_pet_click)
            self.pet_label.bind("<Button-3>", self.on_right_click)  # 右键菜单
        
        # 绑定拖拽事件到主框架
        main_frame.bind("<Button-1>", self.start_drag)
        main_frame.bind("<B1-Motion>", self.drag_window)

    def on_pet_click(self, event):
        """点击宠物时的响应"""
        current_time = getattr(event, 'time', int(time.time() * 1000))  # 获取当前时间戳
        
        # 检查是否为双击（500ms内的第二次点击）
        if hasattr(self, 'last_click_time'):
            time_diff = current_time - self.last_click_time
            if time_diff < 500:  # 双击检测
                print("🖱️ 双击检测到，打断语音播放")
                self.interrupt_speech()
                return
        
        # 单击时切换到随机表情动画
        self.switch_to_expression_animation()
        
        # 记录点击时间
        self.last_click_time = current_time
    
    def interrupt_speech(self):
        """打断当前的语音播放"""
        try:
            # 停止EdgeTTS播放
            if hasattr(self, 'tts') and self.tts:
                self.tts.stop_speaking()
            
            # 停止本地TTS播放
            if hasattr(self, 'voice') and self.voice:
                self.voice.stop_speaking()
            
            # 重置状态
            self.is_speaking = False
            
            print("🤐 语音播放已被打断")
            
        except Exception as e:
            print(f"打断语音失败: {str(e)}")
    
    def stop_all_speech(self):
        """停止所有语音播放（包括TTS和本地语音）"""
        self.interrupt_speech()
    
    def pet_clicked(self, event=None):
        """点击桌宠的交互"""
        print("🐼 桌宠被点击了！")
        # 播放一个随机的表情动画
        expressions = ["害羞.gif", "称赞.gif", "吃惊.gif"]
        expression = random.choice(expressions)
        expression_path = os.path.join("image", expression)
        
        if os.path.exists(expression_path):
            print(f"😊 播放表情: {expression}")
            self.load_animated_gif(expression_path)
            if hasattr(self, 'pet_label') and self.pet_photo:
                self.pet_label.configure(image=self.pet_photo)
                self.start_animation()
            
            # 3秒后恢复正常动画
            self.root.after(3000, self.resume_normal_animation)

    def resume_normal_animation(self):
        """恢复正常动画播放"""
        try:
            # 停止事件动画
            self.stop_animation()
            self.is_playing_event_animation = False
            
            current_animation = self.animation_queue[self.current_animation_index]
            animation_path = os.path.join("image", current_animation)
            
            if os.path.exists(animation_path):
                print(f"🔄 恢复正常动画: {current_animation}")
                self.load_animated_gif(animation_path)
                if hasattr(self, 'pet_label') and self.pet_photo:
                    self.pet_label.configure(image=self.pet_photo)
                    self.start_animation()
                
                # 重新启动动画循环
                self.schedule_next_animation()
        except Exception as e:
            print(f"恢复动画时出错: {str(e)}")
            # 出错时也要恢复动画状态
            self.is_playing_event_animation = False
            self.schedule_next_animation()

    def start_auto_listening(self):
        """启动自动语音监听"""
        print("🎙️ 启动自动语音监听...")
        self.voice.start_continuous_listening(callback=self.on_voice_input)
    
    def on_voice_input(self, text):
        """语音输入回调"""
        print(f"🎤 收到语音: {text}")
        
        # 过滤错误信息，不发送给API
        error_keywords = [
            "语音识别失败",
            "Audio source must be entered",
            "超时：没有检测到语音",
            "抱歉，我没有听清楚",
            "语音识别服务出错",
            "This audio source is already inside a context manager"
        ]
        
        # 检查是否为错误信息
        is_error = any(keyword in text for keyword in error_keywords)
        
        if is_error:
            print(f"🚫 检测到错误信息，不发送给API: {text}")
            return
        
        # 更新活动时间
        self.update_activity()
        self.bridge_thinking()
        self.root.after(0, lambda: self.process_voice_input(text))
        
    def update_activity(self):
        """更新用户活动时间"""
        self.last_activity_time = time.time()
        # 重置闲置计时器
        if self.idle_timer:
            self.root.after_cancel(self.idle_timer)
        self.start_idle_timer()

    def process_voice_input(self, text):
        """处理语音输入"""
        if self.is_processing or self.is_speaking:
            return
        
        self.is_processing = True
        print(f"🤔 正在处理: {text}")
        
        def process_thread():
            try:
                self.bridge_thinking()
                # 获取AI回复
                response = self.get_ai_response(text)
                
                if response:
                    # 清理AI回复
                    emotion, cleaned_response = self.extract_emotion_from_response(response)
                    print(f"🤖 AI回复: {cleaned_response}")

                    self.bridge_reply(cleaned_response)
                    
                    # 播放表情动画
                    self.play_emotion_animation(emotion)
                    
                    # 设置播放状态
                    self.is_speaking = True
                    
                    # 播放语音
                    self.tts.speak(cleaned_response)
                    
                    # 等待TTS播放完成
                    while self.tts.is_speaking:
                        time.sleep(0.1)
                    
                    self.is_speaking = False
                    
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
        import re
        
        # 查找情绪标签模式 [emotion:xxx]
        emotion_match = re.search(r'\[emotion:(\w+)\]', response_text)
        if emotion_match:
            emotion = emotion_match.group(1)
            # 移除情绪标签，返回清理后的文本和情绪
            clean_text = re.sub(r'\[emotion:\w+\]\s*', '', response_text).strip()
            return emotion, clean_text
        
        return 'basic', response_text
    
    def play_emotion_animation(self, emotion):
        """根据情绪播放对应的动画"""
        # 情绪到动画文件的映射
        emotion_to_animation = {
            'basic': None,  # 基础情绪不切换，保持当前动画
            'happy': '称赞.gif',
            'surprised': '吃惊.gif', 
            'shy': '害羞.gif',
            'sad': '伤心.gif',
            'angry': '愤怒.gif',
            'contempt': '鄙视.gif'
        }
        
        animation_file = emotion_to_animation.get(emotion)
        if animation_file:
            self.switch_to_specific_emotion_animation(animation_file)
        # 如果是basic或未知情绪，不切换动画
    
    def switch_to_specific_emotion_animation(self, animation_filename):
        """切换到指定的表情动画 - 立即中断当前动画"""
        # 标记为事件动画状态
        self.is_playing_event_animation = True
        
        # 立即停止当前动画和计时器
        self.stop_animation()
        if self.animation_timer:
            self.root.after_cancel(self.animation_timer)
        
        animation_path = os.path.join("image", animation_filename)
        
        if os.path.exists(animation_path):
            print(f"😊 播放情绪动画: {animation_filename}")
            self.load_animated_gif(animation_path)
            if hasattr(self, 'pet_label') and self.pet_photo:
                self.pet_label.configure(image=self.pet_photo)
                self.start_animation()
            
            # 5秒后恢复正常动画（与单个动画播放时长一致）
            self.root.after(5000, self.resume_normal_animation)
        else:
            print(f"⚠️ 情绪动画文件不存在: {animation_filename}")
            # 如果动画文件不存在，恢复事件动画状态
            self.is_playing_event_animation = False

    def close_app(self):
        """关闭应用"""
        try:
            # 停止所有活动
            self.voice.stop_listening()
            self.tts.stop_speaking()
            
            # 取消定时器
            if self.animation_timer:
                self.root.after_cancel(self.animation_timer)
            
            # 销毁窗口
            self.root.destroy()
        except Exception as e:
            print(f"关闭应用时出错: {str(e)}")

    def minimize_window(self):
        """最小化窗口"""
        self.root.iconify()

    def start_drag(self, event):
        """开始拖拽窗口"""
        self.start_x = event.x
        self.start_y = event.y
    
    def drag_window(self, event):
        """拖拽窗口"""
        x = self.root.winfo_x() + event.x - self.start_x
        y = self.root.winfo_y() + event.y - self.start_y
        self.root.geometry(f"+{x}+{y}")

    def startup_greeting(self):
        """启动问候语"""
        # 不再停止监听，改为设置speaking标志
        self.is_speaking = True
        
        def greeting_thread():
            greeting = "你好主人！我是笨逼，你的语音桌宠~"
            self.bridge_bubble(greeting)
            self.tts.speak(greeting)
            
            # 等待TTS播放完成
            while self.tts.is_speaking:
                time.sleep(0.1)
            
            self.is_speaking = False
            
            # 启动连续语音监听（只在初始化时启动一次）
            self.start_auto_listening()
        
        thread = threading.Thread(target=greeting_thread)
        thread.daemon = True
        thread.start()

    def switch_to_expression_animation(self):
        """切换到随机表情动画 - 立即中断当前动画"""
        # 标记为事件动画状态
        self.is_playing_event_animation = True
        
        # 立即停止当前动画和计时器
        self.stop_animation()
        if self.animation_timer:
            self.root.after_cancel(self.animation_timer)
        
        expressions = ["害羞.gif", "称赞.gif", "吃惊.gif"]
        expression = random.choice(expressions)
        expression_path = os.path.join("image", expression)
        
        if os.path.exists(expression_path):
            print(f"😊 播放表情: {expression}")
            self.load_animated_gif(expression_path)
            if hasattr(self, 'pet_label') and self.pet_photo:
                self.pet_label.configure(image=self.pet_photo)
                self.start_animation()
            
            # 5秒后恢复正常动画（与单个动画播放时长一致）
            self.root.after(5000, self.resume_normal_animation)

    def show_right_menu(self, event):
        """显示右键菜单"""
        menu = tk.Menu(self.root, tearoff=False)
        menu.add_command(label="设置API Key", command=self.set_api_key)
        menu.add_command(label="最小化", command=self.minimize_window)
        menu.add_command(label="关闭", command=self.close_app)
        menu.post(event.x_root, event.y_root)

    def set_api_key(self):
        """设置API Key"""
        # 获取当前API key
        current_key = ""
        key_file = os.path.join(os.path.dirname(__file__), 'key.txt')
        try:
            if os.path.exists(key_file):
                with open(key_file, 'r', encoding='utf-8') as f:
                    current_key = f.read().strip()
        except Exception:
            pass
        
        # 显示输入对话框
        new_key = simpledialog.askstring(
            "设置API Key", 
            "请输入DeepSeek API Key:",
            initialvalue=current_key,
            show='*'  # 隐藏输入内容
        )
        
        if new_key and new_key.strip():
            try:
                # 保存到key.txt文件
                with open(key_file, 'w', encoding='utf-8') as f:
                    f.write(new_key.strip())
                
                # 重新初始化API
                from config import get_api_key
                import importlib
                import config
                importlib.reload(config)  # 重新加载配置
                
                self.api = DeepSeekAPI()
                
                if self.api.is_api_key_valid():
                    messagebox.showinfo("成功", "API Key设置成功！")
                else:
                    messagebox.showwarning("警告", "API Key可能无效，请检查后重试。")
                    
            except Exception as e:
                messagebox.showerror("错误", f"保存API Key失败: {str(e)}")

    def start_idle_timer(self):
        """启动闲置监听计时器"""
        self.idle_timer = self.root.after(self.idle_timeout, self.check_idle)

    def check_idle(self):
        """检查是否闲置"""
        current_time = time.time()
        if current_time - self.last_activity_time >= self.idle_timeout / 1000:
            # 只有在不处理请求且不在说话时才发起闲置聊天
            if not self.is_processing and not self.is_speaking:
                print("🤔 主人似乎已经离开了...")
                self.idle_chat()
            else:
                self.start_idle_timer()
        else:
            self.start_idle_timer()

    def idle_chat(self):
        """闲置聊天"""
        if not self.is_processing and not self.is_speaking:
            phrase = random.choice(self.idle_phrases)
            print(f"😴 闲置骚扰: {phrase}")

            self.bridge_bubble(phrase)
            
            # 不再停止监听，改为设置speaking标志
            # self.voice.stop_listening()  # 移除此行
            self.is_speaking = True
            
            # 播放表情
            self.switch_to_expression_animation()
            
            def idle_speak():
                self.tts.speak(phrase)
                # 等待TTS播放完成
                while self.tts.is_speaking:
                    time.sleep(0.1)
                self.is_speaking = False
                # 不再需要重新启动监听，因为监听从未停止
                # self.start_auto_listening()  # 移除此行
            
            thread = threading.Thread(target=idle_speak)
            thread.daemon = True
            thread.start()
        
        # 重新启动闲置计时器
        self.start_idle_timer()

    def run(self):
        """运行桌宠"""
        try:
            self.root.mainloop()
        except KeyboardInterrupt:
            self.close_app()

    def create_context_menu(self):
        """创建右键上下文菜单"""
        self.context_menu = tk.Menu(self.root, tearoff=0)
        
        # 模型切换子菜单
        model_menu = tk.Menu(self.context_menu, tearoff=0)
        self.context_menu.add_cascade(label="🧠 切换AI模型", menu=model_menu)
        
        # 添加模型选项
        for model_name in self.api.get_available_models():
            model_menu.add_command(
                label=model_name,
                command=lambda m=model_name: self.switch_model(m)
            )
        
        # 分隔线
        self.context_menu.add_separator()
        
        # 其他功能
        self.context_menu.add_command(label="🎤 开始/停止监听", command=self.toggle_listening)
        self.context_menu.add_command(label="🤐 停止说话", command=self.interrupt_speech)
        self.context_menu.add_separator()
        self.context_menu.add_command(label="❌ 退出", command=self.close_app)
    
    def on_right_click(self, event):
        """右键点击事件"""
        try:
            # 更新当前模型状态显示
            self.update_model_menu_status()
            
            # 显示右键菜单
            self.context_menu.post(event.x_root, event.y_root)
        except Exception as e:
            print(f"显示右键菜单失败: {str(e)}")
    
    def update_model_menu_status(self):
        """更新模型菜单状态显示"""
        try:
            # 获取模型菜单
            model_menu = self.context_menu.winfo_children()[0]  # 第一个子菜单
            
            # 更新菜单项，添加当前模型标记
            current_model = self.api.get_current_model_name()
            for i in range(model_menu.index("end") + 1):
                model_name = self.api.get_available_models()[i]
                label = f"● {model_name}" if model_name == current_model else f"  {model_name}"
                model_menu.entryconfig(i, label=label)
                
        except Exception as e:
            print(f"更新模型菜单状态失败: {str(e)}")
    
    def switch_model(self, model_name):
        """切换AI模型"""
        success = self.api.set_model(model_name)
        if success:
            print(f"🎉 模型已切换为: {model_name}")
            # 播放一个表情动画表示切换成功
            self.play_emotion_animation('happy')
        else:
            print(f"❌ 模型切换失败: {model_name}")
            self.play_emotion_animation('sad')
    
    def toggle_listening(self):
        """切换监听状态"""
        if hasattr(self.voice, 'is_listening') and self.voice.is_listening:
            self.voice.stop_listening()
            print("🔇 语音监听已关闭")
        else:
            self.voice.start_continuous_listening(self.on_voice_detected)
            print("🎙️ 语音监听已开启")

if __name__ == "__main__":
    try:
        app = VoicePet()
        app.start_animation()
        app.run()
    except Exception as e:
        print(f"启动失败: {str(e)}")
        input("按回车键退出...")
