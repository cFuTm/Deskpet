import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Cloud, Heart, Moon, Smile, Sparkles, Sun } from "lucide-react";
import { AnimatedPetSprite } from "./AnimatedPetSprite";
import { petSkins, type PetSkinId } from "./petSkins";

type Emotion = "happy" | "calm" | "sleepy" | "excited";

const emotionConfig: Record<
  Emotion,
  {
    icon: typeof Smile;
    label: string;
    color: string;
    bgGradient: string;
    description: string;
    defaultText: string;
    clickText: string;
    skin: PetSkinId;
    mood: "idle" | "happy" | "sleepy" | "surprised";
  }
> = {
  happy: {
    icon: Smile,
    label: "开心愉悦",
    color: "#FFB088",
    bgGradient: "from-yellow-400/10 via-orange-300/10 to-pink-300/10",
    description: "今天心情不错呢！",
    defaultText: "欢迎回来！想和我聊点什么呢？",
    clickText: "哎呀，被你戳到啦~",
    skin: "happy",
    mood: "happy",
  },
  calm: {
    icon: Cloud,
    label: "平静放松",
    color: "#76A072",
    bgGradient: "from-green-300/10 via-teal-300/10 to-blue-300/10",
    description: "一切都很安定。",
    defaultText: "这样安静地陪着你，也很好。",
    clickText: "嗯？要摸摸脑袋吗？",
    skin: "normal",
    mood: "idle",
  },
  sleepy: {
    icon: Moon,
    label: "困倦休息",
    color: "#9CA3AF",
    bgGradient: "from-slate-300/10 via-purple-300/10 to-indigo-300/10",
    description: "有点累了，想休息一下。",
    defaultText: "困意卷上来了，主人也早点休息哦。",
    clickText: "别摇啦，我快要睡着了。",
    skin: "sleepy",
    mood: "sleepy",
  },
  excited: {
    icon: Sparkles,
    label: "兴奋活跃",
    color: "#FF8E6E",
    bgGradient: "from-pink-400/10 via-purple-400/10 to-red-400/10",
    description: "精神满满，一起做点什么吧！",
    defaultText: "好耶，感觉现在充满了能量！",
    clickText: "能量值瞬间拉满啦！",
    skin: "surprised",
    mood: "surprised",
  },
};

export function EmotionStatusCenter() {
  const [emotion, setEmotion] = useState<Emotion>("happy");
  const [activity] = useState(65);
  const [bubbleText, setBubbleText] = useState("");
  const [isClicked, setIsClicked] = useState(false);

  const config = emotionConfig[emotion];

  useEffect(() => {
    const hour = new Date().getHours();
    let currentEmotion: Emotion = "happy";
    if (hour >= 0 && hour < 6) currentEmotion = "sleepy";
    else if (hour >= 6 && hour < 12) currentEmotion = "excited";
    else if (hour >= 12 && hour < 18) currentEmotion = "happy";
    else currentEmotion = "calm";

    setEmotion(currentEmotion);
    setBubbleText(emotionConfig[currentEmotion].defaultText);
  }, []);

  const handleEmotionChange = (newEmotion: Emotion) => {
    setEmotion(newEmotion);
    setBubbleText(emotionConfig[newEmotion].defaultText);
  };

  const handlePetClick = () => {
    setIsClicked(true);
    setBubbleText(config.clickText);

    window.setTimeout(() => {
      setIsClicked(false);
      setBubbleText(config.defaultText);
    }, 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`glass-strong rounded-3xl p-8 relative overflow-hidden shadow-xl bg-gradient-to-br ${config.bgGradient} animate-gradient w-full mx-auto`}
    >
      <motion.div
        className="absolute inset-0 opacity-40 pointer-events-none"
        animate={{
          background: [
            `radial-gradient(circle at 20% 50%, ${config.color}30 0%, transparent 50%)`,
            `radial-gradient(circle at 40% 60%, ${config.color}25 0%, transparent 50%)`,
            `radial-gradient(circle at 30% 40%, ${config.color}30 0%, transparent 50%)`,
            `radial-gradient(circle at 20% 50%, ${config.color}30 0%, transparent 50%)`,
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-5 gap-8 items-center">
        <div className="md:col-span-2 flex flex-col items-center justify-center relative min-h-[320px] pt-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={bubbleText}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className="absolute top-0 glass-strong shadow-lg rounded-2xl px-5 py-2.5 border text-center z-20 max-w-[240px]"
            >
              <div className="text-xs font-medium leading-relaxed text-foreground/90">{bubbleText}</div>
              <div
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 glass border-r border-b rotate-45"
                style={{ background: "inherit" }}
              />
            </motion.div>
          </AnimatePresence>

          <AnimatedPetSprite
            src={petSkins[config.skin]}
            alt={`${config.label}形象`}
            color={config.color}
            size="lg"
            mood={config.mood}
            interactive
            clicked={isClicked}
            onClick={handlePetClick}
            className="mt-4"
          />
        </div>

        <div className="md:col-span-3 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="mb-1 text-xl font-semibold">状态中心</h3>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="cursor-pointer p-2 rounded-xl bg-background/40 border"
            >
              <Heart className="w-5 h-5 text-primary fill-primary/20" />
            </motion.div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: config.color }} />
                  {config.label}
                </span>
                <span className="text-xs text-muted-foreground font-mono">活跃度 {activity}%</span>
              </div>
              <div className="h-2.5 bg-secondary rounded-full overflow-hidden p-[2px]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: config.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${activity}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                />
              </div>
            </div>

            <div className="flex gap-2 p-1.5 bg-muted/30 rounded-xl border">
              {(["happy", "calm", "sleepy", "excited"] as Emotion[]).map((emotionType) => {
                const option = emotionConfig[emotionType];
                const OptionIcon = option.icon;
                return (
                  <motion.button
                    key={emotionType}
                    type="button"
                    onClick={() => handleEmotionChange(emotionType)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                      emotion === emotionType
                        ? "shadow-sm text-foreground border bg-background/80"
                        : "text-muted-foreground opacity-60 hover:opacity-100"
                    }`}
                    style={{
                      borderLeft: emotion === emotionType ? `3px solid ${option.color}` : undefined,
                    }}
                  >
                    <OptionIcon className="w-3.5 h-3.5" />
                    {option.label.slice(0, 2)}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "陪伴时长", value: "2.5h", icon: Sun },
              { label: "亲密度", value: "Lv.8", icon: Heart },
              { label: "今日互动", value: "23次", icon: Sparkles },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                whileHover={{ y: -2 }}
                className="glass rounded-2xl p-3 text-center border shadow-sm"
              >
                <stat.icon className="w-3.5 h-3.5 mx-auto mb-1 text-primary" />
                <div className="text-[11px] text-muted-foreground mb-0.5">{stat.label}</div>
                <div className="text-sm font-semibold text-foreground">{stat.value}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
