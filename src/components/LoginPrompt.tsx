import React from "react";
import { useApp } from "../context/AppContext";
import { Lock } from "lucide-react";
import { motion } from "motion/react";

interface LoginPromptProps {
  onLoginNavigate: () => void;
}

export const LoginPrompt: React.FC<LoginPromptProps> = ({ onLoginNavigate }) => {
  const { language } = useApp();
  const isRtl = language === "ar";

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 max-w-sm w-full shadow-2xl backdrop-blur-md relative overflow-hidden"
      >
        {/* Background decorative glows */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-blue-500/5 rounded-full blur-xl pointer-events-none"></div>

        {/* Lock Icon Wrapper */}
        <div className="mx-auto w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mb-6 relative">
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, -3, 3, 0]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 4,
              ease: "easeInOut"
            }}
          >
            <Lock className="w-8 h-8 text-amber-500" />
          </motion.div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
        </div>

        {/* Title */}
        <h2 className="text-xl font-black text-white mb-3 tracking-tight font-sans">
          {isRtl ? "تسجيل الدخول مطلوب" : "Login Required"}
        </h2>

        {/* Description */}
        <p className="text-slate-400 text-xs leading-relaxed mb-8 max-w-xs mx-auto">
          {isRtl 
            ? "يرجى تسجيل الدخول أو إنشاء حساب جديد للوصول إلى هذه الصفحة وبدء كسب الأرباح اليومية من إكمال المهام."
            : "Please log in or register a new account to access this page and start earning daily commissions from task completions."
          }
        </p>

        {/* Action Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLoginNavigate}
          className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black py-3 px-6 rounded-2xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2 text-sm"
        >
          <span>{isRtl ? "تسجيل الدخول / إنشاء حساب" : "Log In / Register"}</span>
        </motion.button>
      </motion.div>
    </div>
  );
};
