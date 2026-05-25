import { motion, AnimatePresence } from "motion/react";
import { Heart, Sparkles, Smile, Moon, Sun, Cloud, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";

type Emotion = "happy" | "calm" | "sleepy" | "excited";

const emotionConfig = {
  happy: {
    icon: Smile,
    label: "开心愉悦",
    color: "#FFB088",
    bgGradient: "from-yellow-400/10 via-orange-300/10 to-pink-300/10",
    description: "今天心情不错呢！",
    defaultText: "欢迎回来！主人，今天有什么吩咐吗？✨",
    clickText: "哎呀！被你戳到了~ 感觉暖洋洋的 🐾",
  },
  calm: {
    icon: Cloud,
    label: "平静放松",
    color: "#76A072",
    bgGradient: "from-green-300/10 via-teal-300/10 to-blue-300/10",
    description: "一切都很安宁~",
    defaultText: "呼... 这样静静地陪着你，真好。🍃",
    clickText: "嗯？揉揉脑袋吗？(๑´ㅂ`๑)",
  },
  sleepy: {
    icon: Moon,
    label: "困倦休息",
    color: "#9CA3AF",
    bgGradient: "from-slate-300/10 via-purple-300/10 to-indigo-300/10",
    description: "有点累了，想休息一下...",
    defaultText: "呜... 困意卷上来了，主人也早点休息哦。💤",
    clickText: "呜哇... 别摇了，快要睡着了嘛... 💤",
  },
  excited: {
    icon: Sparkles,
    label: "兴奋活跃",
    color: "#FF8E6E",
    bgGradient: "from-pink-400/10 via-purple-400/10 to-red-400/10",
    description: "精神满满！一起做点什么吧！",
    defaultText: "好耶！感觉现在充满了力量！我们来聊天吧！🔥",
    clickText: "哇塞！电力值瞬间拉满啦！( > ▽ < )",
  },
};

export function EmotionStatusCenter() {
  const [emotion, setEmotion] = useState<Emotion>("happy");
  const [activity, setActivity] = useState(65);
  const [bubbleText, setBubbleText] = useState("");
  const [isClicked, setIsClicked] = useState(false);

  const config = emotionConfig[emotion];
  const Icon = config.icon;

  // 初始化时间判断
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

  // 当外部/点击切换情绪时，同步更新默认文本
  const handleEmotionChange = (newEmotion: Emotion) => {
    setEmotion(newEmotion);
    setBubbleText(emotionConfig[newEmotion].defaultText);
  };

  // 戳一戳互动反馈
  const handlePetClick = () => {
    setIsClicked(true);
    setBubbleText(config.clickText);

    // 2秒后恢复到当前状态的常驻文本
    setTimeout(() => {
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
      {/* 后方动态辐射光晕 */}
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

      {/* 两栏大容器 */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-5 gap-8 items-center">

        {/* ================= 左半栏：形象展示区（占 2/5 宽度） ================= */}
        <div className="md:col-span-2 flex flex-col items-center justify-center relative min-h-[320px] pt-12">

          {/* 动态对话气泡 */}
          <AnimatePresence mode="wait">
            <motion.div
              key={bubbleText}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className="absolute top-0 glass-strong shadow-lg rounded-2xl px-5 py-2.5 border text-center z-20 max-w-[240px]"
            >
              <div className="text-xs font-medium leading-relaxed text-foreground/90">
                {bubbleText}
              </div>
              <div
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 glass border-r border-b rotate-45"
                style={{ background: "inherit" }}
              />
            </motion.div>
          </AnimatePresence>

          {/* 桌宠舞台主体 */}
          <motion.div
            onClick={handlePetClick}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="cursor-pointer relative z-10 w-48 h-48 flex items-center justify-center group"
          >
            {/* 外围虚拟刻度圈 */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: `2px dashed ${config.color}30` }}
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            />

            {/* 核心形象底座/载体 */}
            <motion.div
              className="w-36 h-36 rounded-full flex items-center justify-center relative shadow-inner"
              style={{ backgroundColor: `${config.color}15` }}
              animate={{
                y: emotion === "sleepy" ? [0, -2, 0] : [0, -6, 0],
                scale: isClicked ? [1, 1.08, 1] : 1,
              }}
              transition={{
                duration: emotion === "sleepy" ? 4 : 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Icon
                className="w-16 h-16 transition-colors duration-500"
                style={{ color: config.color }}
              />

              {/* 扩散水波纹特效 */}
              <motion.div
                className="absolute inset-0 rounded-full border"
                style={{ borderColor: config.color }}
                animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />

              {/* 戳我悬浮提示 */}
              <div className="absolute opacity-0 group-hover:opacity-100 bottom-3 bg-background/90 px-2 py-0.5 rounded-full text-[10px] transition-opacity pointer-events-none border shadow-sm tracking-wider">
                TAP 🐾
              </div>
            </motion.div>
          </motion.div>

          {/* 底部粒子阴影 */}
          <motion.div
            className="w-24 h-2 bg-black/5 dark:bg-white/5 rounded-full blur-md mt-2 pointer-events-none"
            animate={{ scaleX: [1, 0.88, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* ================= 右半栏：状态与控制数据（占 3/5 宽度） ================= */}
        <div className="md:col-span-3 space-y-6">
          {/* 标题控制部分 */}
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

          {/* 活跃度条与快捷状态切换 */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: config.color }} />
                  {config.label}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  活跃度 {activity}%
                </span>
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

            {/* 情绪档位条切换器 */}
            <div className="flex gap-2 p-1.5 bg-muted/30 rounded-xl border">
              {(["happy", "calm", "sleepy", "excited"] as Emotion[]).map((emotionType) => (
                <motion.button
                  key={emotionType}
                  onClick={() => handleEmotionChange(emotionType)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${emotion === emotionType
                    ? "shadow-sm text-foreground border bg-background/80"
                    : "text-muted-foreground opacity-60 hover:opacity-100"
                    }`}
                  style={{
                    borderLeft: emotion === emotionType ? `3px solid ${emotionConfig[emotionType].color}` : undefined
                  }}
                >
                  {emotionConfig[emotionType].label.substring(0, 2)}
                </motion.button>
              ))}
            </div>
          </div>

          {/* 底部三栏状态挂件 */}
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
                <div className="text-[11px] text-muted-foreground mb-0.5">
                  {stat.label}
                </div>
                <div className="text-sm font-semibold text-foreground">{stat.value}</div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </motion.div>
  );
}