export const calculateDeposit = (rent: number, monthsMultiplier: number): number => {
  return rent * monthsMultiplier;
};

export const calculateKeyMoney = (rent: number, monthsMultiplier: number): number => {
  return rent * monthsMultiplier;
};

export const calculateAgencyFee = (rent: number, type: string, customAmount?: number): number => {
  if (type === "0") return 0;
  if (type === "1.1") return Math.floor(rent * 1.1);
  if (type === "0.55") return Math.floor(rent * 0.5 * 1.1);
  if (type === "68000") return Math.floor(68000 * 1.1);
  if (type === "custom" && customAmount) return Math.floor(customAmount * 1.1);
  return 0;
};

export const calculateGuaranteeFee = (rent: number, managementFee: number, rate: number): number => {
  return Math.floor((rent + managementFee) * rate);
};

export const calculateRentFreeDiscount = (rent: number, months: number, hasRentFree: boolean): number => {
  if (!hasRentFree) return 0;
  return rent * months;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
};

interface OptionalFeesConfig {
  hasInsuranceFee: boolean;
  hasKeyExchangeFee: boolean;
  hasCleaningFee: boolean;
  insuranceFeeAmount?: string;
  keyExchangeFeeAmount?: string;
  cleaningFeeAmount?: string;
  otherFees?: Array<{ name: string; amount: number }>;
}

export const calculateCostBreakdown = (
  rent: number,
  managementFee: number,
  moveInDate: string,
  sanitationFee: number,
  supportFee: number,
  contractFee: number,
  depositMonths: number,
  keyMoneyMonths: number,
  agencyFeeType: string,
  customAgencyFee?: number,
  guaranteeFeeRate: number = 0.5,
  hasRentFree: boolean = false,
  rentFreeMonths: number = 0,
  optionalFees: OptionalFeesConfig = {
    hasInsuranceFee: true,
    hasKeyExchangeFee: true,
    hasCleaningFee: true,
    insuranceFeeAmount: "20000",
    keyExchangeFeeAmount: "20000",
    cleaningFeeAmount: "66000",
    otherFees: []
  }
) => {
  const rentAmount = parseFloat(rent.toString());
  const managementAmount = parseFloat(managementFee.toString() || "0");

  const deposit = calculateDeposit(rentAmount, depositMonths);
  const keyMoney = calculateKeyMoney(rentAmount, keyMoneyMonths);
  const agencyFee = calculateAgencyFee(rentAmount, agencyFeeType, customAgencyFee);
  const guaranteeFee = calculateGuaranteeFee(rentAmount, managementAmount, guaranteeFeeRate);

  const insuranceFee = optionalFees.hasInsuranceFee ? parseFloat(optionalFees.insuranceFeeAmount || "20000") : 0;
  const keyExchangeFee = optionalFees.hasKeyExchangeFee ? parseFloat(optionalFees.keyExchangeFeeAmount || "20000") : 0;
  const cleaningFee = optionalFees.hasCleaningFee ? parseFloat(optionalFees.cleaningFeeAmount || "66000") : 0;
  const otherFeesTotal = (optionalFees.otherFees || []).reduce((sum, fee) => sum + fee.amount, 0);

  const moveIn = new Date(moveInDate);
  const daysInMonth = new Date(moveIn.getFullYear(), moveIn.getMonth() + 1, 0).getDate();
  const remainingDays = daysInMonth - moveIn.getDate() + 1;
  const prorationRent = Math.floor((rentAmount / daysInMonth) * remainingDays);
  const prorationManagementFee = Math.floor((managementAmount / daysInMonth) * remainingDays);

  const rentFreeDiscount = calculateRentFreeDiscount(rentAmount, rentFreeMonths, hasRentFree);

  const basicTotal = deposit + keyMoney + guaranteeFee + agencyFee;
  const optionalTotal = insuranceFee + keyExchangeFee + cleaningFee + sanitationFee + supportFee + contractFee + otherFeesTotal;
  const firstMonthTotal = prorationRent + prorationManagementFee + rentAmount + managementAmount - rentFreeDiscount;
  const total = basicTotal + optionalTotal + firstMonthTotal;

  return {
    costs: {
      deposit: { label: "敷金", amount: deposit, category: "basic" },
      keyMoney: { label: "礼金", amount: keyMoney, category: "basic" },
      agencyFee: { label: "仲介手数料", amount: agencyFee, category: "basic" },
      guaranteeFee: { label: "保証会社費用", amount: guaranteeFee, category: "basic" },
      insuranceFee: { label: "火災保険料", amount: insuranceFee, category: "optional" },
      keyExchangeFee: { label: "鍵交換費用", amount: keyExchangeFee, category: "optional" },
      cleaningFee: { label: "退去時清掃費用", amount: cleaningFee, category: "optional" },
      sanitationFee: { label: "室内除菌費用", amount: sanitationFee, category: "optional" },
      supportFee: { label: "24時間サポート費用", amount: supportFee, category: "optional" },
      contractFee: { label: "契約事務手数料", amount: contractFee, category: "optional" },
      ...(optionalFees.otherFees || []).reduce((acc, fee) => ({
        ...acc,
        [fee.name]: { label: fee.name, amount: fee.amount, category: "optional" }
      }), {}),
      prorationRent: { label: "日割家賃", amount: prorationRent, category: "firstMonth" },
      prorationManagementFee: { label: "日割管理費", amount: prorationManagementFee, category: "firstMonth" },
      nextMonthRent: { label: "翌月分家賃", amount: rentAmount, category: "firstMonth" },
      nextMonthManagementFee: { label: "翌月分管理費", amount: managementAmount, category: "firstMonth" },
      rentFreeDiscount: { label: "フリーレント割引", amount: -rentFreeDiscount, category: "firstMonth" },
    },
    subtotals: { basic: basicTotal, optional: optionalTotal, firstMonth: firstMonthTotal },
    total,
  };
};
