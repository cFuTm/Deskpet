# Desktop Pet 联动版

这个仓库现在保留的是一套联动后的桌宠方案：

- Python 端负责语音输入、DeepSeek 对话、Edge TTS 播报
- C# 端负责桌面悬浮宠物的实时表情和气泡展示
- Python 端通过桥接服务把“正在思考 / 正在回复 / 气泡文本”推给 C# 端

---

## 运行方式

### 1. 激活环境

```powershell
conda activate pet
```

### 2. 安装 Python 依赖

```powershell
pip install -r requirements.txt
```

### 3. 配置 API Key

把 DeepSeek API Key 写入 [key.txt](key.txt)。

### 4. 启动桥接服务

```powershell
python src/hongjun_bridge.py
```

这个服务监听 `http://localhost:9101`，给 C# 桌宠提供状态接口。

### 5. 启动 Python 语音桌宠

```powershell
python voice_pet.py
```

### 6. 启动 C# 桌宠

先编译，再运行生成的程序：

```powershell
cmd /c scripts\compile.bat
```

编译完成后运行 `HongjunPet.exe`。

---

## 联动方式

1. 用户对 Python 桌宠说话。
2. `voice_pet.py` 把状态写入桥接服务：`/think`、`/bubble`、`/reply`。
3. `src/HongjunPet.cs` 轮询 `/status`，实时切换成思考、回复、空闲等表情。
4. 桌宠气泡里显示最近一条 AI 回复或提示文本。

如果桥接服务没有启动，Python 桌宠仍然可以单独对话；只是 C# 桌宠不会联动。

---

## 文件说明

### Python 侧

- [voice_pet.py](voice_pet.py) - Python 桌宠主入口，负责语音输入、对话、表情、TTS，以及把状态推给桥接服务。
- [deepseek_api.py](deepseek_api.py) - DeepSeek 对话封装，支持模型切换和联网搜索。
- [edge_tts_handler.py](edge_tts_handler.py) - 微软 Edge TTS 播报封装。
- [voice_handler_local.py](voice_handler_local.py) - 本地离线语音识别与播报处理器，当前主用。
- [search_api.py](search_api.py) - 搜索查询识别与 DuckDuckGo 搜索封装。
- [config.py](config.py) - 全局配置：窗口标题、窗口尺寸、桥接地址、API Key 读取。
- [install_edge_tts.py](install_edge_tts.py) - Edge TTS 相关的一次性安装/准备脚本。
- [process_video.py](process_video.py) - 透明背景视频/动画处理工具，属于素材生成辅助脚本。

### C# / 桌面桥接侧

- [src/HongjunPet.cs](src/HongjunPet.cs) - C# 桌宠主程序，负责窗口绘制、皮肤、表情和气泡展示。
- [src/hongjun_bridge.py](src/hongjun_bridge.py) - 桥接服务，接收 Python 端推送并向 C# 桌宠输出状态。
- [scripts/compile.bat](scripts/compile.bat) - 一键编译 C# 桌宠的批处理脚本。
- [skin_generator/skin_gen.cs](skin_generator/skin_gen.cs) - 皮肤生成工具。
- [skin_generator/resize_skins.cs](skin_generator/resize_skins.cs) - 皮肤缩放工具。

### 资源与文档

- [image/](image/) - Python 桌宠使用的 GIF 和图片资源。
- [logo/](logo/) - 图标/Logo 资源。
- [config/](config/) - 额外的系统服务配置文件。
- [requirements.txt](requirements.txt) - Python 依赖列表。
- [key.txt](key.txt) - 本地保存的 DeepSeek API Key。
- [README2.md](README2.md) - 旧版 Hermes 说明文档，保留作历史参考。

---

## 这次整理后保留的核心入口

- Python 语音桌宠：`voice_pet.py`
- C# 桌宠：`src/HongjunPet.cs`
- 桥接服务：`src/hongjun_bridge.py`

原来混在一起的旧入口已经删除，不再建议使用。

---

## 备注

- 如果你只想看 Python 语音桌宠，直接启动 `voice_pet.py`。
- 如果你只想看桌面小精灵，启动桥接服务后再运行 C# 程序即可。
- 想让两边真正联动，三个进程都要起来：桥接服务、Python 桌宠、C# 桌宠。
