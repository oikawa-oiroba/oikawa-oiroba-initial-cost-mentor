const DAILY_LIMIT = 5;
const STORAGE_KEY = "gemini_usage";
const TOKEN_KEY = "gemini_unlock_token";

interface UsageData {
  date: string;
  count: number;
}

const getToday = (): string => new Date().toISOString().split("T")[0];

export const getUsageData = (): UsageData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: getToday(), count: 0 };
    const data: UsageData = JSON.parse(raw);
    if (data.date !== getToday()) return { date: getToday(), count: 0 };
    return data;
  } catch {
    return { date: getToday(), count: 0 };
  }
};

export const incrementUsage = (): void => {
  const data = getUsageData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: getToday(), count: data.count + 1 }));
};

export const isUnlocked = (): boolean => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    const decoded = JSON.parse(atob(token));
    if (!decoded.valid || decoded.exp < Date.now()) {
      localStorage.removeItem(TOKEN_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export const getRemainingCount = (): number => {
  if (isUnlocked()) return Infinity;
  const data = getUsageData();
  return Math.max(0, DAILY_LIMIT - data.count);
};

export const canUseApi = (): boolean => {
  if (isUnlocked()) return true;
  return getUsageData().count < DAILY_LIMIT;
};

// サーバーサイドでキーを検証してトークンを取得
export const verifyUnlockKey = async (key: string): Promise<boolean> => {
  try {
    const res = await fetch("/api/verify-unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    const data = await res.json();
    if (data.ok && data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

export const removeUnlockToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};
