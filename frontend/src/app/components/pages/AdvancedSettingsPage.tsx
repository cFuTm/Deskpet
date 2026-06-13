import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Lightbulb, MessageSquare, Mic, Settings2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Slider } from "../ui/slider";
import { Switch } from "../ui/switch";

export function AdvancedSettingsPage() {
  const [wakeWord, setWakeWord] = useState("小艾");
  const [sensitivity, setSensitivity] = useState([70]);
  const [autoTalk, setAutoTalk] = useState(true);
  const [idleTime, setIdleTime] = useState([10]);

  return (
    <div className="p-8 space-y-6 min-h-full">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="mb-2">更多设置</h2>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-strong rounded-3xl p-8 space-y-6 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Mic className="w-5 h-5 text-primary" />
              </div>
              <h3>语音唤醒</h3>
            </div>

            <div className="space-y-4">

              <div className="space-y-2">
                <Label htmlFor="microphone">麦克风设备</Label>
                <Select defaultValue="default">
                  <SelectTrigger id="microphone" className="glass">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">系统默认麦克风</SelectItem>
                    <SelectItem value="usb">USB 麦克风</SelectItem>
                    <SelectItem value="bluetooth">蓝牙耳机</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-3 glass rounded-2xl">
                <div className="space-y-0.5 flex-1">
                  <Label>启用语音唤醒</Label>
                  <p className="text-xs text-muted-foreground">开启后可通过语音激活TalkBuddy。</p>
                </div>
                <Switch defaultChecked />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="glass-strong rounded-3xl p-8 space-y-4 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <Settings2 className="w-5 h-5 text-foreground" />
              </div>
              <h3>其他设置</h3>
            </div>

            <div className="space-y-3">
              {[
                ["开机自启动", "系统启动时自动运行。", true],
                ["托盘最小化", "关闭窗口时最小化到托盘。", true],
                ["数据统计", "收集使用数据以改进体验。", false],
              ].map(([label, description, checked]) => (
                <motion.div
                  key={label as string}
                  whileHover={{ x: 2 }}
                  className="flex items-center justify-between p-3 glass rounded-2xl"
                >
                  <div className="space-y-0.5 flex-1">
                    <Label>{label}</Label>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  <Switch defaultChecked={Boolean(checked)} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-end gap-3"
      >
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button variant="outline" className="glass">
            重置为默认
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button>保存所有设置</Button>
        </motion.div>
      </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="glass-strong rounded-3xl p-8 space-y-6 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-success" />
              </div>
              <h3>主动互动</h3>
            </div>

            <div className="space-y-4">
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="flex items-center justify-between p-4 glass rounded-2xl bg-gradient-to-br from-success/10 to-transparent"
              >
                <div className="space-y-0.5 flex-1">
                  <Label>开启主动搭话</Label>
                  <p className="text-xs text-muted-foreground">TalkBuddy会在合适时机主动与你对话。</p>
                </div>
                <Switch checked={autoTalk} onCheckedChange={setAutoTalk} className="ml-4" />
              </motion.div>

              <AnimatePresence>
                {autoTalk && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="idle-time">无互动触发时间</Label>
                        <motion.span
                          key={idleTime[0]}
                          initial={{ scale: 1.2 }}
                          animate={{ scale: 1 }}
                          className="text-sm text-success font-medium"
                        >
                          {idleTime[0]} 分钟
                        </motion.span>
                      </div>
                      <Slider
                        id="idle-time"
                        value={idleTime}
                        onValueChange={setIdleTime}
                        min={5}
                        max={60}
                        step={5}
                        className="py-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>5分钟</span>
                        <span>60分钟</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        超过设定时间未互动，TalkBuddy会主动打招呼。
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="talk-frequency">主动频率</Label>
                      <Select defaultValue="moderate">
                        <SelectTrigger id="talk-frequency" className="glass">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">低 - 偶尔互动</SelectItem>
                          <SelectItem value="moderate">中 - 适度互动</SelectItem>
                          <SelectItem value="high">高 - 频繁互动</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="talk-style">话题类型</Label>
                      <Select defaultValue="mixed">
                        <SelectTrigger id="talk-style" className="glass">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="care">关怀问候</SelectItem>
                          <SelectItem value="funny">趣味话题</SelectItem>
                          <SelectItem value="news">热点资讯</SelectItem>
                          <SelectItem value="mixed">混合模式</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {autoTalk && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pt-4 border-t border-border/50 space-y-3"
                >
                  <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-3 glass rounded-2xl">
                    <div className="space-y-0.5 flex-1">
                      <Label>工作时段免打扰</Label>
                      <p className="text-xs text-muted-foreground">工作时间不主动搭话。</p>
                    </div>
                    <Switch />
                  </motion.div>

                  <motion.div whileHover={{ x: 2 }} className="flex items-center justify-between p-3 glass rounded-2xl">
                    <div className="space-y-0.5 flex-1">
                      <Label>智能话题推荐</Label>
                      <p className="text-xs text-muted-foreground">根据你的兴趣推荐话题。</p>
                    </div>
                    <Switch defaultChecked />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
