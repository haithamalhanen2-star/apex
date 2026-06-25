import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { translations } from "../../data/translations";
import { MOCK_NOTIFICATIONS } from "../../data/mockData";
import { ArrowUpRight, ArrowDownLeft, Volume2, ShieldCheck, Heart, Star, ShoppingBag, ArrowRightLeft, MessageCircle, ExternalLink, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HomeViewProps {
  onNavigate: (tab: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const { language, currentUser, settings, getTeamReport, vipTiers } = useApp();
  const t = translations[language];
  const isRtl = language === "ar";

  // Dynamic live withdrawal notifications
  const [payouts, setPayouts] = useState(MOCK_NOTIFICATIONS);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto scroll payouts
  useEffect(() => {
    const interval = setInterval(() => {
      setPayouts(prev => {
        const copy = [...prev];
        const first = copy.shift();
        if (first) copy.push(first);
        return copy;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Home banners sliding
  const banners = [
    {
      titleAr: "مكافأة ترحيبية مجانية بقيمة 15$",
      titleEn: "Free $15 Registration Reward",
      descAr: "سجل حسابك الآن واحصل على رصيد مجاني لبدء مهام VIP0 فوراً!",
      descEn: "Register now and get instant free balance to start VIP0 tasks!",
      gradient: "from-amber-500 to-yellow-600"
    },
    {
      titleAr: "عمولات الفريق تصل إلى 17%",
      titleEn: "Team Commissions up to 17%",
      descAr: "ادعُ أصدقاءك واكسب عمولات تراكمية للمستويات الأول والثاني والثالث.",
      descEn: "Invite friends and earn recurring multi-level team commissions.",
      gradient: "from-blue-600 to-indigo-700"
    },
    {
      titleAr: "ترقية VIP1 تمنحك 15 مهمة يومية",
      titleEn: "VIP1 Grants 15 Daily Tasks",
      descAr: "ضاعف أرباحك اليومية مع عمولة 1.2% على كل منتج تقييم.",
      descEn: "Multiply your daily profits with 1.2% commission on each product.",
      gradient: "from-purple-600 to-pink-700"
    }
  ];

  useEffect(() => {
    const bannerTimer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(bannerTimer);
  }, []);

  const handleVipRoomClick = (level: number) => {
    if (!currentUser) {
      onNavigate("mine"); // Navigate to Login if not logged in
      return;
    }
    if (currentUser.vipLevel >= level) {
      onNavigate("task");
    } else {
      onNavigate("vip");
    }
  };

  return (
    <div className={`p-4 flex flex-col gap-4 ${isRtl ? "text-right" : "text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
      
      {/* Header section */}
      <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
        <div>
          <h1 className="text-xl font-black bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent flex items-center gap-1">
            <span className="text-yellow-400">★</span> {settings.appName}
          </h1>
          <p className="text-[10px] text-slate-400">{t.welcomeBack} {currentUser ? currentUser.username : "Guest"}</p>
        </div>
        <button 
          onClick={() => window.open(settings.supportTelegram, "_blank")}
          className="flex items-center gap-1 text-xs bg-slate-850 hover:bg-slate-800 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/20 shadow-lg transition-all"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{t.customerService}</span>
        </button>
      </div>

      {/* Balance Card */}
      {currentUser && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-5 border border-slate-800 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none"></div>

          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">{t.balance}</p>
              <h2 className="text-3xl font-black text-amber-400 font-mono flex items-baseline gap-1">
                {t.usd}{(currentUser.balance ?? 0).toFixed(2)}
              </h2>
            </div>
            <div className="bg-slate-850 border border-slate-700/60 rounded-xl px-2.5 py-1.5 text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">{t.currentTier}</span>
              <span className="text-xs font-bold text-amber-500 block">VIP {currentUser.vipLevel}</span>
            </div>
          </div>

          {/* Todays Stats Row */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800/60">
            <div>
              <span className="text-[10px] text-slate-400 block">{t.todayEarnings}</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">{t.usd}{(currentUser.todayEarnings ?? 0).toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">{t.totalEarnings}</span>
              <span className="text-sm font-bold text-blue-400 font-mono">{t.usd}{(currentUser.totalEarnings ?? 0).toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">{t.completedTasks}</span>
              <span className="text-sm font-bold text-amber-400 font-mono">{currentUser.completedTasksToday}</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={() => onNavigate("mine")}
              className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-bold py-2 rounded-xl text-xs transition-transform active:scale-95 shadow-md"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>{t.deposit}</span>
            </button>
            <button
              onClick={() => onNavigate("mine")}
              className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-amber-400 border border-amber-500/20 font-bold py-2 rounded-xl text-xs transition-transform active:scale-95 shadow-md"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{t.withdraw}</span>
            </button>
          </div>
        </div>
      )}

      {/* Sliding Banner Advertisement */}
      <div className="h-32 rounded-2xl relative overflow-hidden border border-slate-800 shadow-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: isRtl ? -50 : 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRtl ? 50 : -50 }}
            transition={{ duration: 0.4 }}
            className={`absolute inset-0 bg-gradient-to-r ${banners[currentSlide].gradient} p-4 flex flex-col justify-center`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
            <h3 className="text-sm font-black text-white mb-1 drop-shadow-sm">
              {isRtl ? banners[currentSlide].titleAr : banners[currentSlide].titleEn}
            </h3>
            <p className="text-xs text-white/90 leading-snug max-w-[90%] drop-shadow-xs">
              {isRtl ? banners[currentSlide].descAr : banners[currentSlide].descEn}
            </p>
          </motion.div>
        </AnimatePresence>
        
        {/* Banner Pagination dots */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${currentSlide === idx ? "w-4 bg-white" : "bg-white/45"}`}
            ></button>
          ))}
        </div>
      </div>

      {/* Announcement Marquee */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-xl px-3 py-1.5 flex items-center gap-2 overflow-hidden shadow-xs">
        <Volume2 className="w-4 h-4 text-amber-400 flex-shrink-0 animate-bounce" />
        <div className="flex-1 overflow-hidden relative h-4">
          <div className="absolute whitespace-nowrap text-[11px] text-slate-300 animate-marquee dir-rtl">
            {t.announcement}
          </div>
        </div>
      </div>

      {/* CORE WORKROOMS SECTION */}
      <div>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-amber-400" />
          <span>{language === "ar" ? "قاعات العمل والتقييمات" : "Earning Workrooms"}</span>
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {vipTiers.map((tier) => {
            const isUnlocked = currentUser ? currentUser.vipLevel >= tier.level : tier.level === 0;
            return (
              <button
                key={tier.level}
                onClick={() => handleVipRoomClick(tier.level)}
                className={`bg-gradient-to-br ${tier.bgGradient} rounded-xl p-3 border ${
                  isUnlocked ? "border-amber-500/30 shadow-lg shadow-amber-500/5 animate-pulse-slow" : "border-slate-800 opacity-60"
                } relative overflow-hidden transition-all text-right active:scale-95 flex flex-col justify-between h-28`}
              >
                {/* Background brand watermarks */}
                <span className="absolute top-2 right-2 text-slate-800 font-black text-4xl select-none opacity-20">
                  {tier.name}
                </span>

                <div className="flex justify-between items-start w-full">
                  <div className={`p-1.5 rounded-lg bg-slate-900/80 border ${isUnlocked ? "border-amber-500/30 text-amber-400" : "border-slate-800 text-slate-500"}`}>
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  {!isUnlocked && (
                    <span className="text-[9px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded-full text-slate-400 font-bold uppercase">
                      LOCKED
                    </span>
                  )}
                  {isUnlocked && (
                    <span className="text-[9px] bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-full text-amber-400 font-bold uppercase">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="mt-auto z-10">
                  <h4 className="text-xs font-black text-white">{tier.name} Room</h4>
                  <p className="text-[10px] text-slate-400">
                    {t.dailyTasksCount.replace("{count}", String(tier.dailyTasks))}
                  </p>
                  <p className="text-[10px] text-amber-400 font-bold">
                    {tier.singleTaskReward !== undefined 
                      ? (language === "ar" ? `الربح: ${tier.singleTaskReward.toFixed(2)} USDT` : `Reward: ${tier.singleTaskReward.toFixed(2)} USDT`)
                      : t.commissionRateLabel.replace("{rate}", String(((tier.commissionRate || 0) * 100).toFixed(1)))}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* QUICK LINKS GRID */}
      <div>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
          <span>{t.quickActions}</span>
        </h3>
        <div className="grid grid-cols-4 gap-2 text-center">
          <button onClick={() => onNavigate("mine")} className="flex flex-col items-center gap-1.5 bg-slate-900/60 hover:bg-slate-900 p-2.5 rounded-xl border border-slate-800/40 transition-colors">
            <span className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-sm font-black">1</span>
            <span className="text-[10px] font-bold">{t.deposit}</span>
          </button>
          <button onClick={() => onNavigate("vip")} className="flex flex-col items-center gap-1.5 bg-slate-900/60 hover:bg-slate-900 p-2.5 rounded-xl border border-slate-800/40 transition-colors">
            <span className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm font-black">2</span>
            <span className="text-[10px] font-bold">{t.vip}</span>
          </button>
          <button onClick={() => onNavigate("team")} className="flex flex-col items-center gap-1.5 bg-slate-900/60 hover:bg-slate-900 p-2.5 rounded-xl border border-slate-800/40 transition-colors">
            <span className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center text-sm font-black">3</span>
            <span className="text-[10px] font-bold">{t.team}</span>
          </button>
          <button onClick={() => window.open(settings.supportTelegram, "_blank")} className="flex flex-col items-center gap-1.5 bg-slate-900/60 hover:bg-slate-900 p-2.5 rounded-xl border border-slate-800/40 transition-colors">
            <span className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm font-black">4</span>
            <span className="text-[10px] font-bold">الدعم</span>
          </button>
        </div>
      </div>

      {/* LIVE RECENT PAYOUTS TICKER */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md">
        <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>{t.recentPayouts}</span>
        </h4>
        <div className="h-16 overflow-hidden relative">
          <div className="flex flex-col gap-1.5">
            {payouts.slice(0, 2).map((item, index) => (
              <motion.div
                key={item.phone + index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex justify-between items-center bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-850"
              >
                <span className="text-[11px] text-slate-300 font-mono font-bold">{item.phone}</span>
                <span className="text-[11px] text-slate-400">
                  {t.withdrew} <strong className="text-emerald-400 font-mono">${item.amount.toFixed(2)}</strong>
                </span>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-bold uppercase">
                  SUCCESS
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* PARTNER LOGOS */}
      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-900/80">
        <h3 className="text-[11px] font-black text-slate-400 text-center uppercase tracking-wider mb-3">
          {t.partnerBrands}
        </h3>
        <div className="grid grid-cols-4 gap-4 items-center justify-items-center opacity-65">
          <span className="text-xs font-black text-slate-300">Amazon</span>
          <span className="text-xs font-black text-slate-300">eBay</span>
          <span className="text-xs font-black text-slate-300">Shopify</span>
          <span className="text-xs font-black text-slate-300">Sephora</span>
        </div>
      </div>

      {/* SUPPORT WIDGET */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 rounded-xl p-4 border border-slate-800 flex justify-between items-center shadow-lg">
        <div className="max-w-[70%]">
          <h4 className="text-xs font-bold text-white mb-0.5">{t.customerService}</h4>
          <p className="text-[9px] text-slate-400 leading-normal">{t.customerServiceDesc}</p>
        </div>
        <div className="flex gap-2">
          <a
            href={settings.supportTelegram}
            target="_blank"
            rel="noreferrer"
            className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors shadow-md"
            title="Telegram Help Desk"
          >
            <MessageCircle className="w-5 h-5" />
          </a>
          <a
            href={settings.supportWhatsApp}
            target="_blank"
            rel="noreferrer"
            className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-md"
            title="WhatsApp Support"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

    </div>
  );
};
