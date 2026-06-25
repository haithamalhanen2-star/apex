export type Language = "ar" | "en";

export interface AppSettings {
  appName: string;
  usdtAddress: string;
  supportTelegram: string;
  supportWhatsApp: string;
  minDeposit: number;
  minWithdraw: number;
  webhookUrl?: string;
}

export interface User {
  id: string;
  username: string;
  phone: string;
  email: string;
  balance: number;
  todayEarnings: number;
  totalEarnings: number;
  vipLevel: number; // 0, 1, 2, 3, 4, 5
  completedTasksToday: number;
  totalCompletedTasks: number;
  invitationCode: string;
  referredBy?: string;
  createdAt: string;
  isAdmin?: boolean;
  withdrawalAddress?: string;
  lastTaskResetTime?: string;
}

export interface VipTier {
  level: number;
  name: string;
  price: number;
  dailyTasks: number;
  commissionRate: number; // e.g. 0.015 (1.5%)
  minBalanceRequired: number;
  icon: string;
  color: string;
  bgGradient: string;
  singleTaskReward?: number; // Direct reward/price per single task
}

export interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
  rating: number;
  image: string;
  category: string;
  commission: number;
}

export interface DepositRequest {
  id: string;
  userId: string;
  username: string;
  phone: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  hash: string;
  createdAt: string;
}

export interface WithdrawRequest {
  id: string;
  userId: string;
  username: string;
  phone: string;
  amount: number;
  address: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface TeamReport {
  level1Count: number;
  level2Count: number;
  level3Count: number;
  level1Deposit: number;
  level2Deposit: number;
  level3Deposit: number;
  level1Commission: number;
  level2Commission: number;
  level3Commission: number;
}
