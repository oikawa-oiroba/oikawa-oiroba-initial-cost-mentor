import { useState, useEffect } from "react";

export const useRentalForm = () => {
  const [mode, setMode] = useState<"simple" | "detailed">("simple");
  const [propertyName, setPropertyName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [propertyUrl, setPropertyUrl] = useState("");
  const [rent, setRent] = useState("");
  const [managementFee, setManagementFee] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [sanitationFee, setSanitationFee] = useState("16500");
  const [supportFee, setSupportFee] = useState("16500");
  const [contractFee, setContractFee] = useState("5500");
  const [hasInsuranceFee, setHasInsuranceFee] = useState(true);
  const [hasKeyExchangeFee, setHasKeyExchangeFee] = useState(true);
  const [hasCleaningFee, setHasCleaningFee] = useState(true);
  const [insuranceFeeAmount, setInsuranceFeeAmount] = useState("20000");
  const [keyExchangeFeeAmount, setKeyExchangeFeeAmount] = useState("20000");
  const [cleaningFeeAmount, setCleaningFeeAmount] = useState("66000");
  const [otherFee1Name, setOtherFee1Name] = useState("防災セット");
  const [otherFee1Amount, setOtherFee1Amount] = useState("6600");
  const [otherFee2Name, setOtherFee2Name] = useState("害虫駆除");
  const [otherFee2Amount, setOtherFee2Amount] = useState("11000");
  const [hasOtherFee1, setHasOtherFee1] = useState(false);
  const [hasOtherFee2, setHasOtherFee2] = useState(false);
  const [depositMonths, setDepositMonths] = useState("1");
  const [customDeposit, setCustomDeposit] = useState("");
  const [keyMoneyMonths, setKeyMoneyMonths] = useState("1");
  const [customKeyMoney, setCustomKeyMoney] = useState("");
  const [guaranteeFeeRate, setGuaranteeFeeRate] = useState("0.5");
  const [customGuaranteeFeeRate, setCustomGuaranteeFeeRate] = useState("");
  const [agencyFeeType, setAgencyFeeType] = useState("1.1");
  const [customAgencyFee, setCustomAgencyFee] = useState("");
  const [hasRentFree, setHasRentFree] = useState(false);
  const [rentFreeMonths, setRentFreeMonths] = useState("1");

  useEffect(() => {
    const depositValue = parseFloat(depositMonths);
    setHasCleaningFee(depositValue < 1);
  }, [depositMonths]);

  return {
    mode, setMode,
    propertyName, setPropertyName,
    roomNumber, setRoomNumber,
    propertyUrl, setPropertyUrl,
    rent, setRent,
    managementFee, setManagementFee,
    moveInDate, setMoveInDate,
    sanitationFee, setSanitationFee,
    supportFee, setSupportFee,
    contractFee, setContractFee,
    hasInsuranceFee, setHasInsuranceFee,
    hasKeyExchangeFee, setHasKeyExchangeFee,
    hasCleaningFee, setHasCleaningFee,
    insuranceFeeAmount, setInsuranceFeeAmount,
    keyExchangeFeeAmount, setKeyExchangeFeeAmount,
    cleaningFeeAmount, setCleaningFeeAmount,
    otherFee1Name, setOtherFee1Name,
    otherFee1Amount, setOtherFee1Amount,
    otherFee2Name, setOtherFee2Name,
    otherFee2Amount, setOtherFee2Amount,
    hasOtherFee1, setHasOtherFee1,
    hasOtherFee2, setHasOtherFee2,
    depositMonths, setDepositMonths,
    customDeposit, setCustomDeposit,
    keyMoneyMonths, setKeyMoneyMonths,
    customKeyMoney, setCustomKeyMoney,
    guaranteeFeeRate, setGuaranteeFeeRate,
    customGuaranteeFeeRate, setCustomGuaranteeFeeRate,
    agencyFeeType, setAgencyFeeType,
    customAgencyFee, setCustomAgencyFee,
    hasRentFree, setHasRentFree,
    rentFreeMonths, setRentFreeMonths,
  };
};
