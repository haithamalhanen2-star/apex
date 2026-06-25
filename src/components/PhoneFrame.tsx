import React from "react";
import { useApp } from "../context/AppContext";
import { Shield, User, Globe, Smartphone, Minimize, Maximize, AlertCircle } from "lucide-react";
import { translations } from "../data/translations";

interface PhoneFrameProps {
  children: React.ReactNode;
  activeTab: string;
  footer?: React.ReactNode;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({ children, activeTab, footer }) => {
  const { language, setLanguage, currentUser, isAdminMode, setIsAdminMode } = useApp();
  const t = translations[language];
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-0 md:p-6 text-slate-100 font-sans antialiased overflow-x-hidden selection:bg-amber-500 selection:text-slate-950">
      {/* Main Bezel Frame */}
      <div
        className={`w-full transition-all duration-300 relative ${
          isFullscreen 
            ? "max-w-full h-screen md:h-[92vh]" 
            : "max-w-md h-[88vh] md:h-[840px]"
        } bg-slate-900 shadow-2xl flex flex-col md:rounded-[40px] md:border-8 md:border-slate-800 overflow-hidden`}
      >
        {/* Smartphone Camera Notch */}
        {!isFullscreen && (
          <div className="hidden md:flex absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-50 items-center justify-center">
            <div className="w-3 h-3 bg-slate-900 rounded-full"></div>
            <div className="w-10 h-1 bg-slate-750 rounded-full ml-4"></div>
          </div>
        )}

        {/* Top Status Bar */}
        <div className="bg-slate-950/80 px-5 pt-3 pb-2 flex justify-between items-center text-xs text-slate-400 font-mono z-20 border-b border-slate-800/40">
          <div>09:41</div>
          {/* Quick Stats or Admin Active State */}
          {isAdminMode ? (
            <div className="text-amber-400 font-bold flex items-center gap-1 animate-pulse">
              <Shield className="w-3 h-3" />
              <span>ADMIN MODE</span>
            </div>
          ) : currentUser ? (
            <div className="text-emerald-400 font-semibold flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>@{currentUser.username}</span>
            </div>
          ) : (
            <span>NOT LOGGED IN</span>
          )}

          {/* Quick Toolbar */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-850 hover:bg-slate-800 hover:text-white transition-colors"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] uppercase font-bold">{language === "ar" ? "EN" : "عربي"}</span>
            </button>
            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden md:block p-0.5 rounded bg-slate-850 hover:bg-slate-800 hover:text-white transition-colors"
              title="Toggle Size"
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5 text-slate-400" /> : <Maximize className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          </div>
        </div>

        {/* Scrollable Main Content Pane */}
        <div className="flex-1 overflow-y-auto bg-slate-950 flex flex-col pb-20 relative">
          {children}
        </div>

        {/* Fixed Footer Element */}
        {footer}
      </div>
    </div>
  );
};
