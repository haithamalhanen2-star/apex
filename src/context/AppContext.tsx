import React, { createContext, useContext, useState, useEffect } from "react";
import { User, AppSettings, DepositRequest, WithdrawRequest, Language, TeamReport, VipTier, Product } from "../types";
import { INITIAL_VIP_TIERS, PRODUCTS } from "../data/mockData";

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currentUser: User | null;
  users: User[];
  settings: AppSettings;
  depositRequests: DepositRequest[];
  withdrawalRequests: WithdrawRequest[];
  login: (phone: string, password: string) => { success: boolean; error?: string };
  register: (phone: string, email: string, password: string, inviteCode?: string) => { success: boolean; error?: string };
  logout: () => void;
  rateProduct: (productId: string) => { success: boolean; commission: number; error?: string };
  addDeposit: (amount: number, hash: string) => { success: boolean; error?: string };
  addWithdrawal: (amount: number, address: string) => { success: boolean; error?: string };
  upgradeVip: (level: number) => { success: boolean; error?: string };
  updateUserWithdrawalAddress: (address: string) => void;
  
  // Dynamic VIP levels & Tasks/Products
  vipTiers: VipTier[];
  products: Product[];
  adminAddVipTier: (tier: VipTier) => void;
  adminUpdateVipTier: (level: number, fields: Partial<VipTier>) => void;
  adminDeleteVipTier: (level: number) => void;
  adminAddProduct: (product: Product) => void;
  adminUpdateProduct: (id: string, fields: Partial<Product>) => void;
  adminDeleteProduct: (id: string) => void;
  
  // Admin functions
  isAdminMode: boolean;
  setIsAdminMode: (active: boolean) => void;
  adminApproveDeposit: (depositId: string) => void;
  adminRejectDeposit: (depositId: string) => void;
  adminApproveWithdrawal: (withdrawalId: string) => void;
  adminRejectWithdrawal: (withdrawalId: string) => void;
  adminUpdateUser: (userId: string, fields: Partial<User>) => void;
  adminDeleteUser: (userId: string) => void;
  adminUpdateSettings: (fields: Partial<AppSettings>) => void;
  getTeamReport: (userId: string) => TeamReport;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AppSettings = {
  appName: "999 Ratings",
  usdtAddress: "T9zXvA23B94C8dEf7gHiJkLmNoPqRsTuVw",
  supportTelegram: "https://t.me/apexratings_support",
  supportWhatsApp: "https://wa.me/9647700000000",
  minDeposit: 10,
  minWithdraw: 1
};

