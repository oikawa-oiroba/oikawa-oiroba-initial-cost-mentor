export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
};

export interface InitialCostInput {
  rent: number;
  managementFee: number;
  depositMonths: number;
  keyMoneyMonths: number;
  agencyFeeType: string;
  customAgencyFee?: number;
  guaranteeFeeType: string;
  guaranteeFeeRate?: number;
  guaranteeFeeFixed?: number;
  hasInsurance: boolean;
  insuranceFee: number;
  hasKeyExchange: boolean;
  keyExchangeFee: number;
  hasCleaning: boolean;
  cleaningFee: number;
  hasAcCleaning: boolean;
  acCleaningFee: number;
  hasSupport: boolean;
  supportFee: number;
  supportFeeName: string;
  hasDisinfection: boolean;
  disinfectionFee: number;
  hasContractFee: boolean;
  contractFee: number;
  extraItems: Array<{ name: string; amount: number; enabled: boolean }>;
  moveInDate: string;
  hasRentFree: boolean;
  rentFreeMonths: number;
}

export interface MonthlyInput {
  guaranteeMonthlyRate: number;
  guaranteeMonthlyFixed: number;
  insuranceMonthly: number;
  supportMonthly: number;
  townFee: number;
  otherMonthlyName: string;
  otherMonthlyFee: number;
}

export interface ProrationInfo {
  prorationRent: number;
  prorationMgmt: number;
  daysInMonth: number;
  remainingDays: number;
  startDate: string;
  endDate: string;
  nextMonthStart: string;
  nextMonthEnd: string;
}

export const getDefaultMoveInDate = (): string => {
  return getNextSaturday(21);
};

// 3週間後の土曜日を返す
const getNextSaturday = (minDaysFromNow: number): string => {
  const today = new Date();
  const target = new Date(today);
  target.setDate(today.getDate() + minDaysFromNow);
  const day = target.getDay();
  const daysToSat = day === 6 ? 0 : (6 - day);
  target.setDate(target.getDate() + daysToSat);
  return target.toISOString().split('T')[0];
};

// 過去日付・今日の場合は3週間後の土曜日に補正
export const ensureFutureDate = (dateStr: string): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  if (isNaN(date.getTime()) || date <= today) {
    return getNextSaturday(21);
  }
  return dateStr;
};

export const calculateAgencyFee = (rent: number, type: string, customAmount?: number): number => {
  if (type === "0") return 0;
  if (type === "1.1") return Math.floor(rent * 1.1);
  if (type === "0.55") return Math.floor(rent * 0.5 * 1.1);
  if (type === "118000") return Math.floor(118000 * 1.1);
  if (type === "custom" && customAmount) return customAmount;
  return 0;
};

export const calculateProration = (rent: number, managementFee: number, moveInDate: string): ProrationInfo => {
  const moveIn = new Date(moveInDate);
  const year = moveIn.getFullYear();
  const month = moveIn.getMonth();
  const day = moveIn.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const remainingDays = daysInMonth - day + 1;
  const prorationRent = Math.floor((rent / daysInMonth) * remainingDays);
  const prorationMgmt = Math.floor((managementFee / daysInMonth) * remainingDays);
  const pad = (n: number) => String(n).padStart(2, '0');
  const m = month + 1;
  const nm = month + 2 > 12 ? 1 : month + 2;
  const ny = month + 2 > 12 ? year + 1 : year;
  const nmDays = new Date(ny, nm, 0).getDate();
  return {
    prorationRent, prorationMgmt, daysInMonth, remainingDays,
    startDate: `${m}/${pad(day)}`,
    endDate: `${m}/${pad(daysInMonth)}`,
    nextMonthStart: `${nm}/01`,
    nextMonthEnd: `${nm}/${pad(nmDays)}`,
  };
};

