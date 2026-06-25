import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { translations } from "../../data/translations";
import { User, LogIn, UserPlus, CreditCard, Wallet, ClipboardList, LogOut, ArrowDownLeft, ArrowUpRight, Copy, CheckCircle2, ShieldAlert, AlertCircle, Phone, Lock, Eye, EyeOff, Mail } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const MineView: React.FC = () => {
  const {
    language,
    currentUser,
    login,
    register,
    logout,
    settings,
    addDeposit,
    addWithdrawal,
    updateUserWithdrawalAddress,
    depositRequests,
    withdrawalRequests,
    setIsAdminMode,
    vipTiers
  } = useApp();

  const t = translations[language];
  const isRtl = language === "ar";

  // Auth States
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [registerMethod, setRegisterMethod] = useState<"phone" | "email">("email");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // Menu action overlays
  const [activeOverlay, setActiveOverlay] = useState<"none" | "personal" | "funding" | "deposit" | "withdraw" | "deposit_record" | "withdraw_record">("none");

  // Input states for deposit/withdrawal
  const [depositAmount, setDepositAmount] = useState("");
  const [depositHash, setDepositHash] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (authMode === "login") {
      if (!phone || !password) {
        setAuthError(language === "ar" ? "يرجى ملء جميع الحقول المطلوبة." : "Please fill in all required fields.");
        return;
      }
      const result = login(phone, password);
      if (result.success) {
        setAuthSuccess(t.authSuccess);
      } else {
        setAuthError(result.error || t.authError);
      }
    } else {
      const finalPhone = registerMethod === "phone" ? phone : "";
      const finalEmail = registerMethod === "email" ? email : "";

      if (registerMethod === "phone" && !phone) {
        setAuthError(language === "ar" ? "رقم الهاتف مطلوب للإنشاء." : "Phone number is required for registration.");
        return;
      }
      if (registerMethod === "email" && !email) {
        setAuthError(language === "ar" ? "البريد الإلكتروني مطلوب للإنشاء." : "Email is required for registration.");
        return;
      }
      if (!inviteCode || !inviteCode.trim()) {
        setAuthError(language === "ar" ? "رمز الدعوة مطلوب وإجباري للتسجيل!" : "Invitation code is mandatory!");
        return;
      }
      if (password !== confirmPassword) {
        setAuthError(t.passwordMismatch);
        return;
      }
      const result = register(finalPhone, finalEmail, password, inviteCode);
      if (result.success) {
        setAuthSuccess(t.authSuccess);
      } else {
        setAuthError(result.error || t.authError);
      }
    }
  };

  // Deposit Submit handler
  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    setActionSuccess("");

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < settings.minDeposit) {
      setActionError(t.depositMinLimit.replace("{min}", String(settings.minDeposit)));
      return;
    }
    if (!depositHash.trim()) {
      setActionError(language === "ar" ? "يرجى إدخال هاش العملية (TXID)." : "Please enter the TXID transaction hash.");
      return;
    }

    const result = addDeposit(amount, depositHash);
    if (result.success) {
      setActionSuccess(t.depositPending);
      setDepositAmount("");
      setDepositHash("");
    } else {
      setActionError(t.authError);
    }
  };

  // Withdrawal Submit handler
  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    setActionSuccess("");

    if (!currentUser) return;

    // Retrieve user's active VIP tier to check allocated daily tasks
    const currentVip = vipTiers.find(v => v.level === currentUser.vipLevel) || vipTiers[0];

    // Block withdrawal if not subscribed to any VIP Level (VIP Level 0)
    if (currentUser.vipLevel < 1) {
      setActionError(language === "ar"
        ? "لا يمكن سحب الأموال إلا بعد الاشتراك في عضوية VIP نشطة!"
        : "Withdrawal blocked! You must subscribe to an active VIP membership first.");
      return;
    }

    // Block withdrawal if they haven't finished all daily tasks for their tier
    if (currentUser.completedTasksToday < currentVip.dailyTasks) {
      setActionError(language === "ar"
        ? `يرجى إكمال جميع المهام اليومية المطلوبة (${currentUser.completedTasksToday}/${currentVip.dailyTasks}) أولاً لتتمكن من السحب!`
        : `Please complete all required daily tasks (${currentUser.completedTasksToday}/${currentVip.dailyTasks}) first to unlock withdrawals!`);
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < settings.minWithdraw) {
      setActionError(t.withdrawMinLimit.replace("{min}", String(settings.minWithdraw)));
      return;
    }

    const boundAddress = currentUser.withdrawalAddress || withdrawAddress;
    if (!boundAddress.trim()) {
      setActionError(t.setupWithdrawAddressFirst);
      return;
    }

    if (currentUser.balance < amount) {
      setActionError(t.withdrawAmountExceeds);
      return;
    }

    const result = addWithdrawal(amount, boundAddress);
    if (result.success) {
      // Auto save the address if they put a new one
      if (!currentUser.withdrawalAddress && withdrawAddress) {
        updateUserWithdrawalAddress(withdrawAddress);
      }
      setActionSuccess(t.withdrawPending);
      setWithdrawAmount("");
      setWithdrawAddress("");
    } else {
      setActionError(t.authError);
    }
  };

  const handleSaveWalletAddress = () => {
    if (!withdrawAddress.trim()) return;
    updateUserWithdrawalAddress(withdrawAddress);
    setActionSuccess(t.saveSuccess);
    setTimeout(() => {
      setActionSuccess("");
      setActiveOverlay("none");
    }, 1500);
  };

  const handleCopyUsdt = () => {
    navigator.clipboard.writeText(settings.usdtAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ------------------------------------------------------------- */
  /*                  IF ANONYMOUS GUEST VIEW (AUTH)               */
  /* ------------------------------------------------------------- */
  if (!currentUser) {
    return (
      <div className={`p-6 flex-1 flex flex-col justify-center ${isRtl ? "text-right" : "text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3 text-amber-500">
            {authMode === "login" ? <LogIn className="w-7 h-7" /> : <UserPlus className="w-7 h-7" />}
          </div>
          <h2 className="text-xl font-black text-white">
            {authMode === "login" ? t.welcomeBack : t.registerTitle}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {authMode === "login" ? t.loginSubtitle : t.registerSubtitle}
          </p>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {authMode === "login" ? (
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-black block mb-1">
                {language === "ar" ? "رقم الهاتف / البريد الإلكتروني" : "Phone / Email"} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={language === "ar" ? "أدخل رقم الهاتف أو البريد الإلكتروني" : "Enter phone or email address"}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-black block mb-2 text-center">
                  {language === "ar" ? "طريقة إنشاء الحساب" : "Registration Method"}
                </label>
                <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-850 gap-1 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterMethod("email");
                      setAuthError("");
                    }}
                    className={`py-2 text-center rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      registerMethod === "email" ? "bg-amber-500 text-slate-950 font-black shadow-sm" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{language === "ar" ? "البريد الإلكتروني" : "Email"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterMethod("phone");
                      setAuthError("");
                    }}
                    className={`py-2 text-center rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      registerMethod === "phone" ? "bg-amber-500 text-slate-950 font-black shadow-sm" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{language === "ar" ? "رقم الهاتف" : "Phone Number"}</span>
                  </button>
                </div>
              </div>

              {registerMethod === "email" ? (
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-black block mb-1">
                    {t.email} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@domain.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-black block mb-1">
                    {language === "ar" ? "رقم الهاتف" : "Phone Number"} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +9647700000000"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-black block mb-1">
              {t.password} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.enterPassword}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-10 text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {authMode === "register" && (
            <>
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-black block mb-1">
                  {t.confirmPassword} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-black block mb-1">
                  {t.inviteCode} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="e.g. VIP111"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-amber-500 font-mono"
                />
              </div>
            </>
          )}

          {authError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs flex items-start gap-1.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{authSuccess}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-black py-3 rounded-xl text-xs shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            {authMode === "login" ? t.login : t.register}
          </button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === "login" ? "register" : "login");
                setAuthError("");
                setAuthSuccess("");
              }}
              className="text-xs text-amber-500 hover:underline font-semibold"
            >
              {authMode === "login" ? t.dontHaveAccount : t.alreadyHaveAccount}
            </button>
          </div>
        </form>
      </div>
    );
  }

  /* ------------------------------------------------------------- */
  /*                  IF AUTHENTICATED PROFILE VIEW                */
  /* ------------------------------------------------------------- */
  const myDeposits = depositRequests.filter(d => d.userId === currentUser.id);
  const myWithdrawals = withdrawalRequests.filter(w => w.userId === currentUser.id);

  return (
    <div className={`p-4 flex flex-col gap-4 ${isRtl ? "text-right" : "text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
      
      {/* Profile summary card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-5 border border-slate-800 shadow-xl flex items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="w-14 h-14 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xl uppercase">
          {currentUser.username[0]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-black text-white truncate font-mono">{currentUser.username}</h3>
            <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-bold">
              VIP {currentUser.vipLevel}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{currentUser.phone}</p>
          <p className="text-[9px] text-slate-500 mt-0.5">{t.myInviteCode}: <strong className="text-slate-300 font-mono">{currentUser.invitationCode}</strong></p>
        </div>
      </div>

      {/* Financial stats box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md grid grid-cols-2 gap-4">
        <div>
          <span className="text-[10px] text-slate-400 block mb-0.5">{t.balance}</span>
          <span className="text-xl font-mono font-black text-amber-400">${(currentUser.balance ?? 0).toFixed(2)}</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block mb-0.5">{t.totalEarnings}</span>
          <span className="text-xl font-mono font-black text-emerald-400">${(currentUser.totalEarnings ?? 0).toFixed(2)}</span>
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-850">
          <button
            onClick={() => {
              setActionError("");
              setActionSuccess("");
              setActiveOverlay("deposit");
            }}
            className="flex items-center justify-center gap-1 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 font-bold py-1.5 rounded-xl text-xs transition-colors"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>{t.deposit}</span>
          </button>
          <button
            onClick={() => {
              setActionError("");
              setActionSuccess("");
              setActiveOverlay("withdraw");
            }}
            className="flex items-center justify-center gap-1 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold py-1.5 rounded-xl text-xs transition-colors"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{t.withdraw}</span>
          </button>
        </div>
      </div>

      {/* Account Settings Menu */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 shadow-md divide-y divide-slate-800/60">
        {/* Personal details */}
        <button
          onClick={() => {
            setWithdrawAddress(currentUser.withdrawalAddress || "");
            setActionError("");
            setActionSuccess("");
            setActiveOverlay("personal");
          }}
          className="w-full flex items-center justify-between py-3 px-2 text-slate-200 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold">{t.personalInfo}</span>
          </div>
          <span className="text-slate-600 text-xs">➔</span>
        </button>

        {/* Financial logs */}
        <button
          onClick={() => {
            setActionError("");
            setActionSuccess("");
            setActiveOverlay("funding");
          }}
          className="w-full flex items-center justify-between py-3 px-2 text-slate-200 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-3">
            <ClipboardList className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold">{t.fundingDetails}</span>
          </div>
          <span className="text-slate-600 text-xs">➔</span>
        </button>

        {/* Deposit request button */}
        <button
          onClick={() => {
            setActionError("");
            setActionSuccess("");
            setActiveOverlay("deposit_record");
          }}
          className="w-full flex items-center justify-between py-3 px-2 text-slate-200 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-3">
            <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold">{t.depositRecord}</span>
          </div>
          <span className="text-slate-600 text-xs">➔</span>
        </button>

        {/* Withdraw request button */}
        <button
          onClick={() => {
            setActionError("");
            setActionSuccess("");
            setActiveOverlay("withdraw_record");
          }}
          className="w-full flex items-center justify-between py-3 px-2 text-slate-200 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-3">
            <ArrowUpRight className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-bold">{t.withdrawRecord}</span>
          </div>
          <span className="text-slate-600 text-xs">➔</span>
        </button>

        {/* Admin Dashboard (ONLY FOR ADMINS) */}
        {currentUser?.isAdmin && (
          <button
            onClick={() => {
              setIsAdminMode(true);
            }}
            className="w-full flex items-center justify-between py-3 px-2 bg-amber-500/5 text-amber-400 hover:text-amber-300 transition-colors border-y border-amber-500/20"
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-xs font-black">{language === "ar" ? "لوحة الإدارة" : "Admin Dashboard"}</span>
            </div>
            <span className="text-amber-500 text-xs">➔</span>
          </button>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-between py-3 px-2 text-red-400 hover:text-red-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-4 h-4 text-red-500" />
            <span className="text-xs font-bold">{t.logout}</span>
          </div>
          <span className="text-slate-600 text-xs">➔</span>
        </button>
      </div>

      {/* OVERLAY SCREENS PORTAL */}
      <AnimatePresence>
        {activeOverlay !== "none" && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm text-slate-100 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              {/* PERSONAL INFO OVERLAY */}
              {activeOverlay === "personal" && (
                <div>
                  <h3 className="text-base font-black text-amber-500 mb-2 uppercase text-center">{t.personalInfo}</h3>
                  <div className="space-y-4 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-1 font-bold">{language === "ar" ? "اسم المستخدم:" : "Username:"}</span>
                      <span className="font-mono text-white text-sm bg-slate-950 px-3 py-2 rounded-xl block border border-slate-850">
                        {currentUser.username}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1 font-bold">{t.walletAddress}</span>
                      <input
                        type="text"
                        value={withdrawAddress}
                        onChange={(e) => setWithdrawAddress(e.target.value)}
                        placeholder={t.walletAddressPlaceholder}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-hidden focus:border-amber-500"
                      />
                      <p className="text-[10px] text-slate-500 leading-normal mt-1">
                        {language === "ar"
                          ? "تأكد من عنوان محفظتك بعناية. لا يمكن تغييره بعد حفظه لتأمين حسابك."
                          : "Verify your wallet address. Once saved, it secures withdrawals to this address."}
                      </p>
                    </div>

                    {actionSuccess && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-xl text-xs">
                        {actionSuccess}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleSaveWalletAddress}
                        className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-black py-2.5 rounded-xl text-xs cursor-pointer"
                      >
                        {t.save}
                      </button>
                      <button
                        onClick={() => setActiveOverlay("none")}
                        className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-400 font-bold py-2.5 rounded-xl text-xs"
                      >
                        {t.back}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* FUNDING DETAILS OVERLAY */}
              {activeOverlay === "funding" && (
                <div>
                  <h3 className="text-base font-black text-amber-500 mb-3 uppercase text-center">{t.fundingDetails}</h3>
                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                    
                    {/* DEPOSITS LIST */}
                    <div>
                      <h4 className="text-xs font-black text-slate-300 border-b border-slate-800 pb-1 mb-2">
                        {t.depositRecord}
                      </h4>
                      {myDeposits.length === 0 ? (
                        <p className="text-[10px] text-slate-500 italic py-2">{t.noPendingRequests}</p>
                      ) : (
                        <div className="space-y-1.5">
                          {myDeposits.map(d => (
                            <div key={d.id} className="bg-slate-950 p-2 rounded-lg border border-slate-850 flex justify-between items-center text-[10px]">
                              <div>
                                <span className="font-mono text-white font-bold">${d.amount.toFixed(2)}</span>
                                <span className="block text-[8px] text-slate-500 mt-0.5">{new Date(d.createdAt).toLocaleDateString()}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                d.status === "approved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                d.status === "rejected" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}>
                                {t[d.status]}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* WITHDRAWALS LIST */}
                    <div>
                      <h4 className="text-xs font-black text-slate-300 border-b border-slate-800 pb-1 mb-2">
                        {t.withdrawRecord}
                      </h4>
                      {myWithdrawals.length === 0 ? (
                        <p className="text-[10px] text-slate-500 italic py-2">{t.noPendingRequests}</p>
                      ) : (
                        <div className="space-y-1.5">
                          {myWithdrawals.map(w => (
                            <div key={w.id} className="bg-slate-950 p-2 rounded-lg border border-slate-850 flex justify-between items-center text-[10px]">
                              <div>
                                <span className="font-mono text-white font-bold">${w.amount.toFixed(2)}</span>
                                <span className="block text-[8px] text-slate-500 mt-0.5">{new Date(w.createdAt).toLocaleDateString()}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                w.status === "approved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                w.status === "rejected" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}>
                                {t[w.status]}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                  <button
                    onClick={() => setActiveOverlay("none")}
                    className="w-full mt-4 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold py-2 rounded-xl text-xs"
                  >
                    {t.back}
                  </button>
                </div>
              )}

              {/* DEPOSIT RECORDS OVERLAY */}
              {activeOverlay === "deposit_record" && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base font-black text-amber-500 uppercase">{t.depositRecord}</h3>
                    <button
                      onClick={() => setActiveOverlay("deposit")}
                      className="bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 text-[10px] font-black px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      {language === "ar" ? "+ شحن جديد" : "+ New Deposit"}
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                    {myDeposits.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic py-4 text-center">
                        {language === "ar" ? "لا يوجد عمليات شحن سابقة" : "No previous deposit requests"}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {myDeposits.map(d => (
                          <div key={d.id} className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-mono text-white font-black text-sm block">${d.amount.toFixed(2)}</span>
                              <span className="text-[9px] text-slate-500 block mt-0.5 font-mono">{new Date(d.createdAt).toLocaleString()}</span>
                              {d.transactionHash && (
                                <span className="text-[8px] text-slate-400 font-mono block mt-1 truncate max-w-[150px] select-all">
                                  Hash: {d.transactionHash}
                                </span>
                              )}
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              d.status === "approved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              d.status === "rejected" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                              "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}>
                              {t[d.status] || d.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setActiveOverlay("none")}
                    className="w-full mt-4 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold py-2 rounded-xl text-xs cursor-pointer"
                  >
                    {t.back}
                  </button>
                </div>
              )}

              {/* WITHDRAW RECORDS OVERLAY */}
              {activeOverlay === "withdraw_record" && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base font-black text-amber-500 uppercase">{t.withdrawRecord}</h3>
                    <button
                      onClick={() => setActiveOverlay("withdraw")}
                      className="bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 text-[10px] font-black px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      {language === "ar" ? "+ سحب جديد" : "+ New Withdraw"}
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                    {myWithdrawals.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic py-4 text-center">
                        {language === "ar" ? "لا يوجد عمليات سحب سابقة" : "No previous withdrawal requests"}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {myWithdrawals.map(w => (
                          <div key={w.id} className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-mono text-white font-black text-sm block">${w.amount.toFixed(2)}</span>
                              <span className="text-[9px] text-slate-500 block mt-0.5 font-mono">{new Date(w.createdAt).toLocaleString()}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              w.status === "approved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              w.status === "rejected" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                              "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}>
                              {t[w.status] || w.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setActiveOverlay("none")}
                    className="w-full mt-4 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold py-2 rounded-xl text-xs cursor-pointer"
                  >
                    {t.back}
                  </button>
                </div>
              )}

              {/* DEPOSIT FORM */}
              {activeOverlay === "deposit" && (
                <form onSubmit={handleDepositSubmit}>
                  <h3 className="text-base font-black text-amber-500 mb-2 uppercase text-center">{t.deposit}</h3>
                  
                  <div className="space-y-3 text-xs mb-4">
                    <p className="text-[10px] text-slate-400 leading-normal">
                      {t.usdtDepositInstructions}
                    </p>

                    {/* Copy wallet container */}
                    <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <span className="font-mono text-[9px] text-slate-300 flex-1 truncate select-all">{settings.usdtAddress}</span>
                      <button
                        type="button"
                        onClick={handleCopyUsdt}
                        className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 p-1.5 rounded-lg border border-amber-500/20 transition-all active:scale-90"
                      >
                        {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-black block mb-1">
                        {language === "ar" ? "مبلغ الشحن (USDT)" : "Deposit Amount (USDT)"} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder={`Min: $${settings.minDeposit}`}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-black block mb-1">
                        {t.uploadReceipt} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={depositHash}
                        onChange={(e) => setDepositHash(e.target.value)}
                        placeholder="Paste transaction TXID hash"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {actionError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded-xl text-[11px] mb-4 flex items-start gap-1">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{actionError}</span>
                    </div>
                  )}

                  {actionSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-xl text-[11px] mb-4 flex items-start gap-1">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{actionSuccess}</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-black py-2.5 rounded-xl text-xs cursor-pointer"
                    >
                      {t.submit}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveOverlay("none")}
                      className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-400 font-bold py-2.5 rounded-xl text-xs"
                    >
                      {t.back}
                    </button>
                  </div>
                </form>
              )}

              {/* WITHDRAW FORM */}
              {activeOverlay === "withdraw" && (
                <form onSubmit={handleWithdrawSubmit}>
                  <h3 className="text-base font-black text-amber-500 mb-2 uppercase text-center">{t.withdraw}</h3>
                  
                  <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl mb-4 text-xs text-amber-400 text-center font-bold leading-relaxed">
                    {language === "ar" 
                      ? "يصل السحب خلال 3 دقائق والحد الأدنى للسحب هو 1$"
                      : "Withdrawal arrives within 3 minutes and the minimum withdrawal is $1."}
                  </div>
                  
                  <div className="space-y-3 text-xs mb-4">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1 font-bold">{t.walletAddress}</label>
                      {currentUser.withdrawalAddress ? (
                        <span className="font-mono text-slate-300 text-xs bg-slate-950 px-3 py-2 border border-slate-850 rounded-xl block truncate select-all">
                          {currentUser.withdrawalAddress}
                        </span>
                      ) : (
                        <div>
                          <input
                            type="text"
                            required
                            value={withdrawAddress}
                            onChange={(e) => setWithdrawAddress(e.target.value)}
                            placeholder={t.walletAddressPlaceholder}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-hidden focus:border-amber-500"
                          />
                          <p className="text-[9px] text-red-400 mt-1">
                            {language === "ar"
                              ? "سيتم حفظ هذا العنوان كعنوان سحب افتراضي لحسابك."
                              : "This address will be bound as your permanent withdrawal address."}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] text-slate-400 uppercase font-black block">
                          {language === "ar" ? "مبلغ السحب (USDT)" : "Withdrawal Amount (USDT)"} <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setWithdrawAmount(currentUser.balance.toFixed(2))}
                          className="text-[10px] font-black text-amber-500 hover:text-amber-400 font-sans cursor-pointer transition-colors"
                        >
                          {language === "ar" ? "سحب الكل" : "Withdraw All"}
                        </button>
                      </div>
                      
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          required
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder={`${language === "ar" ? "الحد الأدنى" : "Min"}: $${settings.minWithdraw}`}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-16 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-amber-500"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          <span className="text-[10px] font-mono font-black text-slate-500">USDT</span>
                        </div>
                      </div>

                      <div className="mt-2 flex justify-between items-center text-[11px] font-medium text-slate-400 bg-slate-950/50 px-3 py-2 rounded-xl border border-slate-850">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {language === "ar" ? "الرصيد القابل للسحب:" : "Withdrawable Balance:"}
                        </span>
                        <span className="font-mono font-black text-amber-400">${currentUser.balance.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {actionError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded-xl text-[11px] mb-4 flex items-start gap-1">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{actionError}</span>
                    </div>
                  )}

                  {actionSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-xl text-[11px] mb-4 flex items-start gap-1">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{actionSuccess}</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-black py-2.5 rounded-xl text-xs cursor-pointer"
                    >
                      {t.submit}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveOverlay("none")}
                      className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-400 font-bold py-2.5 rounded-xl text-xs"
                    >
                      {t.back}
                    </button>
                  </div>
                </form>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
