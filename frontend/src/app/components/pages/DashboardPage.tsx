import { motion } from "motion/react";
import { EmotionStatusCenter } from "../EmotionStatusCenter";
import { CompanionReport } from "../CompanionReport";
import { GrowthSystem } from "../GrowthSystem";

export function DashboardPage() {
  return (
    <div className="p-8 space-y-6 min-h-full">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="mb-2">状态总览</h2>
        {/* <p className="text-muted-foreground">今天也要元气满满。</p> */}
      </motion.div>

      <div className="grid grid-cols-1 gap-6">
        <EmotionStatusCenter />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <CompanionReport />
          <GrowthSystem />
        </div>
      </div>
    </div>
  );
}
