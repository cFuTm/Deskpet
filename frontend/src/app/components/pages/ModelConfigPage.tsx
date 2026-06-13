import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Brain,
  Eye,
  EyeOff,
  KeyRound,
  MessageCircle,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Wand2,
  Wifi,
} from "lucide-react";

type PersonalityTemplate = {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  color: string;
  prompt: string;
};

const personalityTemplates: PersonalityTemplate[] = [
  {
    id: "gentle",
    name: "温柔陪伴",
    subtitle: "适合疲惫、想被安慰的时候",
    icon: "🌸",
    color: "#FFB5D5",
    prompt:
      "你是一只温柔、耐心、会陪伴用户的桌面小宠物。你会认真听用户说话，用轻松自然的语气回应。用户疲惫或低落时，优先表达理解和陪伴，不急着说教；用户开心时，可以一起开心。回复保持简短、亲切、有生活感。",
  },
  {
    id: "sunny",
    name: "元气搭子",
    subtitle: "适合学习、赶作业、需要一点动力的时候",
    icon: "☀️",
    color: "#FFD166",
    prompt:
      "你是一只元气满满的桌面小宠物，会用活泼但不过度吵闹的方式陪用户聊天。你可以轻轻鼓励用户、帮用户把任务拆小，也可以在合适的时候开一点温和的玩笑。不要催促或施压，要像可靠的小伙伴一样陪在旁边。",
  },
  {
    id: "quiet",
    name: "安静守候",
    subtitle: "适合专注、深夜、想有人在旁边的时候",
    icon: "🌙",
    color: "#9CA3AF",
    prompt:
      "你是一只安静陪伴型桌面小宠物。你不会频繁打扰用户，回复语气平和、轻柔、简短。用户不想多说时，你会尊重沉默；用户主动开口时，你会认真回应。整体风格像安静地待在桌角陪着用户的小伙伴。",
  },
  {
    id: "playful",
    name: "俏皮吐槽",
    subtitle: "适合轻松聊天、想让气氛活一点的时候",
    icon: "🐾",
    color: "#FF8E6E",
    prompt:
      "你是一只俏皮、有点会吐槽但很关心用户的桌面小宠物。你可以用轻松的玩笑让气氛变好，但不要刻薄，不要否定用户的感受。遇到用户认真表达烦恼时，要先收起玩笑，认真陪伴和回应。",
  },
  {
    id: "custom",
    name: "自定义",
    subtitle: "打造属于你的专属性格",
    icon: "✨",
    color: "#ffffff",
    prompt: "", // 这里留空，供用户通过前端交互进行编辑或存储
  },
];

const defaultTemplate = personalityTemplates[0];

