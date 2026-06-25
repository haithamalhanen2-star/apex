import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { translations } from "../../data/translations";
import { VipTier } from "../../types";
import { Shield, Sparkles, Key, CheckCircle2, ChevronRight, Copy, AlertCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const VipView: React.FC = () => {
  const { language, currentUser, settings, upgradeVip, addDeposit, vipTiers } = useApp();
  const t = translations[language];
  const isRtl = language === "ar";

  const [selectedTier, setSelectedTier] = useState<VipTier | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!currentUser) return null;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(settings.usdtAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUnlockClick = (tier: VipTier) => {
    setSelectedTier(tier);
    setTxHash("");
    setErrorMessage("");
    setSuccessMessage("");
    setShowUpgradeModal(true);
  };

  const handleUpgradeSubmit = () => {
    if (!selectedTier) return;

    // SCENARIO 1: User has enough balance to instantly upgrade
    if (currentUser.balance >= selectedTier.price) {
      setIsSubmitting(true);
      setTimeout(() => {
        const result = upgradeVip(selectedTier.level);
        setIsSubmitting(false);
        if (result.success) {
          setSuccessMessage(t.upgradeSuccess.replace("{name}", selectedTier.name));
          setTimeout(() => {
            setShowUpgradeModal(false);
            setSelectedTier(null);
          }, 2000);
        } else {
          setErrorMessage(t.insufficientFunds);
        }
      }, 1200);
    } 
    // SCENARIO 2: Balance is too low, user must submit deposit hash first
    else {
      if (!txHash.trim()) {
        setErrorMessage(language === "ar" ? "يرجى إدخال معرف المعاملة (TXID) للتأكيد." : "Please enter the transaction hash (TXID) to confirm.");
        return;
      }

      setIsSubmitting(true);
      setTimeout(() => {
        // Must deposit the full VIP subscription cost
        const depositAmount = selectedTier.price;
        const result = addDeposit(depositAmount, txHash);
        setIsSubmitting(false);

        if (result.success) {
          setSuccessMessage(language === "ar"
            ? `تم تقديم طلب ترقية VIP معلق بنجاح! انتقل إلى لوحة تحكم المسؤول (زر Admin بالأعلى) وقم بالموافقة على إيداع بقيمة $${depositAmount.toFixed(2)} للحصول على الترقية فوراً.`
            : `Pending upgrade request submitted! Use the ADMIN Dashboard (Admin button at top) to approve the $${depositAmount.toFixed(2)} deposit to instantly activate your tier.`);
          setTxHash("");
        } else {
          setErrorMessage(t.authError);
        }
      }, 1500);
    }
  };

  return (
    <div className={`p-4 flex flex-col gap-4 ${isRtl ? "text-right" : "text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-400 text-slate-950 p-5 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full blur-2xl"></div>
        <Sparkles className="w-8 h-8 text-white absolute top-4 right-4 opacity-70" />
        <h2 className="text-xl font-black mb-1 text-white uppercase tracking-wide">{t.vipTiers}</h2>
        <p className="text-xs text-slate-950 leading-relaxed font-medium opacity-90 max-w-[80%]">
          {t.vipTierDesc}
        </p>
      </div>

      {/* Grid of Tiers */}
      <div className="flex flex-col gap-3">
        {vipTiers.map((tier) => {
          const isCurrent = currentUser.vipLevel === tier.level;
          const isUnlocked = currentUser.vipLevel >= tier.level;
          
          return (
            <div
              key={tier.level}
              className={`bg-slate-900 border ${
                isCurrent 
                  ? "border-amber-400 shadow-amber-500/10 shadow-lg" 
                  : isUnlocked 
                  ? "border-slate-800" 
                  : "border-slate-900/60 opacity-80"
              } rounded-2xl p-4 transition-all flex justify-between items-center relative overflow-hidden`}
            >
              <div className="absolute top-0 left-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>

              <div className="flex gap-3.5 items-center">
                <div className={`w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center border ${tier.color} shadow-md`}>
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black text-white">{tier.name}</h3>
                    {isCurrent && (
                      <span className="bg-amber-400/10 text-amber-400 border border-amber-400/20 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                        {t.currentTier}
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5 mt-1 text-[11px] text-slate-400 leading-normal">
                    <p>{t.dailyTasksCount.replace("{count}", String(tier.dailyTasks))}</p>
                    {tier.singleTaskReward !== undefined ? (
                      <p>
                        {language === "ar" 
                          ? `عمولة المهمة: ${tier.singleTaskReward.toFixed(2)} USDT` 
                          : `Task Reward: ${tier.singleTaskReward.toFixed(2)} USDT`}
                      </p>
                    ) : (
                      <p>{t.commissionRateLabel.replace("{rate}", String(((tier.commissionRate || 0) * 100).toFixed(1)))}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block mb-0.5">{language === "ar" ? "قيمة المستوى" : "Tier Value"}</span>
                <span className="text-sm font-mono font-black text-amber-400 block">${tier.price.toFixed(0)}</span>
                
                {/* Button actions */}
                {!isUnlocked ? (
                  <button
                    onClick={() => handleUnlockClick(tier)}
                    className="mt-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 text-[10px] font-bold px-3 py-1 rounded-full transition-transform active:scale-95"
                  >
                    {t.unlockNow}
                  </button>
                ) : !isCurrent ? (
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2.5 py-0.5 rounded-full font-bold uppercase block mt-1">
                    UNLOCKED
                  </span>
                ) : (
                  <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2.5 py-0.5 rounded-full font-bold uppercase block mt-1">
                    ACTIVE
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAILED VIP UPGRADE MODAL */}
      <AnimatePresence>
        {showUpgradeModal && selectedTier && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm text-slate-100 shadow-2xl my-auto"
            >
              <h3 className="text-base font-black text-center text-amber-500 mb-2 uppercase tracking-wider">
                {language === "ar" ? `ترقية إلى ${selectedTier.name}` : `Upgrade to ${selectedTier.name}`}
              </h3>
              
              <p className="text-[11px] text-slate-400 text-center mb-4 leading-relaxed">
                {currentUser.balance >= selectedTier.price 
                  ? t.unlockConfirmMsg.replace("{name}", selectedTier.name).replace("{price}", String(selectedTier.price))
                  : language === "ar"
                  ? "رصيدك الحالي غير كافٍ للترقية المباشرة. يجب إرسال مبلغ الاشتراك بالكامل عبر USDT TRC-20، حيث لا يمكن استخدام رصيد المكافأة أو الأرباح لدفع جزء من قيمة الاشتراك."
                  : "Your current balance is insufficient for instant unlock. You must deposit the full subscription amount via USDT TRC-20, as bonus or task earnings cannot be used to pay for a partial VIP subscription."
                }
              </p>

              {/* Balance & Price overview */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 space-y-1.5 mb-4 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t.balance}:</span>
                  <span className="font-bold text-white">${(currentUser.balance ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{language === "ar" ? "سعر الترقية:" : "Upgrade Cost:"}</span>
                  <span className="font-bold text-amber-400">${selectedTier.price.toFixed(2)}</span>
                </div>
                {currentUser.balance < selectedTier.price && (
                  <>
                    <div className="flex justify-between pt-1 border-t border-slate-800 text-amber-400 font-bold">
                      <span>{language === "ar" ? "المبلغ المطلوب إرساله:" : "Amount to Deposit:"}</span>
                      <span>${selectedTier.price.toFixed(2)}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-sans mt-2 text-center leading-normal">
                      {language === "ar"
                        ? "⚠️ ستبقى مكافأتك ورصيدك الحالي بأمان في حسابك لتتمكن من سحبها لاحقاً مع أرباح المهام."
                        : "⚠️ Your current balance/bonus will remain untouched in your account to be withdrawn later with your earnings."}
                    </div>
                  </>
                )}
              </div>

              {/* PAYMENT STEPS FOR LOWER BALANCE */}
              {currentUser.balance < selectedTier.price && (
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 mb-4 space-y-3.5">
                  <div>
                    <span className="text-[10px] text-amber-400 uppercase font-black block mb-1">
                      {language === "ar" ? "الخطوة 1: إرسال العملات" : "Step 1: Transfer Funds"}
                    </span>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      {t.usdtDepositInstructions}
                    </p>
                  </div>

                  {/* Copy USDT address */}
                  <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="font-mono text-[10px] text-slate-300 select-all truncate flex-1">
                      {settings.usdtAddress}
                    </span>
                    <button
                      onClick={handleCopyAddress}
                      className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 p-1.5 rounded-lg border border-amber-500/20 flex-shrink-0 transition-all active:scale-90"
                      title="Copy Address"
                    >
                      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Input tx id */}
                  <div>
                    <label className="text-[10px] text-amber-400 uppercase font-black block mb-1">
                      {language === "ar" ? "الخطوة 2: إدخال الهاش TXID" : "Step 2: Enter TXID"}
                    </label>
                    <input
                      type="text"
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      placeholder="e.g. 0x7cda9a29bb83d1c9..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Feedback banners */}
              {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded-xl text-[11px] mb-4 flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-xl text-[11px] mb-4 flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleUpgradeSubmit}
                  disabled={isSubmitting || successMessage !== ""}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-black py-3 rounded-xl text-xs transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? t.loading : currentUser.balance >= selectedTier.price ? t.unlockNow : t.submit}
                </button>
                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    setSelectedTier(null);
                  }}
                  disabled={isSubmitting}
                  className="w-full bg-slate-800 hover:bg-slate-750 text-slate-400 font-bold py-2.5 rounded-xl text-xs"
                >
                  {t.cancel}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
