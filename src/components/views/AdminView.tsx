import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { translations } from "../../data/translations";
import { ShieldAlert, Users, Landmark, ArrowUpRight, ArrowDownLeft, Trash2, Check, X, RefreshCw } from "lucide-react";

export const AdminView: React.FC = () => {
  const {
    language,
    settings,
    depositRequests,
    withdrawalRequests,
    adminApproveDeposit,
    adminRejectDeposit,
    adminApproveWithdrawal,
    adminRejectWithdrawal,
    adminUpdateSettings
  } = useApp();

  const t = translations[language];
  const isRtl = language === "ar";

  // التبويبات الداخلية
  const [activeSubTab, setActiveSubTab] = useState<"deposits" | "withdrawals" | "users" | "settings">("users");

  // حالات إدارة المستخدمين السحابية
  const [cloudUsers, setCloudUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // للبحث بالهاتف أو البريد
  const [inlineAdjustAmounts, setInlineAdjustAmounts] = useState<Record<string, string>>({});

  // الإعدادات
  const [appNameInput, setAppNameInput] = useState(settings.appName);
  const [usdtAddressInput, setUsdtAddressInput] = useState(settings.usdtAddress);
  const [minDepositInput, setMinDepositInput] = useState(String(settings.minDeposit));
  const [minWithdrawInput, setMinWithdrawInput] = useState(String(settings.minWithdraw));
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // جلب البيانات من السيرفر
  const fetchCloudUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch("/api/state");
      if (response.ok) {
        const data = await response.json();
        // تصفية الحسابات لكي لا يظهر حساب المسؤول نفسه في القائمة الإدارية للتعديل
        const onlyPlayers = (data.users || []).filter((u: any) => u.email !== "asd@gmail.com");
        setCloudUsers(onlyPlayers);
      }
    } catch (error) {
      console.error("Error fetching cloud users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchCloudUsers();
  }, []);

  // المزامنة والحفظ السحابي عند تعديل رصيد أو VIP
  const syncWithCloud = async (updatedUsers: any[]) => {
    try {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: updatedUsers }),
      });
      fetchCloudUsers();
    } catch (error) {
      console.error("Sync error:", error);
    }
  };

  const handleUpdateUserCloud = (userId: string, updatedFields: any) => {
    const updatedList = cloudUsers.map(u => {
      if (u.id === userId) {
        return { ...u, ...updatedFields };
      }
      return u;
    });
    setCloudUsers(updatedList);
    syncWithCloud(updatedList);
  };

  const handleDeleteUserCloud = (userId: string) => {
    if (!confirm(language === "ar" ? "هل أنت متأكد من حذف هذا الحساب نهائياً؟" : "Are you sure?")) return;
    const updatedList = cloudUsers.filter(u => u.id !== userId);
    setCloudUsers(updatedList);
    
    // إرسال طلب الحذف للسيرفر
    fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ users: updatedList }),
    }).then(() => fetchCloudUsers());
  };

  // تصفية القائمة بناءً على البحث (يقبل رقم الهاتف أو الإيميل)
  const filteredUsers = cloudUsers.filter(u => {
    const query = searchQuery.trim().toLowerCase();
    if (query === "") return true;
    const matchPhone = u.phone && u.phone.includes(query);
    const matchEmail = u.email && u.email.toLowerCase().includes(query);
    const matchName = u.username && u.username.toLowerCase().includes(query);
    return matchPhone || matchEmail || matchName;
  });

  const pendingDeposits = depositRequests.filter(d => d.status === "pending");
  const pendingWithdrawals = withdrawalRequests.filter(w => w.status === "pending");

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    adminUpdateSettings({
      appName: appNameInput,
      usdtAddress: usdtAddressInput,
      minDeposit: parseFloat(minDepositInput) || 10,
      minWithdraw: parseFloat(minWithdrawInput) || 20,
    });
    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 2000);
  };

  return (
    <div className={`p-4 flex flex-col gap-4 ${isRtl ? "text-right" : "text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
      
      {/* الهيدر الأنيق */}
      <div className="bg-gradient-to-r from-red-950/80 to-slate-900 border border-red-900/40 p-4 rounded-2xl flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-red-500 flex-shrink-0 animate-pulse" />
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">{t.adminDashboard}</h3>
            <p className="text-[10px] text-red-400 mt-0.5 font-semibold">{t.adminModeActive}</p>
          </div>
        </div>
        <button 
          onClick={fetchCloudUsers} 
          className="p-2 bg-slate-800 rounded-xl text-amber-500 hover:bg-slate-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loadingUsers ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* الإحصائيات المدعومة بالأرقام الحقيقية */}
      <div className="grid grid-cols-4 gap-1.5 text-center">
        <div className="bg-slate-900/60 border border-slate-850 p-2 rounded-xl">
          <Users className="w-4 h-4 mx-auto text-slate-400 mb-0.5" />
          <span className="text-[8px] text-slate-500 block uppercase font-bold">{language === "ar" ? "أعضاء" : "Users"}</span>
          <span className="text-xs font-black text-white font-mono">{cloudUsers.length}</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-850 p-2 rounded-xl">
          <ArrowDownLeft className="w-4 h-4 mx-auto text-amber-500 mb-0.5" />
          <span className="text-[8px] text-slate-500 block uppercase font-bold">{language === "ar" ? "شحنات" : "Deposits"}</span>
          <span className="text-xs font-black text-amber-400 font-mono">{pendingDeposits.length}</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-850 p-2 rounded-xl">
          <ArrowUpRight className="w-4 h-4 mx-auto text-purple-500 mb-0.5" />
          <span className="text-[8px] text-slate-500 block uppercase font-bold">{language === "ar" ? "سحوبات" : "Payouts"}</span>
          <span className="text-xs font-black text-purple-400 font-mono">{pendingWithdrawals.length}</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-850 p-2 rounded-xl">
          <Landmark className="w-4 h-4 mx-auto text-emerald-500 mb-0.5" />
          <span className="text-[8px] text-slate-500 block uppercase font-bold">{language === "ar" ? "سيولة" : "Total USD"}</span>
          <span className="text-xs font-black text-emerald-400 font-mono">
            ${cloudUsers.reduce((sum, u) => sum + (parseFloat(u.balance) || 0), 0).toFixed(0)}
          </span>
        </div>
      </div>

      {/* التبويبات الثلاثية */}
      <div className="grid grid-cols-4 bg-slate-900 p-1.5 rounded-2xl border border-slate-850 gap-1.5 text-[10px] font-bold">
        <button onClick={() => setActiveSubTab("users")} className={`py-2 text-center rounded-xl transition-all ${activeSubTab === "users" ? "bg-amber-500 text-slate-950 font-black shadow-sm" : "text-slate-400"}`}>
          {language === "ar" ? "الأعضاء" : "Live Users"}
        </button>
        <button onClick={() => setActiveSubTab("deposits")} className={`py-2 text-center rounded-xl transition-all ${activeSubTab === "deposits" ? "bg-amber-500 text-slate-950 font-black shadow-sm" : "text-slate-400"}`}>
          {language === "ar" ? `شحن (${pendingDeposits.length})` : `Deposits (${pendingDeposits.length})`}
        </button>
        <button onClick={() => setActiveSubTab("withdrawals")} className={`py-2 text-center rounded-xl transition-all ${activeSubTab === "withdrawals" ? "bg-amber-500 text-slate-950 font-black shadow-sm" : "text-slate-400"}`}>
          {language === "ar" ? `سحب (${pendingWithdrawals.length})` : `Payouts (${pendingWithdrawals.length})`}
        </button>
        <button onClick={() => setActiveSubTab("settings")} className={`py-2 text-center rounded-xl transition-all ${activeSubTab === "settings" ? "bg-amber-500 text-slate-950 font-black shadow-sm" : "text-slate-400"}`}>
          {language === "ar" ? "إعدادات" : "Settings"}
        </button>
      </div>

      {/* لوحة عرض البيانات الجاهزة */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 shadow-xl min-h-[300px]">
        
        {activeSubTab === "users" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={language === "ar" ? "ابحث بالهاتف أو البريد الإلكتروني..." : "Search by phone or email..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {loadingUsers ? (
              <div className="text-center py-10 text-slate-500 text-xs animate-pulse">
                {language === "ar" ? "جاري جلب قائمة الحسابات السحابية..." : "Loading database..."}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs italic">
                {language === "ar" ? "لا توجد نتائج مطابقة لبحثك" : "No users found."}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-3 relative">
                    
                    {/* عرض الهوية (هاتف أو بريد الكتروني ديناميكياً) */}
                    <div className="flex justify-between items-start border-b border-slate-900 pb-2">
                      <div>
                        <span className="text-xs font-black text-amber-500 font-mono block">
                          {user.phone ? `📞 ${user.phone}` : `✉️ ${user.email}`}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {language === "ar" ? "كود دعوته: " : "Referral Code: "}
                          <strong className="text-emerald-400 font-mono font-bold">{user.invitationCode || "لا يوجد"}</strong>
                        </span>
                        {user.referredBy && (
                          <span className="text-[9px] text-slate-500 block">
                            {language === "ar" ? "سجل بواسطة كود: " : "Referred By: "}
                            <span className="font-mono text-slate-400">{user.referredBy}</span>
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-white block bg-slate-900 px-2 py-0.5 rounded-md font-mono">VIP {user.vipLevel}</span>
                        <span className="text-xs font-black text-emerald-400 block mt-1 font-mono">${(parseFloat(user.balance) || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* أدوات التحكم بالتصميم الأصلي */}
                    <div className="space-y-2 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 w-20">{language === "ar" ? "تعديل الرصيد:" : "Balance:"}</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={inlineAdjustAmounts[user.id] || ""}
                          onChange={(e) => setInlineAdjustAmounts({...inlineAdjustAmounts, [user.id]: e.target.value})}
                          className="w-16 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-center text-white font-mono text-[10px]"
                        />
                        <button onClick={() => handleUpdateUserCloud(user.id, { balance: (parseFloat(user.balance) || 0) + (parseFloat(inlineAdjustAmounts[user.id]) || 0) })} className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/35 px-2 py-0.5 rounded font-bold hover:bg-emerald-600/30">+</button>
                        <button onClick={() => handleUpdateUserCloud(user.id, { balance: Math.max(0, (parseFloat(user.balance) || 0) - (parseFloat(inlineAdjustAmounts[user.id]) || 0)) })} className="bg-red-600/20 text-red-400 border border-red-500/35 px-2 py-0.5 rounded font-bold hover:bg-red-600/30">-</button>
                        <button onClick={() => handleUpdateUserCloud(user.id, { balance: 0 })} className="bg-yellow-600/10 text-yellow-500 border border-yellow-500/20 px-2 py-0.5 rounded font-bold ml-auto hover:bg-yellow-600/20">{language === "ar" ? "تصفير" : "Zero"}</button>
                      </div>

                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-slate-400 w-20">{language === "ar" ? "رتبة الـ VIP:" : "VIP Tier:"}</span>
                        <select
                          value={user.vipLevel}
                          onChange={(e) => handleUpdateUserCloud(user.id, { vipLevel: parseInt(e.target.value) })}
                          className="bg-slate-900 border border-slate-800 rounded px-1 text-white text-[10px] py-0.5 focus:outline-none"
                        >
                          <option value={0}>VIP 0</option>
                          <option value={1}>VIP 1</option>
                          <option value={2}>VIP 2</option>
                          <option value={3}>VIP 3</option>
                          <option value={4}>VIP 4</option>
                          <option value={5}>VIP 5</option>
                        </select>

                        <button onClick={() => handleDeleteUserCloud(user.id)} className="mr-auto bg-red-950/40 text-red-400 border border-red-900/30 p-1 rounded hover:bg-red-900/40">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* بقية التبويبات كالشحن والسحب والإعدادات بملفات الربط المباشر الداخلي */}
        {activeSubTab === "deposits" && (
          <div className="space-y-2">
            {pendingDeposits.length === 0 ? <div className="text-center py-10 text-slate-500 text-xs italic">{t.noPendingRequests}</div> : 
              pendingDeposits.map(d => (
                <div key={d.id} className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs flex justify-between items-center font-mono">
                  <div>
                    <strong className="text-white block">@{d.username}</strong>
                    <span className="text-[10px] text-slate-400">Hash: {d.hash}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => adminApproveDeposit(d.id)} className="bg-emerald-500 text-slate-950 p-1 rounded"><Check className="w-3.5 h-3.5"/></button>
                    <button onClick={() => adminRejectDeposit(d.id)} className="bg-red-500 text-white p-1 rounded"><X className="w-3.5 h-3.5"/></button>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {activeSubTab === "withdrawals" && (
          <div className="space-y-2">
            {pendingWithdrawals.length === 0 ? <div className="text-center py-10 text-slate-500 text-xs italic">{t.noPendingRequests}</div> : 
              pendingWithdrawals.map(w => (
                <div key={w.id} className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs flex justify-between items-center font-mono">
                  <div>
                    <strong className="text-white block">@{w.username}</strong>
                    <span className="text-[10px] text-slate-400">Wallet: {w.address}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => adminApproveWithdrawal(w.id)} className="bg-emerald-500 text-slate-950 p-1 rounded"><Check className="w-3.5 h-3.5"/></button>
                    <button onClick={() => adminRejectWithdrawal(w.id)} className="bg-red-500 text-white p-1 rounded"><X className="w-3.5 h-3.5"/></button>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {activeSubTab === "settings" && (
          <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">اسم المنصة:</label>
              <input type="text" value={appNameInput} onChange={e => setAppNameInput(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white" />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">عنوان محفظة USDT (TRC20):</label>
              <input type="text" value={usdtAddressInput} onChange={e => setUsdtAddressInput(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white font-mono" />
            </div>
            <button type="submit" className="w-full bg-amber-500 text-slate-950 font-black py-2 rounded-xl mt-2 hover:bg-amber-400 transition">
              {settingsSuccess ? "تم الحفظ بنجاح!" : "حفظ التغييرات السحابية"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
