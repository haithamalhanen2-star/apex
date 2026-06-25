import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { translations } from "../../data/translations";
import { Users, Copy, CheckCircle2, Award, TrendingUp, DollarSign, ListFilter } from "lucide-react";
import { motion } from "motion/react";

export const TeamView: React.FC = () => {
  const { language, currentUser, getTeamReport, users } = useApp();
  const t = translations[language];
  const isRtl = language === "ar";

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "members">("summary");

  if (!currentUser) return null;

  // Retrieve dynamic statistics
  const stats = getTeamReport(currentUser.id);
  const inviteLink = `${window.location.origin}/#/register?invite=${currentUser.invitationCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentUser.invitationCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Subordinates lists
  const level1Members = users.filter(u => u.referredBy === currentUser.invitationCode);
  const level2Members = users.filter(u => u.referredBy && level1Members.some(l1 => l1.invitationCode === u.referredBy));
  const level3Members = users.filter(u => u.referredBy && level2Members.some(l2 => l2.invitationCode === u.referredBy));

  const allSubordinates = [
    ...level1Members.map(m => ({ ...m, level: 1 })),
    ...level2Members.map(m => ({ ...m, level: 2 })),
    ...level3Members.map(m => ({ ...m, level: 3 }))
  ];

  return (
    <div className={`p-4 flex flex-col gap-4 ${isRtl ? "text-right" : "text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-slate-100 p-5 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full blur-2xl"></div>
        <Users className="w-8 h-8 text-white/70 absolute top-4 right-4" />
        <h2 className="text-xl font-black mb-1 text-white uppercase tracking-wide">{t.teamReport}</h2>
        <p className="text-xs text-white/90 leading-relaxed opacity-95 max-w-[85%]">
          {t.inviteFriendsDesc}
        </p>
      </div>

      {/* Invitations details */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
              {t.myInviteCode}
            </span>
            <span className="text-sm font-black font-mono text-amber-400 select-all">{currentUser.invitationCode}</span>
          </div>
          <button
            onClick={handleCopyCode}
            className="mt-3 w-full bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] py-1.5 rounded-xl font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform"
          >
            {copiedCode ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-amber-500" />}
            <span>{copiedCode ? t.copied : t.copy}</span>
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
              {t.myInviteLink}
            </span>
            <span className="text-xs text-slate-300 truncate block font-mono select-all max-w-full">
              {inviteLink}
            </span>
          </div>
          <button
            onClick={handleCopyLink}
            className="mt-3 w-full bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] py-1.5 rounded-xl font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform"
          >
            {copiedLink ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-amber-500" />}
            <span>{copiedLink ? t.copied : t.copy}</span>
          </button>
        </div>
      </div>

      {/* Sub-tab selection */}
      <div className="flex border-b border-slate-800 gap-1 mt-1">
        <button
          onClick={() => setActiveTab("summary")}
          className={`flex-1 py-2 text-xs font-bold border-b-2 text-center transition-colors ${
            activeTab === "summary" ? "border-amber-400 text-amber-400 font-black" : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          {t.teamStats}
        </button>
        <button
          onClick={() => setActiveTab("members")}
          className={`flex-1 py-2 text-xs font-bold border-b-2 text-center transition-colors ${
            activeTab === "members" ? "border-amber-400 text-amber-400 font-black" : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          {language === "ar" ? `الأعضاء (${allSubordinates.length})` : `Members (${allSubordinates.length})`}
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "summary" ? (
        <div className="space-y-4">
          {/* Global Team Summary Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-850">
              <Users className="w-4 h-4 mx-auto mb-1 text-blue-400" />
              <span className="text-[9px] text-slate-400 block">{t.registeredMembers}</span>
              <span className="text-sm font-black text-white font-mono">{allSubordinates.length}</span>
            </div>
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-850">
              <TrendingUp className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
              <span className="text-[9px] text-slate-400 block">{language === "ar" ? "شحنات الفريق" : "Team Deposits"}</span>
              <span className="text-sm font-black text-emerald-400 font-mono">
                ${(stats.level1Deposit + stats.level2Deposit + stats.level3Deposit).toFixed(0)}
              </span>
            </div>
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-850">
              <Award className="w-4 h-4 mx-auto mb-1 text-purple-400" />
              <span className="text-[9px] text-slate-400 block">{language === "ar" ? "عمولات الفريق" : "Commissions"}</span>
              <span className="text-sm font-black text-purple-400 font-mono">
                ${(stats.level1Commission + stats.level2Commission + stats.level3Commission).toFixed(1)}
              </span>
            </div>
          </div>

          {/* Level Breakdown Details */}
          <div className="space-y-2">
            {/* Level 1 */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 relative overflow-hidden">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-black text-white">{t.tier1}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {t.registeredMembers}: <strong className="text-white font-mono">{stats.level1Count}</strong>
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[9px] text-slate-400 block">{language === "ar" ? "عمولتك" : "Your Share"}</span>
                  <span className="text-sm font-black text-amber-400">+${stats.level1Commission.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Level 2 */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 relative overflow-hidden">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-black text-white">{t.tier2}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {t.registeredMembers}: <strong className="text-white font-mono">{stats.level2Count}</strong>
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[9px] text-slate-400 block">{language === "ar" ? "عمولتك" : "Your Share"}</span>
                  <span className="text-sm font-black text-amber-400">+${stats.level2Commission.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Level 3 */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 relative overflow-hidden">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-black text-white">{t.tier3}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {t.registeredMembers}: <strong className="text-white font-mono">{stats.level3Count}</strong>
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[9px] text-slate-400 block">{language === "ar" ? "عمولتك" : "Your Share"}</span>
                  <span className="text-sm font-black text-amber-400">+${stats.level3Commission.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MEMBERS DIRECTORY */
        <div className="space-y-2">
          {allSubordinates.length === 0 ? (
            <div className="text-center py-10 bg-slate-900/40 rounded-2xl border border-slate-900">
              <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">
                {language === "ar" ? "لا يوجد أعضاء مسجلين تحت كود إحالتك حتى الآن." : "No registered members under your code yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {allSubordinates.map((sub, idx) => (
                <div key={sub.id + idx} className="bg-slate-900 px-4 py-3 rounded-xl border border-slate-850 flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${
                      sub.level === 1 ? "bg-amber-400" : sub.level === 2 ? "bg-blue-400" : "bg-purple-400"
                    }`}></span>
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono">{sub.username}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{sub.phone}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] bg-slate-950 px-2 py-0.5 border border-slate-800 rounded-full font-bold text-amber-400 block w-max ml-auto">
                      VIP {sub.vipLevel}
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase block mt-1">
                      LEVEL {sub.level}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