const SEED_USERS: User[] = [
  {
    id: "u1",
    username: "haitham",
    phone: "07701234567",
    email: "haitham@example.com",
    balance: 5.00,
    todayEarnings: 0,
    totalEarnings: 0,
    vipLevel: 0,
    completedTasksToday: 0,
    totalCompletedTasks: 0,
    invitationCode: "VIP111",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    withdrawalAddress: "TXS888dd888jjf8888fff",
    isAdmin: true
  },
  {
    id: "u2",
    username: "ahmed_guest",
    phone: "777",
    email: "ahmed@example.com",
    balance: 5.00,
    todayEarnings: 0,
    totalEarnings: 0,
    vipLevel: 0,
    completedTasksToday: 0,
    totalCompletedTasks: 0,
    invitationCode: "INV777",
    referredBy: "VIP111",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem("apex_lang") as Language) || "ar";
  });

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [users, setUsers] = useState<User[]>(SEED_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("apex_current_user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to parse apex_current_user", e);
      return null;
    }
  });

  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawRequest[]>([]);
  const [vipTiers, setVipTiers] = useState<VipTier[]>(INITIAL_VIP_TIERS);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);

  // Helper function to sync updated states back to the Express Server Database
  const syncState = (payload: {
    users?: User[];
    settings?: AppSettings;
    depositRequests?: DepositRequest[];
    withdrawalRequests?: WithdrawRequest[];
    vipTiers?: VipTier[];
    products?: Product[];
  }) => {
    fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        users: payload.users,
        settings: payload.settings,
        depositRequests: payload.depositRequests,
        withdrawalRequests: payload.withdrawalRequests,
        vipTiers: payload.vipTiers,
        products: payload.products
      })
    })
    .then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        if (data.users) {
          setUsers(data.users);
          if (currentUser) {
            const updatedMe = data.users.find((u: User) => u.id === currentUser.id);
            if (updatedMe) {
              setCurrentUser(updatedMe);
              localStorage.setItem("apex_current_user", JSON.stringify(updatedMe));
            }
          }
        }
        if (data.settings) setSettings(data.settings);
        if (data.depositRequests) setDepositRequests(data.depositRequests);
        if (data.withdrawalRequests) setWithdrawalRequests(data.withdrawalRequests);
        if (data.vipTiers) setVipTiers(data.vipTiers);
        if (data.products) setProducts(data.products);
      }
    })
    .catch(err => console.error("Sync state to server failed", err));
  };

  // Fetch full state on mount & set up a 3-second polling interval for real-time synchronization
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch("/api/state");
        if (res.ok) {
          const data = await res.json();
          if (data.users) {
            setUsers(data.users);
            const savedCur = localStorage.getItem("apex_current_user");
            if (savedCur) {
              try {
                const parsed = JSON.parse(savedCur);
                const updatedMe = data.users.find((u: User) => u.id === parsed.id);
                if (updatedMe) {
                  setCurrentUser(updatedMe);
                  localStorage.setItem("apex_current_user", JSON.stringify(updatedMe));
                }
              } catch (e) {
                console.error("Failed parsing user", e);
              }
            }
          }
          if (data.settings) setSettings(data.settings);
          if (data.depositRequests) setDepositRequests(data.depositRequests);
          if (data.withdrawalRequests) setWithdrawalRequests(data.withdrawalRequests);
          if (data.vipTiers) setVipTiers(data.vipTiers);
          if (data.products) setProducts(data.products);
        }
      } catch (err) {
        console.error("Failed to fetch state from server", err);
      }
    };

    fetchState();

    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, []);

  // Sync language selection to localStorage
  useEffect(() => {
    localStorage.setItem("apex_lang", language);
  }, [language]);

  // Handle periodic 24h reset of tasks and daily earnings
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let hasUpdates = false;
      const updatedUsers = users.map(u => {
        const baseTimeStr = u.lastTaskResetTime || u.createdAt;
        const baseTime = new Date(baseTimeStr).getTime();
        if (now - baseTime >= 24 * 60 * 60 * 1000) {
          hasUpdates = true;
          return {
            ...u,
            completedTasksToday: 0,
            todayEarnings: 0,
            lastTaskResetTime: new Date().toISOString()
          };
        }
        if (!u.lastTaskResetTime) {
          hasUpdates = true;
          return {
            ...u,
            lastTaskResetTime: new Date().toISOString()
          };
        }
        return u;
      });

      if (hasUpdates) {
        setUsers(updatedUsers);
        syncState({ users: updatedUsers });
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [users]);

  // Admin Actions for VIP Tiers
  const adminAddVipTier = (tier: VipTier) => {
    const exists = vipTiers.some(t => t.level === tier.level);
    const updated = exists
      ? vipTiers.map(t => t.level === tier.level ? tier : t)
      : [...vipTiers, tier].sort((a, b) => a.level - b.level);
    setVipTiers(updated);
    syncState({ vipTiers: updated });
  };

  const adminUpdateVipTier = (level: number, fields: Partial<VipTier>) => {
    const updated = vipTiers.map(t => t.level === level ? { ...t, ...fields } : t);
    setVipTiers(updated);
    syncState({ vipTiers: updated });
  };

  const adminDeleteVipTier = (level: number) => {
    const updated = vipTiers.filter(t => t.level !== level);
    setVipTiers(updated);
    syncState({ vipTiers: updated });
  };

  // Admin Actions for Products
  const adminAddProduct = (product: Product) => {
    const exists = products.some(p => p.id === product.id);
    const updated = exists
      ? products.map(p => p.id === product.id ? product : p)
      : [...products, product];
    setProducts(updated);
    syncState({ products: updated });
  };

  const adminUpdateProduct = (id: string, fields: Partial<Product>) => {
    const updated = products.map(p => p.id === id ? { ...p, ...fields } : p);
    setProducts(updated);
    syncState({ products: updated });
  };

  const adminDeleteProduct = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    syncState({ products: updated });
  };

  // Auth: Login
  const login = (phone: string, password: string) => {
    if (phone === "asd@gmail.com") {
      if (password !== "123ASDasd") {
        return { success: false, error: language === "ar" ? "كلمة مرور المسؤول غير صحيحة!" : "Incorrect Admin password!" };
      }
      
      let adminUser = users.find(u => u.phone === "asd@gmail.com" || u.email === "asd@gmail.com");
      let updatedUsers = [...users];
      if (!adminUser) {
        adminUser = {
          id: "admin_u",
          username: "Admin",
          phone: "asd@gmail.com",
          email: "asd@gmail.com",
          balance: 99999.00,
          todayEarnings: 0,
          totalEarnings: 0,
          vipLevel: 5,
          completedTasksToday: 0,
          totalCompletedTasks: 0,
          invitationCode: "ADMIN",
          createdAt: new Date().toISOString(),
          isAdmin: true
        };
        updatedUsers.push(adminUser);
        setUsers(updatedUsers);
      }
      
      setCurrentUser(adminUser);
      setIsAdminMode(true);
      localStorage.setItem("apex_current_user", JSON.stringify(adminUser));
      syncState({ users: updatedUsers });
      return { success: true };
    }

    const user = users.find(u => (u.phone && u.phone === phone) || (u.email && u.email.toLowerCase() === phone.toLowerCase()));
    if (user) {
      if (user.isAdmin && password !== "123ASDasd") {
        return { success: false, error: language === "ar" ? "كلمة مرور المسؤول غير صحيحة!" : "Incorrect Admin password!" };
      }
      setCurrentUser(user);
      localStorage.setItem("apex_current_user", JSON.stringify(user));
      return { success: true };
    } else {
      return { success: false, error: language === "ar" ? "رقم الهاتف / البريد الإلكتروني غير مسجل. يرجى إنشاء حساب أولاً." : "Phone number / Email not registered. Please create an account." };
    }
  };

  // Auth: Register
  const register = (phone: string, email: string, password: string, inviteCode?: string) => {
    if (!inviteCode || !inviteCode.trim()) {
      return { success: false, error: language === "ar" ? "رمز الدعوة مطلوب وإجباري للتسجيل!" : "Invitation code is mandatory!" };
    }

    const trimmedInvite = inviteCode.trim();
    const inviter = users.find(u => u.invitationCode === trimmedInvite);
    if (!inviter) {
      return { success: false, error: language === "ar" ? "رمز الدعوة غير صالح!" : "Invalid invitation code!" };
    }

    if (phone) {
      const exists = users.some(u => u.phone === phone);
      if (exists) {
        return { success: false, error: language === "ar" ? "رقم الهاتف مسجل بالفعل!" : "Phone number already registered!" };
      }
    }
    if (email) {
      const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        return { success: false, error: language === "ar" ? "البريد الإلكتروني مسجل بالفعل!" : "Email already registered!" };
      }
    }

    const code = "INV" + Math.floor(100000 + Math.random() * 900000).toString();
    const newUser: User = {
      id: "u_" + Date.now(),
      username: email ? email.split("@")[0] : "User_" + phone.slice(-4),
      phone: phone || "",
      email: email || "",
      balance: 5.00,
      todayEarnings: 0,
      totalEarnings: 0,
      vipLevel: 0,
      completedTasksToday: 0,
      totalCompletedTasks: 0,
      invitationCode: code,
      referredBy: trimmedInvite,
      createdAt: new Date().toISOString()
    };

    // Reward inviter with $5.00
    const updatedUsersList = users.map(u => {
      if (u.id === inviter.id) {
        return {
          ...u,
          balance: parseFloat((u.balance + 5.00).toFixed(2))
        };
      }
      return u;
    });

    const newUsersList = [...updatedUsersList, newUser];
    setUsers(newUsersList);
    setCurrentUser(newUser);
    localStorage.setItem("apex_current_user", JSON.stringify(newUser));
    syncState({ users: newUsersList });

    return { success: true };
  };

  // Auth: Logout
  const logout = () => {
    setCurrentUser(null);
    setIsAdminMode(false);
    localStorage.removeItem("apex_current_user");
  };

  // Rate Product task execution
  const rateProduct = (productId: string) => {
    if (!currentUser) return { success: false, commission: 0, error: "Not logged in" };

    const vipTier = vipTiers.find(v => v.level === currentUser.vipLevel);
    if (!vipTier) return { success: false, commission: 0, error: "Invalid VIP Tier" };

    if (currentUser.completedTasksToday >= vipTier.dailyTasks) {
      return { success: false, commission: 0, error: "limit_reached" };
    }

    const product = products.find(p => p.id === productId);
    if (!product) return { success: false, commission: 0, error: "Product not found" };

    const calculatedCommission = vipTier.singleTaskReward !== undefined 
      ? parseFloat(Number(vipTier.singleTaskReward).toFixed(2)) 
      : parseFloat((product.price * vipTier.commissionRate).toFixed(2));

    let updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          balance: parseFloat((u.balance + calculatedCommission).toFixed(2)),
          todayEarnings: parseFloat((u.todayEarnings + calculatedCommission).toFixed(2)),
          totalEarnings: parseFloat((u.totalEarnings + calculatedCommission).toFixed(2)),
          completedTasksToday: u.completedTasksToday + 1,
          totalCompletedTasks: u.totalCompletedTasks + 1
        };
      }
      return u;
    });

    // Credit multi-level referrers
    if (currentUser.referredBy) {
      const l1User = updatedUsers.find(u => u.invitationCode === currentUser.referredBy);
      if (l1User) {
        const l1Reward = parseFloat((calculatedCommission * 0.10).toFixed(3));
        updatedUsers = updatedUsers.map(u => {
          if (u.id === l1User.id) {
            return {
              ...u,
              balance: parseFloat((u.balance + l1Reward).toFixed(2)),
              todayEarnings: parseFloat((u.todayEarnings + l1Reward).toFixed(2)),
              totalEarnings: parseFloat((u.totalEarnings + l1Reward).toFixed(2))
            };
          }
          return u;
        });

        if (l1User.referredBy) {
          const l2User = updatedUsers.find(u => u.invitationCode === l1User.referredBy);
          if (l2User) {
            const l2Reward = parseFloat((calculatedCommission * 0.05).toFixed(3));
            updatedUsers = updatedUsers.map(u => {
              if (u.id === l2User.id) {
                return {
                  ...u,
                  balance: parseFloat((u.balance + l2Reward).toFixed(2)),
                  todayEarnings: parseFloat((u.todayEarnings + l2Reward).toFixed(2)),
                  totalEarnings: parseFloat((u.totalEarnings + l2Reward).toFixed(2))
                };
              }
              return u;
            });

            if (l2User.referredBy) {
              const l3User = updatedUsers.find(u => u.invitationCode === l2User.referredBy);
              if (l3User) {
                const l3Reward = parseFloat((calculatedCommission * 0.02).toFixed(3));
                updatedUsers = updatedUsers.map(u => {
                  if (u.id === l3User.id) {
                    return {
                      ...u,
                      balance: parseFloat((u.balance + l3Reward).toFixed(2)),
                      todayEarnings: parseFloat((u.todayEarnings + l3Reward).toFixed(2)),
                      totalEarnings: parseFloat((u.totalEarnings + l3Reward).toFixed(2))
                    };
                  }
                  return u;
                });
              }
            }
          }
        }
      }
    }

    setUsers(updatedUsers);
    syncState({ users: updatedUsers });

    return { success: true, commission: calculatedCommission };
  };

  // Add Deposit
  const addDeposit = (amount: number, hash: string) => {
    if (!currentUser) return { success: false, error: "Not logged in" };
    if (amount < settings.minDeposit) {
      return { success: false, error: "min_limit" };
    }

    const newDeposit: DepositRequest = {
      id: "dep_" + Date.now(),
      userId: currentUser.id,
      username: currentUser.username,
      phone: currentUser.phone,
      amount,
      status: "pending",
      hash,
      createdAt: new Date().toISOString()
    };

    const updatedDeposits = [newDeposit, ...depositRequests];
    setDepositRequests(updatedDeposits);
    syncState({ depositRequests: updatedDeposits });
    return { success: true };
  };

  // Add Withdrawal
  const addWithdrawal = (amount: number, address: string) => {
    if (!currentUser) return { success: false, error: "Not logged in" };
    if (amount < settings.minWithdraw) {
      return { success: false, error: "min_limit" };
    }
    if (currentUser.balance < amount) {
      return { success: false, error: "insufficient" };
    }

    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          balance: parseFloat((u.balance - amount).toFixed(2))
        };
      }
      return u;
    });

    const newWithdrawal: WithdrawRequest = {
      id: "wth_" + Date.now(),
      userId: currentUser.id,
      username: currentUser.username,
      phone: currentUser.phone,
      amount,
      address,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    const updatedWithdrawals = [newWithdrawal, ...withdrawalRequests];
    setUsers(updatedUsers);
    setWithdrawalRequests(updatedWithdrawals);
    syncState({ users: updatedUsers, withdrawalRequests: updatedWithdrawals });
    return { success: true };
  };

  // Upgrade VIP
  const upgradeVip = (level: number) => {
    if (!currentUser) return { success: false, error: "Not logged in" };
    const targetTier = vipTiers.find(v => v.level === level);
    if (!targetTier) return { success: false, error: "Invalid Level" };

    if (currentUser.balance < targetTier.price) {
      return { success: false, error: "insufficient" };
    }

    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          vipLevel: level,
          balance: parseFloat((u.balance - targetTier.price).toFixed(2))
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    syncState({ users: updatedUsers });
    return { success: true };
  };

  // Update Withdrawal Address
  const updateUserWithdrawalAddress = (address: string) => {
    if (!currentUser) return;
    const updated = users.map(u => {
      if (u.id === currentUser.id) {
        return { ...u, withdrawalAddress: address };
      }
      return u;
    });
    setUsers(updated);
    syncState({ users: updated });
  };

  // Admin approval - Deposit
  const adminApproveDeposit = (depositId: string) => {
    const deposit = depositRequests.find(d => d.id === depositId);
    if (!deposit || deposit.status !== "pending") return;

    let updatedUsers = users.map(u => {
      if (u.id === deposit.userId) {
        return {
          ...u,
          balance: parseFloat((u.balance + deposit.amount).toFixed(2))
        };
      }
      return u;
    });

    const depositor = updatedUsers.find(u => u.id === deposit.userId);
    if (depositor && depositor.referredBy) {
      const referrer = updatedUsers.find(u => u.invitationCode === depositor.referredBy);
      if (referrer) {
        const depBonus = parseFloat((deposit.amount * 0.10).toFixed(2));
        updatedUsers = updatedUsers.map(u => {
          if (u.id === referrer.id) {
            return {
              ...u,
              balance: parseFloat((u.balance + depBonus).toFixed(2)),
              totalEarnings: parseFloat((u.totalEarnings + depBonus).toFixed(2))
            };
          }
          return u;
        });
      }
    }

    const updatedDeposits = depositRequests.map(d => d.id === depositId ? { ...d, status: "approved" as const } : d);
    setUsers(updatedUsers);
    setDepositRequests(updatedDeposits);
    syncState({ users: updatedUsers, depositRequests: updatedDeposits });
  };

  const adminRejectDeposit = (depositId: string) => {
    const updatedDeposits = depositRequests.map(d => d.id === depositId ? { ...d, status: "rejected" as const } : d);
    setDepositRequests(updatedDeposits);
    syncState({ depositRequests: updatedDeposits });
  };

  // Admin approval - Withdrawal
  const adminApproveWithdrawal = (withdrawalId: string) => {
    const updatedWithdrawals = withdrawalRequests.map(w => w.id === withdrawalId ? { ...w, status: "approved" as const } : w);
    setWithdrawalRequests(updatedWithdrawals);
    syncState({ withdrawalRequests: updatedWithdrawals });
  };

  const adminRejectWithdrawal = (withdrawalId: string) => {
    const withdrawal = withdrawalRequests.find(w => w.id === withdrawalId);
    if (!withdrawal || withdrawal.status !== "pending") return;

    const updatedUsers = users.map(u => {
      if (u.id === withdrawal.userId) {
        return {
          ...u,
          balance: parseFloat((u.balance + withdrawal.amount).toFixed(2))
        };
      }
      return u;
    });

    const updatedWithdrawals = withdrawalRequests.map(w => w.id === withdrawalId ? { ...w, status: "rejected" as const } : w);
    setUsers(updatedUsers);
    setWithdrawalRequests(updatedWithdrawals);
    syncState({ users: updatedUsers, withdrawalRequests: updatedWithdrawals });
  };

  // Admin user direct modifications
  const adminUpdateUser = (userId: string, fields: Partial<User>) => {
    const updated = users.map(u => u.id === userId ? { ...u, ...fields } : u);
    setUsers(updated);
    syncState({ users: updated });
  };

  const adminDeleteUser = (userId: string) => {
    const updated = users.filter(u => u.id !== userId);
    setUsers(updated);
    syncState({ users: updated });
  };

  // Admin Update Settings
  const adminUpdateSettings = (fields: Partial<AppSettings>) => {
    const updated = { ...settings, ...fields };
    setSettings(updated);
    syncState({ settings: updated });
  };

  // Dynamic calculation of referral statistics
  const getTeamReport = (userId: string): TeamReport => {
    const user = users.find(u => u.id === userId);
    if (!user) {
      return {
        level1Count: 0, level2Count: 0, level3Count: 0,
        level1Deposit: 0, level2Deposit: 0, level3Deposit: 0,
        level1Commission: 0, level2Commission: 0, level3Commission: 0
      };
    }

    const level1 = users.filter(u => u.referredBy === user.invitationCode);
    const l1Ids = level1.map(u => u.id);

    const level2 = users.filter(u => u.referredBy && level1.some(l1 => l1.invitationCode === u.referredBy));
    const l2Ids = level2.map(u => u.id);

    const level3 = users.filter(u => u.referredBy && level2.some(l2 => l2.invitationCode === u.referredBy));
    const l3Ids = level3.map(u => u.id);

    const getDepositSum = (userIds: string[]) => {
      return depositRequests
        .filter(d => userIds.includes(d.userId) && d.status === "approved")
        .reduce((sum, d) => sum + d.amount, 0);
    };

    const l1Deposit = getDepositSum(l1Ids);
    const l2Deposit = getDepositSum(l2Ids);
    const l3Deposit = getDepositSum(l3Ids);

    const getCommissionSum = (subordinates: User[], multiplier: number) => {
      return subordinates.reduce((sum, u) => sum + (u.totalEarnings * multiplier), 0);
    };

    const l1Commission = parseFloat(getCommissionSum(level1, 0.10).toFixed(2));
    const l2Commission = parseFloat(getCommissionSum(level2, 0.05).toFixed(2));
    const l3Commission = parseFloat(getCommissionSum(level3, 0.02).toFixed(2));

    return {
      level1Count: level1.length,
      level2Count: level2.length,
      level3Count: level3.length,
      level1Deposit: l1Deposit,
      level2Deposit: l2Deposit,
      level3Deposit: l3Deposit,
      level1Commission: l1Commission,
      level2Commission: l2Commission,
      level3Commission: l3Commission
    };
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        currentUser,
        users,
        settings,
        depositRequests,
        withdrawalRequests,
        login,
        register,
        logout,
        rateProduct,
        addDeposit,
        addWithdrawal,
        upgradeVip,
        updateUserWithdrawalAddress,
        vipTiers,
        products,
        adminAddVipTier,
        adminUpdateVipTier,
        adminDeleteVipTier,
        adminAddProduct,
        adminUpdateProduct,
        adminDeleteProduct,
        isAdminMode,
        setIsAdminMode,
        adminApproveDeposit,
        adminRejectDeposit,
        adminApproveWithdrawal,
        adminRejectWithdrawal,
        adminUpdateUser,
        adminDeleteUser,
        adminUpdateSettings,
        getTeamReport
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
