export interface ExtraItem {
  name: string;
  amount: number;
}

export interface EvidenceItem {
  text: string;       // 図面上の文言
  source: "detected" | "estimated" | "default"; // detected=図面から取得, estimated=推定, default=デフォルト値
}

export interface ExtractedPropertyData {
  rent?: string;
  managementFee?: string;
  depositMonths?: string;
  keyMoneyMonths?: string;
  propertyName?: string;
  roomNumber?: string;
  propertyAddress?: string;
  agencyFeeType?: string;
  customAgencyFee?: string;
  guaranteeFeeType?: string;
  guaranteeFeeRate?: string;
  guaranteeFeeFixed?: string;
  availableDate?: string;
  insuranceFee?: string;
  keyExchangeFee?: string;
  cleaningFee?: string;
  acCleaningFee?: string;
  supportFee?: string;
  supportFeeName?: string;
  hasDisinfection?: boolean;
  disinfectionFee?: string;
  hasContractFee?: boolean;
  contractFee?: string;
  extraItems?: ExtraItem[];
  guaranteeMonthlyRate?: string;
  insuranceMonthly?: string;
  supportMonthly?: string;
  adRate?: number;
  exclusiveArea?: string;
  renewalFeeRate?: string;
  renewalAdminFeeRate?: string;
  guaranteeRenewalFee?: string;
  insuranceRenewalFee?: string;
  supportRenewalFee?: string;
  evidence?: Record<string, EvidenceItem>;
  warnings?: string[];
}