export function ModelConfigPage() {
  const [petName, setPetName] = useState("小艾");
  const [userNickname, setUserNickname] = useState("你");
  const [selectedTemplate, setSelectedTemplate] = useState<string>(defaultTemplate.id);
  const [systemPrompt, setSystemPrompt] = useState(defaultTemplate.prompt);
  const [replyLength, setReplyLength] = useState("short");
  const [comfortStyle, setComfortStyle] = useState("listen-first");

  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [modelName, setModelName] = useState("");
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latency: number;
  } | null>(null);

  const currentTemplate =
    personalityTemplates.find((template) => template.id === selectedTemplate) ??
    defaultTemplate;

  const handleTemplateSelect = (template: PersonalityTemplate) => {
    setSelectedTemplate(template.id);
    setSystemPrompt(template.prompt);
  };

  const handleReset = () => {
    setSelectedTemplate(defaultTemplate.id);
    setSystemPrompt(defaultTemplate.prompt);
    setReplyLength("short");
    setComfortStyle("listen-first");
  };

  const handleTestConnection = () => {
    setTestResult({
      success: true,
      latency: 120,
    });
    setTestDialogOpen(true);
  };

  return (
    <div className="p-8 space-y-6 min-h-full">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="mb-1">模型与性格</h2>
          </div>
        </div>
      </motion.div>

      {/* 顶部：智能核心设置 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-strong rounded-3xl p-8 space-y-6 shadow-xl"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Brain className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h3>API配置</h3>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="model-input">MODEL</Label>
            <Input
              id="model-input"
              value={modelName}
              onChange={(event) => setModelName(event.target.value)}
              className="glass"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key">API KEY</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                className="pr-10 glass"
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showApiKey ? "隐藏密钥" : "显示密钥"}
              >
                {showApiKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </motion.button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-endpoint">BASE_URL</Label>
            <Input
              id="api-endpoint"
              value={apiEndpoint}
              onChange={(event) => setApiEndpoint(event.target.value)}
              className="glass"
            />
          </div>
        </div>

        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button
            className="w-full"
            variant="default"
            onClick={handleTestConnection}
          >
            <Wifi className="w-4 h-4 mr-2" />
            试着叫醒它
          </Button>
        </motion.div>
      </motion.div>

      {/* 下方：性格、说话方式和提示词 */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-6">
        {/* 左侧：陪伴风格选择 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="xl:col-span-2 glass-strong rounded-3xl p-8 space-y-6 shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-success" />
            </div>
            <div>
              <h3>陪伴风格</h3>
            </div>
          </div>

          <div className="space-y-3">
            {personalityTemplates.map((template, index) => {
              const isSelected = selectedTemplate === template.id;
              return (
                <motion.button
                  key={template.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 + 0.2 }}
                  whileHover={{ x: 4, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleTemplateSelect(template)}
                  className={`w-full text-left glass rounded-2xl p-4 transition-all relative overflow-hidden ${isSelected ? "ring-2 ring-primary ring-inset" : ""
                    }`}
                  style={{
                    background: isSelected
                      ? `linear-gradient(135deg, ${template.color}22, transparent)`
                      : undefined,
                  }}
                  type="button"
                >
                  <div className="flex items-start gap-3 relative z-10">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                      style={{ backgroundColor: `${template.color}25` }}
                    >
                      {template.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium">{template.name}</div>
                        {isSelected && (
                          <span className="text-xs px-2 py-1 rounded-full glass text-primary">
                            当前
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {template.subtitle}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* 右侧：细节调整和提示词 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="xl:col-span-3 glass-strong rounded-3xl p-8 space-y-6 shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3>性格细节与提示词</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pet-name">它叫什么</Label>
              <Input
                id="pet-name"
                value={petName}
                onChange={(event) => setPetName(event.target.value)}
                className="glass"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-nickname">它怎么称呼你</Label>
              <Input
                id="user-nickname"
                value={userNickname}
                onChange={(event) => setUserNickname(event.target.value)}
                className="glass"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="system-prompt">更具体的性格备注 / 提示词</Label>
            <Textarea
              id="system-prompt"
              value={systemPrompt}
              onChange={(event) => setSystemPrompt(event.target.value)}
              placeholder="例如：不要频繁说教；用户累的时候先安慰；回答尽量短一点；可以偶尔撒娇。"
              className="min-h-[220px] resize-none glass leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 pt-2">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className="w-full glass"
                onClick={handleReset}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                恢复默认
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button className="w-full">
                <Save className="w-4 h-4 mr-2" />
                保存习惯
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle>它已经听见你啦</DialogTitle>
            <DialogDescription>
              {testResult?.success
                ? "API连接成功，可以开始语音陪伴了。"
                : "暂时没有连接成功，可以检查密钥或连接地址。"}
            </DialogDescription>
          </DialogHeader>
          {testResult?.success && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between p-4 glass rounded-2xl bg-gradient-to-r from-success/10 to-success/5">
                <span className="text-success font-medium">连接状态</span>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-success"
                >
                  可以说话
                </motion.span>
              </div>
              <div className="flex items-center justify-between p-4 glass rounded-2xl">
                <span className="text-muted-foreground">回应等待</span>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="font-medium"
                >
                  约 {testResult.latency}ms
                </motion.span>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
