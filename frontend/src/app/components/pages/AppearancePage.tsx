import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Image as ImageIcon, RotateCcw, Upload } from "lucide-react";
import { AnimatedPetSprite } from "../AnimatedPetSprite";
import { petSkins, type PetSkinId } from "../petSkins";
import { Button } from "../ui/button";

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
];

export function AppearancePage() {
  const [selectedAction, setSelectedAction] = useState("idle");
  const [dragActive, setDragActive] = useState(false);
  const [images, setImages] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentAction = petActions.find((action) => action.id === selectedAction) ?? petActions[0];
  const currentImage = images[selectedAction] ?? petSkins[currentAction.skin];

  useEffect(() => {
    return () => {
      Object.values(images).forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [images]);

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
        <h2 className="mb-2">形象管理</h2>
        <p className="text-muted-foreground">
          当前正在配置：<span style={{ color: currentAction.color }}>{currentAction.name}</span>
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
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
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className="bg-gradient-to-br from-primary/10 via-accent/20 to-success/10 rounded-3xl p-8 flex items-center justify-center min-h-[300px] relative overflow-hidden animate-gradient"
              >
                <motion.div
                  className="absolute inset-0"
                  animate={{
                    background: [
                      `radial-gradient(circle at 20% 50%, ${currentAction.color}30 0%, transparent 48%)`,
                      `radial-gradient(circle at 80% 48%, ${currentAction.color}28 0%, transparent 52%)`,
                      `radial-gradient(circle at 50% 80%, ${currentAction.color}26 0%, transparent 46%)`,
                      `radial-gradient(circle at 20% 50%, ${currentAction.color}30 0%, transparent 48%)`,
                    ],
                  }}
                  transition={{ duration: 8, repeat: Infinity }}
                />

                <div className="relative z-10 flex flex-col items-center gap-4">
                  <AnimatedPetSprite
                    src={currentImage}
                    alt={`${currentAction.name}形象预览`}
                    color={currentAction.color}
                    size="lg"
                    mood={currentAction.mood}
                  />
                  <div className="font-medium" style={{ color: currentAction.color }}>
                    {/* {currentAction.name}状态
                    {images[selectedAction] ? " · 自定义预览" : " · 后端默认形象"} */}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`glass-strong rounded-3xl p-8 text-center transition-all shadow-xl cursor-pointer select-none ${
              dragActive ? "ring-2 ring-primary scale-[1.02] bg-primary/5" : ""
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            whileHover={{ y: -4 }}
          >
            <motion.div animate={dragActive ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 0.3 }}>
              <Upload className="w-12 h-12 mx-auto mb-4 text-primary" />
            </motion.div>
            <h4 className="mb-2">上传“{currentAction.name}”自定义形象</h4>
            <p className="text-sm text-muted-foreground mb-4">拖拽文件到此处，或点击选择文件</p>
            <Button variant="outline" className="glass" type="button">
              <ImageIcon className="w-4 h-4 mr-2" />
              选择文件
            </Button>
            <p className="text-xs text-muted-foreground mt-4">支持 PNG/GIF，建议使用透明背景</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass-strong rounded-3xl p-8 space-y-4 shadow-xl"
        >
          <h3>动作映射</h3>
          <p className="text-sm text-muted-foreground mb-6">为每个动作配置专属形象！</p>

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
          </div>
        </motion.div>
      </div>
    </div>
  );
}