export const extractPropertyDataFromImage = async (
  base64Image: string,
  mimeType: string,
  apiKey: string
): Promise<ExtractedPropertyData> => {
  const lines = [
    "あなたは不動産の募集図面から情報を抽出する専門家です。",
    "以下の募集図面から情報を読み取り、JSONのみで回答してください。",
    "",
    "抽出項目:",
    "rent: 家賃(円、数値のみ)",
    "managementFee: 管理費・共益費(円、数値のみ。なければ0)",
    "depositMonths: 敷金(ヶ月数の数値のみ。なしなら0)",
    "keyMoneyMonths: 礼金(ヶ月数の数値のみ。なしなら0)",
    "propertyName: 物件名(建物名・マンション名)",
    "roomNumber: 部屋番号(号室の数字のみ)",
    "propertyAddress: 所在地・住所(図面の「所在地」「住所」「所在」欄から都道府県+市区町村+番地を抽出)",
    "agencyFeeType: 仲介手数料の種類(後述のルールで判定)",
    "customAgencyFee: agencyFeeTypeがcustomの場合の税込金額(数値のみ)",
    "guaranteeFeeType: 保証会社費用の種類(rate=料率 / fixed=固定金額)",
    "guaranteeFeeRate: 料率の場合の%(数値のみ 例:50)",
    "guaranteeFeeFixed: 固定金額の場合の円(数値のみ)",
    "availableDate: 入居可能日・入居時期(YYYY-MM-DD形式。即入居可・即時の場合は今日の日付。記載なければnull)",
    "adRate: 広告料・AD・業務委託料・業務委託補助手数料の%数値。これら以外の表記はADとみなさない(数値のみ。なければnull)",
    "insuranceFee: 火災保険料(円、数値のみ。記載があれば金額、なければnull)",
    "keyExchangeFee: 鍵交換費用(円、数値のみ。記載があれば金額、なければnull)",
    "cleaningFee: 退去時クリーニング・ハウスクリーニング費用(円、数値のみ。記載があれば金額、なければnull)",
    "acCleaningFee: エアコン洗浄・エアコンクリーニング費用(円、数値のみ。記載があれば金額、なければnull)",
    "supportFee: 24時間サポート・ホームメイト24・緊急駆けつけ・トラブルサポートなど(円、数値のみ。記載があれば金額、なければnull)",
    "supportFeeName: supportFeeの図面上の正確な項目名(例:「ホームメイスター24」「トラブルサポート24」など)",
    "hasDisinfection: 室内除菌・抗菌施工・光触媒コーティングの記載があればtrue",
    "disinfectionFee: 室内除菌費用(円、数値のみ)",
    "hasContractFee: 契約事務手数料の記載があればtrue",
    "contractFee: 契約事務手数料(円、数値のみ)",
    "extraItems: 上記以外の特殊費用の配列。SAT119・消火剤・害虫駆除・その他オプションなど。各要素は{name:項目名, amount:円数値}形式",
    "guaranteeMonthlyRate: 保証会社の月額料率%(数値のみ。「月額1%」「毎月1%」などの記載があれば抽出。なければnull)",
    "insuranceMonthly: 火災保険の月額(円、数値のみ。月額記載がある場合のみ。一括払いの場合はnull)",
    "supportMonthly: 24時間サポートの月額(円、数値のみ。月額記載がある場合のみ。なければnull)",
    "",
    "exclusiveArea: 専有面積(㎡の数値のみ)",
    "renewalFeeRate: 更新料の倍率(数値のみ。「新賃料の1ヶ月分」→1、「新賃料の2ヶ月分」→2、「新賃料の0.5ヶ月分」→0.5。記載なければnull)",
    "renewalAdminFeeRate: 更新事務手数料・更新手数料の倍率(数値のみ。税別。「0.5ヶ月分(税別)」→0.5、「新賃料の0.5ヶ月」→0.5。記載なければnull)",
    "guaranteeRenewalFee: 保証会社の継続保証料・更新料(円/年、数値のみ。「10,000円/年」→10000、「年額10,000円」→10000。記載なければnull)",
    "insuranceRenewalFee: 火災保険の2年ごとの更新額(円、数値のみ。「18,000円/2年」→18000。記載なければnull)",
    "supportRenewalFee: 24時間サポート・ホームメイスター24などの2年ごとの更新額(円、数値のみ。「16,500円/2年」→16500。記載なければnull)",
    "",
    "evidence: 各項目の根拠。以下のキーで図面上の文言と判定根拠を返す:",
    "{",
    "  rent: {text:\"図面上の文言そのまま\", source:\"detected\"},",
    "  managementFee: {text:\"共益費5,000円\", source:\"detected\"},",
    "  deposit: {text:\"敷金1ヶ月\", source:\"detected\"},",
    "  keyMoney: {text:\"礼金1ヶ月\", source:\"detected\"},",
    "  agencyFee: {text:\"客付100%のため0円と判定\", source:\"detected\"},",
    "  guarantee: {text:\"保証会社加入必須(50〜80%)\", source:\"detected\"},",
    "  insurance: {text:\"火災保険22,000円/2年\", source:\"detected\"},",
    "  keyExchange: {text:\"鍵交換19,800円(税込)\", source:\"detected\"},",
    "  cleaning: {text:\"ハウスクリーニング費用負担有\", source:\"detected\"},",
    "  acCleaning: {text:\"エアコンクリーニング費用負担有\", source:\"detected\"},",
    "  support: {text:\"ホームメイスター24 16,500円(税込)という文言から24時間サポートと判定\", source:\"detected\"},",
    "  availableDate: {text:\"3月下旬入居可\", source:\"detected\"},",
    "  disinfection: {text:\"光触媒コーティングプラス\", source:\"detected\"}",
    "}",
    "記載がなくデフォルト値を使用した項目はsource:\"default\"、図面から推定した場合はsource:\"estimated\"",
    "",
    "warnings: 以下の注意事項が図面に含まれる場合、該当する警告文字列の配列を返す:",
    "- 定期借家・定借・定期建物賃貸借 → \"定期借家契約のため再契約ができない可能性があります。\"",
    "- 旧耐震・1981年以前築・昭和56年以前 → \"1982年(昭和56年)以前に建てられた建物です(旧耐震基準の建物である可能性があります)。\"",
    "- 1年契約・契約期間1年 → \"1年毎契約の物件です。\"",
    "- 賃料改定・賃料見直し・更新時賃料変更 → \"更新時に賃料改定が予定されています。\"",
    "",
    "【agencyFeeTypeの判定ルール】",
    "AD・広告料・業務委託料・業務委託補助手数料という文言がある場合のみadRateを設定",
    "「客付け100%」「配分」「取り分」などはADではない",
    "adRate >= 100 → agencyFeeType = 0",
    "adRate < 100またはnull → agencyFeeTypeはnullにする",
    "",
    "【その他ルール】",
    "敷金なし・敷0 → depositMonths=0",
    "礼金なし・礼0 → keyMoneyMonths=0",
    "即入居可 → availableDate=今日の日付",
    "見つからない項目はnull",
    "",
    "JSONのみで返してください。説明文やマークダウンは不要です。"
  ];
  const prompt = lines.join("\n");

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64Image } }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192, thinkingConfig: { thinkingBudget: 0 } }
      })
    }
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || "HTTP " + response.status);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  const text = parts.map((p: any) => p.text || "").join("");
  const jsonMatch = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("解析に失敗しました。もう一度お試しください。");

  let parsed: any = {};
  try { parsed = JSON.parse(jsonMatch[0]); } catch { throw new Error("解析に失敗しました。もう一度お試しください。"); }

  const extraItems: ExtraItem[] = [];
  if (Array.isArray(parsed.extraItems)) {
    for (const item of parsed.extraItems) {
      if (item.name && item.amount != null) {
        extraItems.push({ name: String(item.name), amount: Number(item.amount) });
      }
    }
  }

  const warnings: string[] = [];
  if (Array.isArray(parsed.warnings)) {
    for (const w of parsed.warnings) {
      if (typeof w === "string") warnings.push(w);
    }
  }

  return {
    rent: parsed.rent != null ? String(parsed.rent) : undefined,
    managementFee: parsed.managementFee != null ? String(parsed.managementFee) : undefined,
    depositMonths: parsed.depositMonths != null ? String(parsed.depositMonths) : undefined,
    keyMoneyMonths: parsed.keyMoneyMonths != null ? String(parsed.keyMoneyMonths) : undefined,
    propertyName: parsed.propertyName || undefined,
    roomNumber: parsed.roomNumber || undefined,
    propertyAddress: parsed.propertyAddress || undefined,
    agencyFeeType: parsed.agencyFeeType != null ? String(parsed.agencyFeeType) : undefined,
    customAgencyFee: parsed.customAgencyFee != null ? String(parsed.customAgencyFee) : undefined,
    guaranteeFeeType: parsed.guaranteeFeeType || undefined,
    guaranteeFeeRate: parsed.guaranteeFeeRate != null ? String(parsed.guaranteeFeeRate) : undefined,
    guaranteeFeeFixed: parsed.guaranteeFeeFixed != null ? String(parsed.guaranteeFeeFixed) : undefined,
    availableDate: parsed.availableDate || undefined,
    adRate: parsed.adRate != null ? Number(parsed.adRate) : undefined,
    insuranceFee: parsed.insuranceFee != null ? String(parsed.insuranceFee) : undefined,
    keyExchangeFee: parsed.keyExchangeFee != null ? String(parsed.keyExchangeFee) : undefined,
    cleaningFee: parsed.cleaningFee != null ? String(parsed.cleaningFee) : undefined,
    acCleaningFee: parsed.acCleaningFee != null ? String(parsed.acCleaningFee) : undefined,
    supportFee: parsed.supportFee != null ? String(parsed.supportFee) : undefined,
    supportFeeName: parsed.supportFeeName || undefined,
    hasDisinfection: parsed.hasDisinfection || false,
    disinfectionFee: parsed.disinfectionFee != null ? String(parsed.disinfectionFee) : undefined,
    hasContractFee: parsed.hasContractFee || false,
    contractFee: parsed.contractFee != null ? String(parsed.contractFee) : undefined,
    extraItems: extraItems.length > 0 ? extraItems : undefined,
    guaranteeMonthlyRate: parsed.guaranteeMonthlyRate != null ? String(parsed.guaranteeMonthlyRate) : undefined,
    insuranceMonthly: parsed.insuranceMonthly != null ? String(parsed.insuranceMonthly) : undefined,
    supportMonthly: parsed.supportMonthly != null ? String(parsed.supportMonthly) : undefined,
    exclusiveArea: parsed.exclusiveArea != null ? String(parsed.exclusiveArea) : undefined,
    renewalFeeRate: parsed.renewalFeeRate != null ? String(parsed.renewalFeeRate) : undefined,
    renewalAdminFeeRate: parsed.renewalAdminFeeRate != null ? String(parsed.renewalAdminFeeRate) : undefined,
    guaranteeRenewalFee: parsed.guaranteeRenewalFee != null ? String(parsed.guaranteeRenewalFee) : undefined,
    insuranceRenewalFee: parsed.insuranceRenewalFee != null ? String(parsed.insuranceRenewalFee) : undefined,
    supportRenewalFee: parsed.supportRenewalFee != null ? String(parsed.supportRenewalFee) : undefined,
    evidence: parsed.evidence && typeof parsed.evidence === "object" ? parsed.evidence : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
};

export const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
