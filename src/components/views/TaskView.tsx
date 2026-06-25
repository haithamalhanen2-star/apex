import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { translations } from "../../data/translations";
import { Product } from "../../types";
import { Star, Zap, ShoppingBag, CheckCircle, RefreshCw, AlertTriangle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const TaskCountdown: React.FC<{ lastResetTime?: string; createdAt: string; language: string }> = ({ lastResetTime, createdAt, language }) => {
  const [timeLeftStr, setTimeLeftStr] = useState("");

  useEffect(() => {
    const updateTimer = () => {
      const baseTimeStr = lastResetTime || createdAt;
      const baseTime = new Date(baseTimeStr).getTime();
      const nextReset = baseTime + 24 * 60 * 60 * 1000;
      const remaining = nextReset - Date.now();

      if (remaining <= 0) {
        setTimeLeftStr("00:00:00");
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      const pad = (num: number) => num.toString().padStart(2, "0");
      setTimeLeftStr(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastResetTime, createdAt]);

  return (
    <div className="bg-amber-500/10 border border-amber-500/25 px-4 py-2.5 rounded-2xl flex flex-col items-center gap-1 mt-1">
      <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">
        {language === "ar" ? "إعادة تعيين المهام القادمة خلال:" : "Tasks reset in:"}
      </span>
      <span className="text-xl font-black text-amber-400 font-mono tracking-widest">{timeLeftStr}</span>
    </div>
  );
};

export const TaskView: React.FC = () => {
  const { language, currentUser, rateProduct, vipTiers, products } = useApp();
  const t = translations[language];
  const isRtl = language === "ar";

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastCommission, setLastCommission] = useState(0);

  if (!currentUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-4 animate-bounce" />
        <h3 className="text-lg font-bold text-white mb-2">
          {language === "ar" ? "يرجى تسجيل الدخول أولاً" : "Please log in first"}
        </h3>
        <p className="text-xs text-slate-400 max-w-xs">
          {language === "ar" 
            ? "يجب تسجيل الدخول بحسابك لبدء تنفيذ تقييمات المنتجات وكسب العمولات اليومية." 
            : "You must be logged in to execute product ratings and receive daily commissions."}
        </p>
      </div>
    );
  }

  const currentVip = vipTiers.find(v => v.level === currentUser.vipLevel) || vipTiers[0];
  const isLimitReached = currentUser.completedTasksToday >= currentVip.dailyTasks;

  // Triggers the automated matching sequence
  const handleGrabTask = () => {
    if (isLimitReached) return;
    if (products.length === 0) {
      alert(language === "ar" ? "لا توجد منتجات متوفرة حالياً!" : "No products available currently!");
      return;
    }

    setIsLoading(true);
    setLoadingStep(0);

    // Stage 1: Matching
    setTimeout(() => {
      setLoadingStep(1);
      // Stage 2: Hashing
      setTimeout(() => {
        setLoadingStep(2);
        // Stage 3: Complete Matching
        setTimeout(() => {
          // Select a random product
          const randomIndex = Math.floor(Math.random() * products.length);
          const product = products[randomIndex];
          
          setSelectedProduct(product);
          setIsLoading(false);
          setShowProductModal(true);
        }, 1300);
      }, 1300);
    }, 1300);
  };

  // Triggers the actual rating transaction inside context
  const handleConfirmRating = () => {
    if (!selectedProduct) return;

    setIsSubmittingRating(true);

    setTimeout(() => {
      const result = rateProduct(selectedProduct.id);
      setIsSubmittingRating(false);
      setShowProductModal(false);

      if (result.success) {
        setLastCommission(result.commission);
        setShowSuccessModal(true);
      }
    }, 1500);
  };

  return (
    <div className={`p-4 flex flex-col gap-4 ${isRtl ? "text-right" : "text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
      {/* Header Info */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 p-4 rounded-2xl border border-slate-800 shadow-lg flex justify-between items-center">
        <div>
          <span className="text-[10px] uppercase font-bold text-amber-500 block">VIP {currentUser.vipLevel} ROOM</span>
          <h2 className="text-lg font-black text-white">{language === "ar" ? "قاعة المهام التلقائية" : "Automatic Task Room"}</h2>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block">{t.completedTasks}</span>
          <span className="text-sm font-bold text-amber-400 font-mono">
            {currentUser.completedTasksToday} / {currentVip.dailyTasks}
          </span>
        </div>
      </div>

      {/* Main Action Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden min-h-[320px]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <AnimatePresence mode="wait">
          {currentUser.vipLevel === 0 ? (
            /* LOCKED - NO VIP SUBSCRIPTION */
            <motion.div
              key="locked"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-3 py-6"
            >
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-7 h-7 animate-pulse" />
              </div>
              <h3 className="text-sm font-bold text-white">
                {language === "ar" ? "الغرفة مقفلة! العضوية مطلوبة" : "Room Locked! VIP Required"}
              </h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                {language === "ar"
                  ? "لا يمكن عمل مهام إلا بعد ترقية حسابك إلى عضوية VIP نشطة. يرجى التوجه لترقية الـ VIP لتفعيل المهام وكسب الأرباح."
                  : "You cannot perform tasks unless you subscribe to an active VIP level. Please visit the VIP section to activate task earnings."}
              </p>
              <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-850 mt-2 text-xs text-amber-500 font-bold">
                {language === "ar" ? "اشترك في عضوية VIP للبدء" : "Upgrade to VIP to Start"}
              </div>
            </motion.div>
          ) : isLoading ? (
            /* RATING PROCESSOR LOADING COMPONENT */
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-4 py-8"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin"></div>
                <Zap className="w-6 h-6 text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>

              <div className="flex flex-col gap-1.5 max-w-xs">
                <span className="text-xs text-slate-400 uppercase font-bold font-mono tracking-wider">
                  STAGE {loadingStep + 1} OF 3
                </span>
                <p className="text-sm font-bold text-amber-400 animate-pulse">
                  {loadingStep === 0 && t.startAnalyzing}
                  {loadingStep === 1 && t.submittingRating}
                  {loadingStep === 2 && (language === "ar" ? "جاري مطابقة عمولة التاجر النهائية..." : "Verifying merchant commissions...")}
                </p>
                <div className="w-40 h-1.5 bg-slate-800 rounded-full overflow-hidden mx-auto">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-1000"
                    style={{ width: `${((loadingStep + 1) / 3) * 100}%` }}
                  ></div>
                </div>
              </div>
            </motion.div>
          ) : isLimitReached ? (
            /* LIMIT REACHED NOTICE */
            <motion.div
              key="limit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3 py-6"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">{t.taskLimitReached}</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                {t.upgradeVipToContinue}
              </p>
              
              <TaskCountdown lastResetTime={currentUser.lastTaskResetTime} createdAt={currentUser.createdAt} language={language} />

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 mt-2 text-[11px] text-amber-500 font-bold font-mono">
                {language === "ar" ? "الرصيد الحالي:" : "Current Balance:"} ${(currentUser.balance ?? 0).toFixed(2)}
              </div>
            </motion.div>
          ) : (
            /* LOBBY / GRAB BUTTON SCREEN */
            <motion.div
              key="lobby"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4 py-4"
            >
              <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/5 relative">
                <div className="absolute inset-0 rounded-full border border-amber-500/30 animate-ping opacity-35"></div>
                <ShoppingBag className="w-10 h-10 text-amber-400" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-200 mb-1">
                  {language === "ar" ? "قاعة العمولات جاهزة!" : "Task Lobby Ready!"}
                </h3>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  {language === "ar"
                    ? "انقر فوق الزر أدناه لبدء عملية التقييم التلقائي. سيقوم النظام بمطابقة منتج متوافق مع مستواك."
                    : "Click the button below to start the automatic rating process. The engine will match a merchant product with your VIP Level."}
                </p>
              </div>

              <button
                onClick={handleGrabTask}
                className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-black px-6 py-3 rounded-full text-xs shadow-lg shadow-amber-500/10 transition-transform active:scale-95 flex items-center gap-2 mt-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
                <span>{t.grabTask}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[10px] text-slate-400 block mb-0.5 uppercase tracking-wider">{t.todayEarnings}</span>
          <span className="text-base font-black text-emerald-400 font-mono">${(currentUser.todayEarnings ?? 0).toFixed(2)}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[10px] text-slate-400 block mb-0.5 uppercase tracking-wider">
            {language === "ar" ? "عمولة المهمة الواحدة" : "Single Task Reward"}
          </span>
          <span className="text-base font-black text-amber-500 font-mono">
            {currentVip.singleTaskReward !== undefined 
              ? `${currentVip.singleTaskReward.toFixed(2)} USDT` 
              : `${(currentVip.commissionRate * 100).toFixed(1)}%`}
          </span>
        </div>
      </div>

      {/* INSTRUCTIONS */}
      <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-4 text-xs text-slate-400 space-y-2">
        <h4 className="font-bold text-slate-300 flex items-center gap-1">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>{language === "ar" ? "قواعد ونظام التقييم" : "Rating Rules & Systems"}</span>
        </h4>
        <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
          {language === "ar" ? (
            <>
              <li>تحصل على العمولات فوراً بعد تأكيد وتقديم كل تقييم.</li>
              <li>الحد اليومي للمهام يتحدد حسب مستوى الـ VIP الخاص بك.</li>
              <li>يرجى شحن حسابك لترقية VIP لفتح غرف أعلى وعمولات أكبر.</li>
            </>
          ) : (
            <>
              <li>Commissions are credited instantly after confirming each product rate.</li>
              <li>Daily task allocation is determined by your current VIP membership level.</li>
              <li>Top up your balance to upgrade VIP and unlock highly lucrative task rooms.</li>
            </>
          )}
        </ul>
      </div>

      {/* DYNAMIC PRODUCT RATING CONFIRM MODAL */}
      <AnimatePresence>
        {showProductModal && selectedProduct && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm text-slate-100 shadow-2xl relative"
            >
              <h3 className="text-base font-black text-center text-amber-500 mb-4 uppercase tracking-wide">
                {language === "ar" ? "تأكيد الطلب واستحقاق العمولة" : "Confirm Task Commission"}
              </h3>

              {/* Product layout */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex gap-3 mb-4">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.nameEn}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-850 flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white leading-snug truncate">
                    {isRtl ? selectedProduct.nameAr : selectedProduct.nameEn}
                  </h4>
                  <div className="flex gap-1 items-center mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">{selectedProduct.category}</p>
                </div>
              </div>

              {/* Financial metrics list */}
              <div className="space-y-2 border-b border-slate-800 pb-3 mb-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t.productPrice}</span>
                  <span className="font-mono font-bold text-white">${selectedProduct.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">
                    {currentVip.singleTaskReward !== undefined 
                      ? (language === "ar" ? "عمولة المهمة المحددة" : "Specified Task Reward") 
                      : t.commissionRateLabel.replace(": {rate}%", "")}
                  </span>
                  <span className="font-mono font-bold text-amber-500">
                    {currentVip.singleTaskReward !== undefined 
                      ? `${currentVip.singleTaskReward.toFixed(2)} USDT` 
                      : `${(currentVip.commissionRate * 100).toFixed(1)}%`}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-slate-950 px-3 py-2 rounded-xl border border-slate-850">
                  <span className="text-slate-300 font-bold">{t.commissionEarned}</span>
                  <span className="font-mono text-base font-black text-emerald-400">
                    +${(currentVip.singleTaskReward !== undefined ? currentVip.singleTaskReward : selectedProduct.price * currentVip.commissionRate).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleConfirmRating}
                  disabled={isSubmittingRating}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black py-3 rounded-xl text-xs transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingRating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t.loading}</span>
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 fill-slate-950 text-slate-950" />
                      <span>{t.rateNowBtn}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowProductModal(false)}
                  disabled={isSubmittingRating}
                  className="w-full bg-slate-800 hover:bg-slate-750 text-slate-400 font-bold py-2.5 rounded-xl text-xs"
                >
                  {t.cancel}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMED TRANSACTION SUCCESS MODAL */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl"
            >
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-400">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-white mb-1">{t.earningSuccess}</h3>
              <p className="text-xs text-slate-400 mb-4">
                {language === "ar" 
                  ? "تم تحديث رصيدك وأرباحك اليومية فوراً بسيرفر النظام." 
                  : "Your wallet balance and daily stats have been updated in the system servers."}
              </p>
              
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 mb-4 max-w-xs mx-auto">
                <span className="text-[10px] text-slate-400 block mb-0.5">{t.commissionEarned}</span>
                <span className="text-xl font-mono font-black text-emerald-400">+${lastCommission.toFixed(2)}</span>
              </div>

              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-slate-800 hover:bg-slate-750 text-amber-400 font-bold py-2.5 rounded-xl text-xs"
              >
                {t.confirm}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
