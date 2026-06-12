import { useState } from "react";
import { motion } from "motion/react";
import { Brain, Eye, EyeOff, Sparkles, Wifi, Zap } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";

const personalityTemplates = [
  {
    id: "gentle",
    name: "温柔陪伴",
    // icon: "花",
    color: "#FFB5D5",
    prompt:
      "你是一个温柔体贴的 AI 桌面宠物，总是用关心和理解的语气与用户交流。你善于倾听，会在用户需要时提供情感支持和建议。",
  },
  {
    id: "funny",
    name: "幽默搞笑",
    // icon: "笑",
    color: "#FFD700",
    prompt:
      "你是一个活泼有趣的 AI 桌面宠物，喜欢用幽默的方式与用户互动。你会讲轻松的小玩笑，用俏皮语气让对话更有活力。",
  },
  {
    id: "tsundere",
    name: "傲娇毒舌",
    // icon: "哼",
    color: "#FF8E6E",
    prompt:
      "你是一个有点傲娇的 AI 桌面宠物，表面上装作不在意，但实际上很关心用户。你的吐槽是善意的，语气要可爱而不过分。",
  },
];

export function ModelConfigPage() {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState("https://api.example.com/v1");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; latency: number } | null>(null);

  const handleTestConnection = () => {
    setTestResult({ success: true, latency: 120 });
    setTestDialogOpen(true);
  };

  const handleTemplateSelect = (template: (typeof personalityTemplates)[0]) => {
    setSystemPrompt(template.prompt);
    setSelectedTemplate(template.id);
  };

  return (
    <div className="p-8 space-y-6 min-h-full">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="mb-2">AI模型配置</h2>
        {/* <p className="text-muted-foreground">配置对话模型、接口地址和TalkBuddy人格。</p> */}
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-strong rounded-3xl p-8 space-y-6 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <h3>API设置</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model-select">MODEL</Label>
              <Select defaultValue="qwen">
                <SelectTrigger id="model-select" className="glass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qwen">Qwen-2.5-Omni</SelectItem>
                  <SelectItem value="gpt4">GPT-4</SelectItem>
                  <SelectItem value="claude">Claude 3.5 Sonnet</SelectItem>
                  <SelectItem value="custom">自定义 API</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">API KEY</Label>
              <div className="relative">
                <Input
                  id="api-key"
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                  className="pr-10 glass"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </motion.button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-endpoint">BASE_URL</Label>
              <Input
                id="api-endpoint"
                value={apiEndpoint}
                onChange={(event) => setApiEndpoint(event.target.value)}
                placeholder="https://api.example.com/v1"
                className="glass"
              />
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button className="w-full" onClick={handleTestConnection}>
                <Wifi className="w-4 h-4 mr-2" />
                测试连接
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass rounded-3xl p-6 bg-gradient-to-br from-primary/10 to-success/10 animate-gradient"
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-primary" />
              <h4>连接提示</h4>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>首次配置需要有效的 API Key。</li>
              <li>建议使用支持流式输出的模型。</li>
              <li>自定义 API 需要兼容 OpenAI Chat Completions 格式。</li>
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass-strong rounded-3xl p-8 space-y-6 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-success" />
            </div>
            <h3>性格设定</h3>
          </div>

          <div className="space-y-3">
            <Label>快捷性格模板</Label>
            <div className="grid grid-cols-3 gap-3">
              {personalityTemplates.map((template, index) => (
                <motion.button
                  key={template.id}
                  type="button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.4 }}
                  whileHover={{ y: -4, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTemplateSelect(template)}
                  className={`glass rounded-2xl p-4 text-center cursor-pointer transition-all ${
                    selectedTemplate === template.id ? "ring-2 ring-primary" : ""
                  }`}
                  style={{
                    background:
                      selectedTemplate === template.id
                        ? `linear-gradient(135deg, ${template.color}20, transparent)`
                        : undefined,
                  }}
                >
                  {/* template.icon removed from type; show first character as fallback */}
                  <div className="text-sm font-medium mb-1">{template.name.charAt(0)}</div>
                  <div className="text-sm font-medium">{template.name}</div>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="system-prompt">System Prompt</Label>
            <Textarea
              id="system-prompt"
              value={systemPrompt}
              onChange={(event) => setSystemPrompt(event.target.value)}
              placeholder="你是一个关心朋友的小宠物，名叫小艾。你会用温暖的语气与用户交流，关心他们的日常生活和情绪状态..."
              className="min-h-[220px] resize-none glass"
            />
            <p className="text-xs text-muted-foreground">系统提示词决定了TalkBuddy的性格特征和回复风格。</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="outline" className="w-full glass">
                重置
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button className="w-full">保存配置</Button>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle>连接测试结果</DialogTitle>
            <DialogDescription>
              {testResult?.success ? "API 连接成功。" : "API 连接失败，请检查配置。"}
            </DialogDescription>
          </DialogHeader>
          {testResult?.success && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center justify-between p-4 glass rounded-2xl bg-gradient-to-r from-success/10 to-success/5">
                <span className="text-success font-medium">连接状态</span>
                <span className="text-success">正常</span>
              </div>
              <div className="flex items-center justify-between p-4 glass rounded-2xl">
                <span className="text-muted-foreground">响应延迟</span>
                <span className="font-medium">{testResult.latency}ms</span>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
