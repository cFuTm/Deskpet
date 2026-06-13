import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Brain, LayoutDashboard, Moon, Palette, Settings, Sun } from "lucide-react";
import { DashboardPage } from "./components/pages/DashboardPage";
import { AppearancePage } from "./components/pages/AppearancePage";
import { ModelConfigPage } from "./components/pages/ModelConfigPage";
import { AdvancedSettingsPage } from "./components/pages/AdvancedSettingsPage";
import bgImage from "../assets/background.png";
import appIcon from "../assets/app.png";

type Page = "dashboard" | "appearance" | "model" | "settings";

const navigationItems = [
  { id: "dashboard" as Page, name: "状态总览", icon: LayoutDashboard },
  { id: "appearance" as Page, name: "形象管理", icon: Palette },
  { id: "model" as Page, name: "模型与性格", icon: Brain },
  { id: "settings" as Page, name: "更多设置", icon: Settings },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    setIsDark(hour >= 22 || hour < 6);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage />;
      case "appearance":
        return <AppearancePage />;
      case "model":
        return <ModelConfigPage />;
      case "settings":
        return <AdvancedSettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="size-full flex items-center justify-center p-8 bg-transparent relative overflow-hidden">
      <div
        className="absolute w-[1000px] h-[650px] rounded-3xl overflow-hidden pointer-events-none"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: 0.5,
        }}
      />
      <motion.div
        className="absolute w-[1000px] h-[650px] rounded-3xl overflow-hidden pointer-events-none mix-blend-multiply dark:mix-blend-screen"
        animate={{
          backgroundImage: [
            "radial-gradient(circle at 20% 30%, rgba(255, 142, 110, 0.15) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 70%, rgba(118, 160, 114, 0.15) 0%, transparent 50%)",
            "radial-gradient(circle at 50% 50%, rgba(255, 176, 136, 0.16) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 30%, rgba(255, 142, 110, 0.15) 0%, transparent 50%)",
          ],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-[1000px] h-[650px] flex overflow-hidden rounded-3xl shadow-2xl relative z-10"
      >
        <aside className="w-64 glass border-r border-sidebar-border/50 flex flex-col backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 border-b border-sidebar-border/50"
          >
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 rounded-2xl from-primary to-success flex items-center justify-center overflow-hidden"
              >
                <img src={appIcon} alt="TalkBuddy" className="w-8 h-8 rounded-xl object-cover" />
              </motion.div>
              <div>
                <h1 className="text-lg font-medium text-sidebar-foreground">TalkBuddy</h1>
              </div>
            </div>
          </motion.div>

          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 + 0.2 }}
                  whileHover={{ x: 4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all relative overflow-hidden ${isActive ? "text-sidebar-primary-foreground shadow-lg" : "text-sidebar-foreground"
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-primary to-success"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon className={`w-5 h-5 relative z-10 ${isActive ? "" : "opacity-70"}`} />
                  <span className="font-medium relative z-10">{item.name}</span>
                </motion.button>
              );
            })}
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-4 border-t border-sidebar-border/50 space-y-3"
          >

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="px-4 py-3 glass rounded-2xl bg-gradient-to-br from-success/10 to-transparent"
            >
              <div className="flex items-center gap-2 mb-1">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 bg-success rounded-full"
                />
                <span className="text-sm font-medium text-sidebar-accent-foreground">当前TalkBuddy状态</span>
              </div>
              <p className="text-xs text-muted-foreground">在线 · 空闲中</p>
            </motion.div>
          </motion.div>
        </aside>

        <main className="flex-1 overflow-auto bg-transparent scrollbar-transparent">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </motion.div>
    </div>
  );
}
