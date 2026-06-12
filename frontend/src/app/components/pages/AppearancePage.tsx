<<<<<<< HEAD
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../ui/button";
import { Upload, Image as ImageIcon, RotateCcw } from "lucide-react";
import { AnimatedPetSprite } from "../AnimatedPetSprite";
import { petSkins, type PetSkinId } from "../petSkins";

type PetAction = {
  id: string;
  name: string;
  description: string;
  color: string;
  skin: PetSkinId;
  mood: "idle" | "happy" | "thinking" | "sleepy" | "surprised" | "angry" | "shy" | "sad";
};

const petActions: PetAction[] = [
  { id: "idle", name: "平常", description: "静止时的默认状态", color: "#76A072", skin: "normal", mood: "idle" },
  { id: "thinking", name: "思考", description: "处理消息时的动作", color: "#9CA3AF", skin: "thinking", mood: "thinking" },
  { id: "excited", name: "开心", description: "收到称赞时的表现", color: "#FFD166", skin: "happy", mood: "happy" },
  { id: "surprised", name: "惊讶", description: "受到惊吓或发现新奇事物", color: "#FFA500", skin: "surprised", mood: "surprised" },
  { id: "sleep", name: "睡眠", description: "长时间未互动时的状态", color: "#7C83B8", skin: "sleepy", mood: "sleepy" },
  { id: "angry", name: "生气", description: "被频繁打扰或拒绝时的反应", color: "#EF4444", skin: "angry", mood: "angry" },
  { id: "shy", name: "害羞", description: "特定互动时的表情", color: "#FFB5D5", skin: "shy", mood: "shy" },
  { id: "sad", name: "难过", description: "心情低落或负面反馈时的表现", color: "#3B82F6", skin: "sad", mood: "sad" },
  { id: "scornful", name: "轻蔑", description: "对特定操作的傲娇反应", color: "#8B5CF6", skin: "contempt", mood: "idle" },
=======
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../ui/button";
import { Upload, Image as ImageIcon, Sparkles, Heart, Star, RotateCcw } from "lucide-react";

const petActions = [
  { id: "idle", name: "呼吸", description: "静止时的默认状态", color: "#76A072" },
  { id: "thinking", name: "思考", description: "处理消息时的动作", color: "#9CA3AF" },
  { id: "excited", name: "开心", description: "收到称赞时的表现", color: "#FFD700" },
  { id: "surprised", name: "惊讶", description: "受到惊吓或发现新奇事物", color: "#FFA500" },
  { id: "sleep", name: "睡眠", description: "长时间未交互时的状态", color: "#4B0082" },
  { id: "angry", name: "生气", description: "被频繁打扰或拒绝时的反应", color: "#EF4444" },
  { id: "shy", name: "害羞", description: "特定互动时的表情", color: "#FFB5D5" },
  { id: "sad", name: "难过", description: "心情低落或负面反馈时的表现", color: "#3B82F6" },
  { id: "scornful", name: "轻蔑", description: "对特定操作的傲娇反应", color: "#8B5CF6" },
>>>>>>> be28e4a7ac11de98be10fbbbab996f6970242706
];

export function AppearancePage() {
  const [selectedAction, setSelectedAction] = useState("idle");
  const [dragActive, setDragActive] = useState(false);
<<<<<<< HEAD
  const [images, setImages] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentAction = petActions.find((action) => action.id === selectedAction) ?? petActions[0];
  const currentImage = images[selectedAction] ?? petSkins[currentAction.skin];

=======

  // 统一管理各个动作导入的图片路径或 Blob URL
  const [images, setImages] = useState<Record<string, string>>({});

  // 隐藏的真实文件输入框引用
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentAction = petActions.find(a => a.id === selectedAction);

  // 组件卸载时自动释放内存中的 Blob URL，防止内存泄漏
>>>>>>> be28e4a7ac11de98be10fbbbab996f6970242706
  useEffect(() => {
    return () => {
      Object.values(images).forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [images]);

<<<<<<< HEAD
  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("请上传图片文件，支持 PNG 或 GIF。");
      return;
    }

    const isDesktopApp =
      typeof window !== "undefined" && ((window as any).electronAPI || (window as any).__TAURI__);

    if (isDesktopApp) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const extension = file.name.split(".").pop() || "png";

        let savedPath = "";
        if ((window as any).electronAPI) {
          savedPath = await (window as any).electronAPI.savePetImage({
            arrayBuffer,
            actionId: selectedAction,
            extension,
          });
        } else if ((window as any).__TAURI__) {
          // Future Tauri integration can save the file here.
        }

        if (savedPath) {
          setImages((prev) => ({ ...prev, [selectedAction]: savedPath }));
        }
      } catch (error) {
        console.error("本地文件保存失败", error);
        alert("本地保存失败，请检查桌面端配置。");
      }
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImages((prev) => {
      if (prev[selectedAction]?.startsWith("blob:")) {
        URL.revokeObjectURL(prev[selectedAction]);
      }
      return { ...prev, [selectedAction]: previewUrl };
    });
  };

  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(event.type === "dragenter" || event.type === "dragover");
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleResetImage = (actionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setImages((prev) => {
=======
  // 核心文件处理与环境路由逻辑
  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("请上传图片文件（支持 PNG 或 GIF）");
      return;
    }

    // 检测未来是否在桌面应用环境中（例如挂载在 window 上的自定义 API）
    const isDesktopApp = typeof window !== "undefined" && ((window as any).electronAPI || (window as any).__TAURI__);

    if (isDesktopApp) {
      try {
        // --- 核心逻辑：未来桌面端写入 src/assets/import ---
        const arrayBuffer = await file.arrayBuffer();
        const extension = file.name.split(".").pop() || "gif";

        let savedPath = "";
        if ((window as any).electronAPI) {
          // Electron 写入调用
          savedPath = await (window as any).electronAPI.savePetImage({
            arrayBuffer,
            actionId: selectedAction,
            extension
          });
        } else if ((window as any).__TAURI__) {
          // Tauri 写入调用示例
          // savedPath = await (window as any).__TAURI__.invoke("save_pet_image", { ... });
        }

        setImages(prev => ({ ...prev, [selectedAction]: savedPath }));
      } catch (error) {
        console.error("桌面端本地文件写入失败:", error);
        alert("本地保存失败，请检查桌面端配置");
      }
    } else {
      // --- 核心逻辑：当前普通浏览器开发阶段的降级预览 ---
      console.warn(
        `[环境提示] 当前为网页预览环境。在最终打包的桌面应用中，该文件将被真实写入并保存至：\nsrc/assets/import/${selectedAction}_animation.${file.name.split(".").pop()}`
      );

      // 生成即时预览的 Blob URL
      const previewUrl = URL.createObjectURL(file);

      setImages(prev => {
        // 如果该动作之前已经有旧的旧临时 URL，先释放它
        if (prev[selectedAction]?.startsWith("blob:")) {
          URL.revokeObjectURL(prev[selectedAction]);
        }
        return {
          ...prev,
          [selectedAction]: previewUrl
        };
      });
    }
  };

  // 拖拽区域事件监听
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // 移除/重置特定动作的自定义形象
  const handleResetImage = (actionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止触发列表项的选择事件
    setImages(prev => {
>>>>>>> be28e4a7ac11de98be10fbbbab996f6970242706
      const updated = { ...prev };
      if (updated[actionId]?.startsWith("blob:")) {
        URL.revokeObjectURL(updated[actionId]);
      }
      delete updated[actionId];
      return updated;
    });
  };

  return (
    <div className="p-8 space-y-6 min-h-full">
<<<<<<< HEAD
=======
      {/* 隐藏的真实原生文件选择器 */}
>>>>>>> be28e4a7ac11de98be10fbbbab996f6970242706
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/gif"
        className="hidden"
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
<<<<<<< HEAD
        <h2 className="mb-2">形象管理</h2>
        <p className="text-muted-foreground">
          当前正在配置：<span style={{ color: currentAction.color }}>{currentAction.name}</span>
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
=======
        <h2 className="mb-2">形象 management</h2>
        <p className="text-muted-foreground">
          让你的桌宠更有个性（当前正在配置：<span style={{ color: currentAction?.color }}>{currentAction?.name}</span> 状态）
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* 左上：形象预览卡片 */}
>>>>>>> be28e4a7ac11de98be10fbbbab996f6970242706
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-strong rounded-3xl p-8 space-y-4 shadow-xl"
          >
            <h3 className="mb-4">形象预览</h3>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedAction}
<<<<<<< HEAD
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className="bg-gradient-to-br from-primary/10 via-accent/20 to-success/10 rounded-3xl p-8 flex items-center justify-center min-h-[300px] relative overflow-hidden animate-gradient"
=======
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-primary/10 via-accent/20 to-success/10 rounded-3xl p-8 flex items-center justify-center min-h-[280px] relative overflow-hidden animate-gradient"
>>>>>>> be28e4a7ac11de98be10fbbbab996f6970242706
              >
                <motion.div
                  className="absolute inset-0"
                  animate={{
                    background: [
<<<<<<< HEAD
                      `radial-gradient(circle at 20% 50%, ${currentAction.color}30 0%, transparent 48%)`,
                      `radial-gradient(circle at 80% 48%, ${currentAction.color}28 0%, transparent 52%)`,
                      `radial-gradient(circle at 50% 80%, ${currentAction.color}26 0%, transparent 46%)`,
                      `radial-gradient(circle at 20% 50%, ${currentAction.color}30 0%, transparent 48%)`,
=======
                      `radial-gradient(circle at 20% 50%, ${currentAction?.color}30 0%, transparent 50%)`,
                      `radial-gradient(circle at 80% 50%, ${currentAction?.color}30 0%, transparent 50%)`,
                      `radial-gradient(circle at 50% 80%, ${currentAction?.color}30 0%, transparent 50%)`,
                      `radial-gradient(circle at 20% 50%, ${currentAction?.color}30 0%, transparent 50%)`,
>>>>>>> be28e4a7ac11de98be10fbbbab996f6970242706
                    ],
                  }}
                  transition={{ duration: 8, repeat: Infinity }}
                />

<<<<<<< HEAD
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <AnimatedPetSprite
                    src={currentImage}
                    alt={`${currentAction.name}形象预览`}
                    color={currentAction.color}
                    size="lg"
                    mood={currentAction.mood}
                  />
                  <div className="font-medium" style={{ color: currentAction.color }}>
                    {/* {currentAction.name}状态 */}
                    {/* {images[selectedAction] ? " · 自定义预览" : " · 后端默认形象"} */}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

=======
                <div className="text-center space-y-4 relative z-10 w-full flex flex-col items-center">
                  <motion.div
                    className="w-40 h-40 rounded-full flex items-center justify-center relative overflow-hidden bg-background/10 backdrop-blur-sm"
                    style={{ backgroundColor: `${currentAction?.color}20` }}
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {/* 如果存在上传的图片则渲染 <img> 标签，否则展示默认的 Sparkles */}
                    {images[selectedAction] ? (
                      <img
                        src={images[selectedAction]}
                        alt={`${currentAction?.name} 预览`}
                        className="w-full h-full object-contain p-2 max-w-full max-h-full"
                      />
                    ) : (
                      <Sparkles className="w-20 h-20 text-primary animate-breathe" />
                    )}

                    <motion.div
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{ border: `2px solid ${currentAction?.color}` }}
                      animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-medium"
                    style={{ color: currentAction?.color }}
                  >
                    {currentAction?.name}状态
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-center gap-2">
              {[Heart, Star, Sparkles].map((Icon, i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                >
                  <Icon className="w-4 h-4 text-primary/50" />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 左下：点击/拖拽上传区域 */}
>>>>>>> be28e4a7ac11de98be10fbbbab996f6970242706
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
<<<<<<< HEAD
            className={`glass-strong rounded-3xl p-8 text-center transition-all shadow-xl cursor-pointer select-none ${
              dragActive ? "ring-2 ring-primary scale-[1.02] bg-primary/5" : ""
            }`}
=======
            className={`glass-strong rounded-3xl p-8 text-center transition-all shadow-xl cursor-pointer select-none ${dragActive ? "ring-2 ring-primary scale-[1.02] bg-primary/5" : ""
              }`}
>>>>>>> be28e4a7ac11de98be10fbbbab996f6970242706
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            whileHover={{ y: -4 }}
          >
<<<<<<< HEAD
            <motion.div animate={dragActive ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 0.3 }}>
              <Upload className="w-12 h-12 mx-auto mb-4 text-primary" />
            </motion.div>
            <h4 className="mb-2">上传“{currentAction.name}”自定义形象</h4>
            <p className="text-sm text-muted-foreground mb-4">拖拽文件到此处，或点击选择文件</p>
=======
            <motion.div
              animate={dragActive ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-primary" />
            </motion.div>
            <h4 className="mb-2">上传【{currentAction?.name}】自定义形象</h4>
            <p className="text-sm text-muted-foreground mb-4">
              拖拽文件到此处，或点击选择文件
            </p>
>>>>>>> be28e4a7ac11de98be10fbbbab996f6970242706
            <Button variant="outline" className="glass" type="button">
              <ImageIcon className="w-4 h-4 mr-2" />
              选择文件
            </Button>
<<<<<<< HEAD
            <p className="text-xs text-muted-foreground mt-4">支持 PNG/GIF，建议使用透明背景</p>
          </motion.div>
        </div>

=======
            <p className="text-xs text-muted-foreground mt-4">
              支持 PNG/GIF 格式，建议背景透明
            </p>
          </motion.div>
        </div>

        {/* 右侧：动作映射列表 */}
>>>>>>> be28e4a7ac11de98be10fbbbab996f6970242706
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass-strong rounded-3xl p-8 space-y-4 shadow-xl"
        >
          <h3>动作映射</h3>
<<<<<<< HEAD
          <p className="text-sm text-muted-foreground mb-6">每个动作都会默认使用后端同名表情图，也可以单独替换。</p>

          <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
            {petActions.map((action, index) => {
              const image = images[action.id] ?? petSkins[action.skin];
              return (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 + 0.3 }}
                  whileHover={{ x: 4, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`glass rounded-2xl p-4 cursor-pointer transition-all relative overflow-hidden ${
                    selectedAction === action.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedAction(action.id)}
                  style={{
                    background:
                      selectedAction === action.id ? `linear-gradient(135deg, ${action.color}15, transparent)` : undefined,
                  }}
                >
                  <div className="flex items-center justify-between relative z-10 gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-background/40 backdrop-blur-sm shrink-0">
                        <img src={image} alt="" className="w-11 h-11 object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{action.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{action.description}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="glass text-xs"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedAction(action.id);
                          fileInputRef.current?.click();
                        }}
                      >
                        更换
                      </Button>

                      {images[action.id] && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="glass p-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="恢复默认"
                          onClick={(event) => handleResetImage(action.id, event)}
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
=======
          <p className="text-sm text-muted-foreground mb-6">
            为每个动作配置专属形象
          </p>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {petActions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 + 0.3 }}
                whileHover={{ x: 4, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`glass rounded-2xl p-4 cursor-pointer transition-all relative overflow-hidden ${selectedAction === action.id ? "ring-2 ring-primary" : ""
                  }`}
                onClick={() => setSelectedAction(action.id)}
                style={{
                  background: selectedAction === action.id
                    ? `linear-gradient(135deg, ${action.color}15, transparent)`
                    : undefined,
                }}
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3 flex-1">
                    {/* 小缩略图预览 */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden bg-background/40 backdrop-blur-sm"
                      style={{ backgroundColor: images[action.id] ? undefined : `${action.color}30` }}
                    >
                      {images[action.id] ? (
                        <img src={images[action.id]} alt="" className="w-8 h-8 object-contain" />
                      ) : (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: action.color }}
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{action.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {action.description}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="glass text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAction(action.id);
                        fileInputRef.current?.click();
                      }}
                    >
                      更换
                    </Button>

                    {/* 如果该动作上传过图片，显示重置/删除按钮 */}
                    {images[action.id] && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="glass p-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="恢复默认"
                        onClick={(e) => handleResetImage(action.id, e)}
                      >
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground border-t border-dashed border-muted-foreground/10 pt-2">
                  <ImageIcon className="w-3 h-3" />
                  <span className="font-mono">
                    {images[action.id] ? `${action.id}_custom_avatar.${images[action.id].startsWith('blob:') ? 'gif/png' : 'gif'}` : `${action.id}_animation.gif`}
                  </span>
                </div>
              </motion.div>
            ))}
>>>>>>> be28e4a7ac11de98be10fbbbab996f6970242706
          </div>
        </motion.div>
      </div>
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> be28e4a7ac11de98be10fbbbab996f6970242706
