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
<<<<<<< HEAD
        <p className="text-muted-foreground">今天也要元气满满。</p>
=======
        <p className="text-muted-foreground">今天也要元气满满哦~</p>
>>>>>>> be28e4a7ac11de98be10fbbbab996f6970242706
      </motion.div>

      <div className="grid grid-cols-1 gap-6">
        <EmotionStatusCenter />

<<<<<<< HEAD
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
=======
        <div className="grid grid-cols-2 gap-6">
>>>>>>> be28e4a7ac11de98be10fbbbab996f6970242706
          <CompanionReport />
          <GrowthSystem />
        </div>
      </div>
    </div>
  );
}