export const calculateInitialCost = (input: InitialCostInput) => {
  const { rent, managementFee } = input;
  const deposit = rent * input.depositMonths;
  const keyMoney = rent * input.keyMoneyMonths;
  const agencyFee = calculateAgencyFee(rent, input.agencyFeeType, input.customAgencyFee);

  let guaranteeFee = 0;
  if (input.guaranteeFeeType === "rate" && input.guaranteeFeeRate) {
    guaranteeFee = Math.floor((rent + managementFee) * (input.guaranteeFeeRate / 100));
  } else if (input.guaranteeFeeType === "fixed" && input.guaranteeFeeFixed) {
    guaranteeFee = input.guaranteeFeeFixed;
  }

  let prorationRent = 0;
  let prorationMgmt = 0;
  let prorationInfo: ProrationInfo | null = null;
  if (input.moveInDate) {
    prorationInfo = calculateProration(rent, managementFee, input.moveInDate);
    prorationRent = prorationInfo.prorationRent;
    prorationMgmt = prorationInfo.prorationMgmt;
  }

  const rentFreeDiscount = input.hasRentFree ? rent * input.rentFreeMonths : 0;

  const insuranceFee = input.hasInsurance ? input.insuranceFee : 0;
  const keyExchangeFee = input.hasKeyExchange ? input.keyExchangeFee : 0;
  const cleaningFee = input.hasCleaning ? input.cleaningFee : 0;
  const acCleaningFee = input.hasAcCleaning ? input.acCleaningFee : 0;
  const supportFee = input.hasSupport ? input.supportFee : 0;
  const disinfectionFee = input.hasDisinfection ? input.disinfectionFee : 0;
  const contractFee = input.hasContractFee ? input.contractFee : 0;
  const extraTotal = input.extraItems.filter(e => e.enabled && e.name && e.amount > 0).reduce((s, e) => s + e.amount, 0);

  const contractTotal = deposit + keyMoney + agencyFee + guaranteeFee;
  const optionTotal = insuranceFee + keyExchangeFee + supportFee + disinfectionFee + contractFee + extraTotal;
  const cleaningTotal = cleaningFee + acCleaningFee;
  const firstMonthTotal = prorationRent + prorationMgmt + rent + managementFee - rentFreeDiscount;
  const total = contractTotal + optionTotal + cleaningTotal + firstMonthTotal;

  const extraItems: Record<string, any> = {};
  input.extraItems.filter(e => e.enabled && e.name && e.amount > 0).forEach((e, i) => {
    extraItems[`extra_${i}`] = { label: e.name, amount: e.amount, category: "option" };
  });

  return {
    items: {
      deposit: { label: "敷金", amount: deposit, category: "contract" },
      keyMoney: { label: "礼金", amount: keyMoney, category: "contract" },
      agencyFee: { label: "仲介手数料", amount: agencyFee, category: "contract" },
      guaranteeFee: {
        label: "保証会社費用（初回）" + (input.guaranteeFeeType === "rate" && input.guaranteeFeeRate ? ` ${input.guaranteeFeeRate}%` : ""),
        amount: guaranteeFee, category: "contract"
      },
      ...(input.hasInsurance ? { insuranceFee: { label: "火災保険料", amount: insuranceFee, category: "option" } } : {}),
      ...(input.hasKeyExchange ? { keyExchangeFee: { label: "鍵交換費用", amount: keyExchangeFee, category: "option" } } : {}),
      ...(input.hasCleaning ? { cleaningFee: { label: "退去時クリーニング", amount: cleaningFee, category: "cleaning" } } : {}),
      ...(input.hasAcCleaning ? { acCleaningFee: { label: "エアコン洗浄", amount: acCleaningFee, category: "cleaning" } } : {}),
      ...(input.hasSupport ? { supportFee: { label: input.supportFeeName || "24時間サポート", amount: supportFee, category: "option" } } : {}),
      ...(input.hasDisinfection ? { disinfectionFee: { label: "室内除菌抗菌", amount: disinfectionFee, category: "option" } } : {}),
      ...(input.hasContractFee ? { contractFee: { label: "契約事務手数料", amount: contractFee, category: "option" } } : {}),
      ...extraItems,
      ...(prorationRent > 0 ? { prorationRent: { label: `日割家賃（${prorationInfo ? `${prorationInfo.startDate}〜${prorationInfo.endDate} ${prorationInfo.remainingDays}日間/${prorationInfo.daysInMonth}日` : ""}）`, amount: prorationRent, category: "firstMonth" } } : {}),
      ...(prorationMgmt > 0 ? { prorationMgmt: { label: "日割管理費", amount: prorationMgmt, category: "firstMonth" } } : {}),
      nextRent: { label: `翌月分家賃（${prorationInfo ? `${prorationInfo.nextMonthStart}〜${prorationInfo.nextMonthEnd}` : ""}）`, amount: rent, category: "firstMonth" },
      ...(managementFee > 0 ? { nextMgmt: { label: "翌月分管理費", amount: managementFee, category: "firstMonth" } } : {}),
      ...(input.hasRentFree ? { rentFree: { label: "フリーレント割引", amount: -rentFreeDiscount, category: "firstMonth" } } : {}),
    },
    subtotals: { contract: contractTotal, option: optionTotal, cleaning: cleaningTotal, firstMonth: firstMonthTotal },
    prorationInfo,
    total,
  };
};

export const calculateMonthlyTotal = (rent: number, managementFee: number, monthly: MonthlyInput): number => {
  let guaranteeMonthly = monthly.guaranteeMonthlyRate > 0
    ? Math.floor((rent + managementFee) * (monthly.guaranteeMonthlyRate / 100))
    : monthly.guaranteeMonthlyFixed;
  return rent + managementFee + guaranteeMonthly + monthly.insuranceMonthly + monthly.supportMonthly + monthly.townFee + monthly.otherMonthlyFee;
};
