export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
};

export interface InitialCostInput {
  rent: number;
  managementFee: number;
  // 契約金
  depositMonths: number;
  keyMoneyMonths: number;
  agencyFeeType: string;
  customAgencyFee?: number;
  guaranteeFeeType: string; // "rate" | "fixed"
  guaranteeFeeRate?: number; // %
  guaranteeFeeFixed?: number; // 円
  // 初回費用
  insuranceFee: number;
  keyExchangeFee: number;
  cleaningFee: number;
  supportFee: number;
  // その他トグル
  hasDisinfection: boolean;
  disinfectionFee: number;
  hasContractFee: boolean;
  contractFee: number;
  // 日割り
  moveInDate: string;
  // フリーレント
  hasRentFree: boolean;
  rentFreeMonths: number;
}

export interface MonthlyInput {
  guaranteeMonthlyRate: number; // %
  guaranteeMonthlyFixed: number;
  insuranceMonthly: number;
  supportMonthly: number;
  townFee: number;
  otherMonthlyName: string;
  otherMonthlyFee: number;
}

export const calculateAgencyFee = (rent: number, type: string, customAmount?: number): number => {
  if (type === "0") return 0;
  if (type === "1.1") return Math.floor(rent * 1.1);
  if (type === "0.55") return Math.floor(rent * 0.5 * 1.1);
  if (type === "118000") return Math.floor(118000);
  if (type === "custom" && customAmount) return customAmount;
  return 0;
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

  // 日割り家賃
  let prorationRent = 0;
  let prorationMgmt = 0;
  if (input.moveInDate) {
    const moveIn = new Date(input.moveInDate);
    const daysInMonth = new Date(moveIn.getFullYear(), moveIn.getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - moveIn.getDate() + 1;
    prorationRent = Math.floor((rent / daysInMonth) * remainingDays);
    prorationMgmt = Math.floor((managementFee / daysInMonth) * remainingDays);
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
      prorationRent: { label: "日割家賃", amount: prorationRent, category: "firstMonth" },
      prorationMgmt: { label: "日割管理費", amount: prorationMgmt, category: "firstMonth" },
      nextRent: { label: "翌月分家賃", amount: rent, category: "firstMonth" },
      nextMgmt: { label: "翌月分管理費", amount: managementFee, category: "firstMonth" },
      ...(input.hasRentFree ? { rentFree: { label: "フリーレント割引", amount: -rentFreeDiscount, category: "firstMonth" } } : {}),
    },
    subtotals: { contract: contractTotal, option: optionTotal, firstMonth: firstMonthTotal },
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
