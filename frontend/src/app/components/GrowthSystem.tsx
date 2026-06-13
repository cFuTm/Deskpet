import { motion } from "motion/react";
import { Lock, Sparkles, Star, Trophy } from "lucide-react";
import { Button } from "./ui/button";

const levels = [
  { level: 1, name: "初识", unlocked: true, required: 0 },
  { level: 2, name: "熟悉", unlocked: true, required: 10 },
  { level: 3, name: "亲密", unlocked: true, required: 30 },
  { level: 4, name: "挚友", unlocked: true, required: 60 },
  { level: 5, name: "知己", unlocked: false, required: 100 },
];

const unlockedActions = [
  { name: "平常", unlocked: true },
  { name: "思考", unlocked: true },
  { name: "开心", unlocked: true },
  { name: "惊讶", unlocked: true },
  { name: "睡眠", unlocked: false },
  { name: "生气", unlocked: false },
  { name: "害羞", unlocked: false },
  { name: "难过", unlocked: false },
  { name: "轻蔑", unlocked: false },
];

export function GrowthSystem() {
  const currentLevel = 4;
  const currentExp = 68;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="glass-strong rounded-3xl p-8 shadow-xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="mb-1">成长系统</h3>
          <p className="text-sm text-muted-foreground">与TalkBuddy一起慢慢变熟。</p>
        </div>
        <Trophy className="w-6 h-6 text-primary" />
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">
            当前等级：Lv.{currentLevel} {levels[currentLevel - 1]?.name}
          </span>
          <span className="text-sm text-muted-foreground">{currentExp}/100 经验</span>
        </div>

        <div className="h-3 bg-secondary rounded-full overflow-hidden mb-4">
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-success to-primary rounded-full relative overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: `${currentExp}%` }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <motion.div
              className="absolute inset-0"
              animate={{ backgroundPosition: ["0% 0%", "100% 0%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                backgroundSize: "200% 100%",
              }}
            />
          </motion.div>
        </div>

        <div className="flex justify-between relative">
          {levels.map((level, index) => (
            <div key={level.level} className="relative flex flex-col items-center">
              {index > 0 && (
                <div
                  className={`absolute right-1/2 top-4 h-0.5 w-full ${level.unlocked ? "bg-primary" : "bg-secondary"
                    }`}
                  style={{ zIndex: 0 }}
                />
              )}
              <motion.div
                whileHover={{ scale: 1.1 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 ${level.unlocked
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/50"
                    : "bg-secondary text-muted-foreground"
                  }`}
              >
                {level.unlocked ? <Star className="w-4 h-4 fill-current" /> : <Lock className="w-4 h-4" />}
              </motion.div>
              <span className="text-xs mt-2 text-muted-foreground">Lv.{level.level}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium mb-3">已解锁动作</h4>
        <div className="grid grid-cols-3 gap-2">
          {unlockedActions.map((action, index) => (
            <motion.div
              key={action.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 + 0.7 }}
              whileHover={{ scale: action.unlocked ? 1.05 : 1 }}
              className={`glass rounded-xl p-3 text-center relative overflow-hidden ${action.unlocked ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
                }`}
            >
              {action.unlocked ? (
                <Sparkles className="w-4 h-4 mx-auto mb-1 text-primary" />
              ) : (
                <Lock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
              )}
              <div className="text-xs font-medium">{action.name}</div>
              {!action.unlocked && <div className="text-[10px] text-muted-foreground mt-1">Lv.5解锁</div>}
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-6 p-4 glass rounded-2xl bg-gradient-to-br from-primary/10 to-success/10"
      >
        <p className="text-sm text-center text-muted-foreground mb-3">距离下一等级还需 32 经验值。</p>
        <Button className="w-full" size="sm">
          查看成长任务
        </Button>
      </motion.div>
    </motion.div>
  );
}