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
  insuranceFee: number;
  keyExchangeFee: number;
  cleaningFee: number;
  supportFee: number;
  hasDisinfection: boolean;
  disinfectionFee: number;
  hasContractFee: boolean;
  contractFee: number;
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
  moveInDate: string;
  daysInMonth: number;
  remainingDays: number;
  startDate: string;
  endDate: string;
  nextMonthStart: string;
  nextMonthEnd: string;
}

export const calculateAgencyFee = (rent: number, type: string, customAmount?: number): number => {
  if (type === "0") return 0;
  if (type === "1.1") return Math.floor(rent * 1.1);
  if (type === "0.55") return Math.floor(rent * 0.5 * 1.1);
  if (type === "118000") return Math.floor(118000 * 1.1); // 税別118,000円 → 税込
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
  const startDate = `${month + 1}/${pad(day)}`;
  const endDate = `${month + 1}/${pad(daysInMonth)}`;
  const nextMonthStart = `${month + 2 > 12 ? 1 : month + 2}/01`;
  const nextMonthEnd = `${month + 2 > 12 ? 1 : month + 2}/${pad(new Date(year, month + 2, 0).getDate())}`;

  return { prorationRent, prorationMgmt, moveInDate, daysInMonth, remainingDays, startDate, endDate, nextMonthStart, nextMonthEnd };
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

  const contractTotal = deposit + keyMoney + agencyFee + guaranteeFee;
  const optionTotal = input.insuranceFee + input.keyExchangeFee + input.cleaningFee + input.supportFee
    + (input.hasDisinfection ? input.disinfectionFee : 0)
    + (input.hasContractFee ? input.contractFee : 0);
  const firstMonthTotal = prorationRent + prorationMgmt + rent + managementFee - rentFreeDiscount;
  const total = contractTotal + optionTotal + firstMonthTotal;

  return {
    items: {
      deposit: { label: "敷金", amount: deposit, category: "contract" },
      keyMoney: { label: "礼金", amount: keyMoney, category: "contract" },
      agencyFee: { label: "仲介手数料", amount: agencyFee, category: "contract" },
      guaranteeFee: { label: "保証会社費用（初回）", amount: guaranteeFee, category: "contract" },
      insuranceFee: { label: "火災保険料", amount: input.insuranceFee, category: "option" },
      keyExchangeFee: { label: "鍵交換費用", amount: input.keyExchangeFee, category: "option" },
      cleaningFee: { label: "退去時クリーニング", amount: input.cleaningFee, category: "option" },
      supportFee: { label: "24時間サポート", amount: input.supportFee, category: "option" },
      ...(input.hasDisinfection ? { disinfectionFee: { label: "室内除菌抗菌", amount: input.disinfectionFee, category: "option" } } : {}),
      ...(input.hasContractFee ? { contractFee: { label: "契約事務手数料", amount: input.contractFee, category: "option" } } : {}),
      prorationRent: { label: `日割家賃（${prorationInfo ? `${prorationInfo.startDate}〜${prorationInfo.endDate} ${prorationInfo.remainingDays}日間/${prorationInfo.daysInMonth}日` : ""}）`, amount: prorationRent, category: "firstMonth" },
      prorationMgmt: { label: "日割管理費", amount: prorationMgmt, category: "firstMonth" },
      nextRent: { label: `翌月分家賃（${prorationInfo ? `${prorationInfo.nextMonthStart}〜${prorationInfo.nextMonthEnd}` : ""}）`, amount: rent, category: "firstMonth" },
      nextMgmt: { label: "翌月分管理費", amount: managementFee, category: "firstMonth" },
      ...(input.hasRentFree ? { rentFree: { label: "フリーレント割引", amount: -rentFreeDiscount, category: "firstMonth" } } : {}),
    },
    subtotals: { contract: contractTotal, option: optionTotal, firstMonth: firstMonthTotal },
    prorationInfo,
    total,
  };
};

export const calculateMonthlyTotal = (rent: number, managementFee: number, monthly: MonthlyInput): number => {
  let guaranteeMonthly = 0;
  if (monthly.guaranteeMonthlyRate > 0) {
    guaranteeMonthly = Math.floor((rent + managementFee) * (monthly.guaranteeMonthlyRate / 100));
  } else {
    guaranteeMonthly = monthly.guaranteeMonthlyFixed;
  }
  return rent + managementFee + guaranteeMonthly + monthly.insuranceMonthly + monthly.supportMonthly + monthly.townFee + monthly.otherMonthlyFee;
};
