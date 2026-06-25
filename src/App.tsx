/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { PhoneFrame } from "./components/PhoneFrame";
import { HomeView } from "./components/views/HomeView";
import { TaskView } from "./components/views/TaskView";
import { VipView } from "./components/views/VipView";
import { TeamView } from "./components/views/TeamView";
import { MineView } from "./components/views/MineView";
import { AdminView } from "./components/views/AdminView";
import { LoginPrompt } from "./components/LoginPrompt";
import { translations } from "./data/translations";
import { Home, PlayCircle, Award, Users, User, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";

function MainAppContent() {
  const [activeTab, setActiveTab] = useState<string>("home");
  const { language, isAdminMode, setIsAdminMode, currentUser } = useApp();
  const t = translations[language];
  const isRtl = language === "ar";

  // Navigation tab definitions
  const tabs = [
    { id: "home", label: t.home, icon: Home },
    { id: "task", label: t.task, icon: PlayCircle },
    { id: "vip", label: t.vip, icon: Award },
    { id: "team", label: t.team, icon: Users },
    { id: "mine", label: t.mine, icon: User },
  ];

  return (
    <PhoneFrame
      activeTab={activeTab}
      footer={
        /* Persistent Bottom Tab Bar */
        <div className="absolute bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 p-2 pb-4 flex justify-around items-center z-40">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id && !isAdminMode;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setIsAdminMode(false); // Automatically leave admin view when user clicks standard tabs
                  setActiveTab(tab.id);
                }}
                className="flex flex-col items-center gap-1 py-1 relative flex-1 group transition-all"
              >
                {/* Glowing active indicator background ring */}
                {isActive && (
                  <motion.span
                    layoutId="activeIndicator"
                    className="absolute inset-0 bg-amber-500/5 rounded-2xl -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}

                <Icon
                  className={`w-5 h-5 transition-all duration-300 ${
                    isActive 
                      ? "text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" 
                      : "text-slate-500 group-hover:text-slate-300"
                  }`}
                />
                <span
                  className={`text-[9px] font-bold transition-colors ${
                    isActive ? "text-amber-400 font-extrabold" : "text-slate-500 group-hover:text-slate-300"
                  }`}
                >
                  {tab.label}
                </span>

                {/* Little active dot indicator */}
                {isActive && (
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full absolute -top-1 shadow-[0_0_6px_#f59e0b]"></span>
                )}
              </button>
            );
          })}
        </div>
      }
    >
      {/* Dynamic View Dispatcher */}
      <div className="flex-1">
        {isAdminMode ? (
          <AdminView />
        ) : (
          <>
            {activeTab === "home" && <HomeView onNavigate={setActiveTab} />}
            {activeTab === "task" && (currentUser ? <TaskView /> : <LoginPrompt onLoginNavigate={() => setActiveTab("mine")} />)}
            {activeTab === "vip" && (currentUser ? <VipView /> : <LoginPrompt onLoginNavigate={() => setActiveTab("mine")} />)}
            {activeTab === "team" && (currentUser ? <TeamView /> : <LoginPrompt onLoginNavigate={() => setActiveTab("mine")} />)}
            {activeTab === "mine" && <MineView />}
          </>
        )}
      </div>
    </PhoneFrame>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
