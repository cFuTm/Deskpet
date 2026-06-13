import { motion } from "motion/react";
import { Clock, MessageCircle, Moon, TrendingUp, Award } from "lucide-react";

const reportData = [
  {
    label: "陪伴时长",
    value: "2小时30分",
    icon: Clock,
    color: "#FF8E6E",
    trend: "+15%",
  },
  {
    label: "对话次数",
    value: "23次",
    icon: MessageCircle,
    color: "#76A072",
    trend: "+8%",
  },
  {
    label: "深夜陪伴",
    value: "3次",
    icon: Moon,
    color: "#9CA3AF",
    trend: "持平",
  },
  {
    label: "亲密度等级",
    value: "Lv.8",
    icon: Award,
    color: "#FFB088",
    trend: "↑",
  },
];

export function CompanionReport() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="glass-strong rounded-3xl p-8 shadow-xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="mb-1">今日陪伴报告</h3>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("zh-CN", {
              month: "long",
              day: "numeric",
              weekday: "short",
            })}
          </p>
        </div>
        <motion.div
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.6 }}
          className="cursor-pointer"
        >
          <TrendingUp className="w-5 h-5 text-primary" />
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {reportData.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 + 0.4 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="glass rounded-2xl p-4 relative overflow-hidden group cursor-pointer bg-card/50"
            >
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: `linear-gradient(135deg, ${item.color}10, transparent)`,
                }}
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.6 }}
                    className="text-xs px-2 py-1 rounded-full glass"
                    style={{ color: item.color }}
                  >
                    {item.trend}
                  </motion.span>
                </div>

                <div className="text-2lg font-medium mb-1">{item.value}</div>
                <div className="text-sm text-muted-foreground">
                  {item.label}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-6 p-4 glass rounded-2xl bg-card/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-sm font-medium mb-2">本周陪伴进度</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-success rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "68%" }}
                  transition={{ duration: 1, delay: 1 }}
                />
              </div>
              <span className="text-sm text-muted-foreground">68%</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          再陪伴 5 小时解锁新动作"睡眠"
        </p>
      </motion.div>
    </motion.div>
  );
}