# 语音实时交互的陪伴型 AI 桌宠

- Python 端负责语音输入、通用对话 API、Edge TTS 播报。
- C# 端负责桌面悬浮宠物的表情、气泡、拖拽、关闭按钮和右键菜单。
- Python 端通过桥接服务把“正在思考 / 正在回复 / 情绪 / 气泡文本”推给 C# 端。

---

## 运行方式

### 1. 激活环境

```powershell
& 'D:\anaconda3\shell\condabin\conda-hook.ps1'
conda activate pet
```

### 2. 安装 Python 依赖

```powershell
pip install -r requirements.txt
```

### 3. 配置通用对话 API

在 [config.py](config.py) 中配置 OpenAI-compatible chat completions 接口：

```python
CHAT_BASE_URL = "https://your-api-host/v1/chat/completions"
CHAT_MODEL = "your-chat-model"
```

API Key 可以写入 [key.txt](key.txt)，也可以通过环境变量 `CHAT_API_KEY` 提供。

### 4. 配置桌宠名称和唤醒时间

在 [config.py](config.py) 中修改：

```python
PET_NAME = "小鲸"
WAKE_TIMEOUT = 15
```

语音服务默认只响应唤醒词。说出“小鲸”后，会进入 15 秒连续对话窗口；如果这段时间内没有新对话，会自动休眠并重新等待唤醒词。

### 5. 启动桥接服务

```powershell
python src/pet_bridge.py
```

这个服务监听 `http://localhost:9101`，给 C# 桌宠提供状态接口。

### 6. 启动 Python 语音服务

```powershell
python voice_pet.py
```

### 7. 启动 C# 桌宠

先编译，再运行生成的程序：

```powershell
& 'C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe' /target:winexe /out:DesktopPet.exe /reference:System.Drawing.dll /reference:System.Windows.Forms.dll /reference:System.Net.Http.dll src\DesktopPet.cs
.\DesktopPet.exe
```

桌宠右上角有一个可点击的关闭按钮；也可以右键桌宠选择“退出桌宠”。

---

## 联动方式

1. 用户说出唤醒词。
2. `voice_pet.py` 进入短暂唤醒状态，并把用户语音文本发给 [chat_api.py](chat_api.py)。
3. `chat_api.py` 调用 `CHAT_BASE_URL` 指向的通用对话 API。
4. `voice_pet.py` 把状态写入桥接服务：`/think`、`/bubble`、`/reply`、`/emotion`。
5. [src/DesktopPet.cs](src/DesktopPet.cs) 轮询 `/status`，实时切换表情和气泡。
6. 右键点击 C# 桌宠可以手动开启/关闭语音交互。

---

## 文件说明

### Python 侧

- [voice_pet.py](voice_pet.py) - 语音服务主入口，负责语音输入、对话、TTS，以及把状态推给桥接服务。
- [chat_api.py](chat_api.py) - 通用 OpenAI-compatible 对话 API 封装。
- [edge_tts_handler.py](edge_tts_handler.py) - 微软 Edge TTS 播报封装。
- [voice_handler_local.py](voice_handler_local.py) - 本地离线语音识别处理器。
- [search_api.py](search_api.py) - 搜索查询识别与 DuckDuckGo 搜索封装。
- [config.py](config.py) - 全局配置：API、桌宠名称、唤醒时间、桥接地址。

### C# / 桌面桥接侧

- [src/DesktopPet.cs](src/DesktopPet.cs) - C# 桌宠主程序，负责窗口绘制、皮肤、表情和气泡展示。
- [src/pet_bridge.py](src/pet_bridge.py) - 桥接服务，接收 Python 端推送并向 C# 桌宠输出状态。
- [skin_generator/user_defined_skin.cs](skin_generator/user_defined_skin.cs) - 用户自定义图片缩放工具。

---

## 自定义桌宠形象

用户把想自定义的表情原图放在 `skin_src/` 下，按情绪命名：

- `normal.png`
- `happy.png`
- `surprised.png`
- `sleepy.png`
- `thinking.png`
- `shy.png`
- `sad.png`
- `angry.png`
- `contempt.png`

图片建议使用透明背景 PNG，角色主体居中。运行 `skin_generator/user_defined_skin.cs` 编译出的工具后，会把用户原图统一缩放到 `skin_src/skin_src_resized/`。

用户可以只提供部分表情；没提供的表情会回退到桌宠代码绘制的默认形象。桌宠本体会给静态图片自动加轻微漂浮、呼吸、思考抖动等动态效果。
