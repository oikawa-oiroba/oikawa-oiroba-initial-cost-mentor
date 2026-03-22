export interface ExtractedPropertyData {
  rent?: string;
  managementFee?: string;
  depositMonths?: string;
  keyMoneyMonths?: string;
  propertyName?: string;
  roomNumber?: string;
  agencyFeeType?: string;
  customAgencyFee?: string;
  guaranteeFeeType?: string;
  guaranteeFeeRate?: string;
  guaranteeFeeFixed?: string;
  insuranceFee?: string;
  keyExchangeFee?: string;
  cleaningFee?: string;
  supportFee?: string;
  hasDisinfection?: boolean;
  disinfectionFee?: string;
  hasContractFee?: boolean;
  contractFee?: string;
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
    "propertyName: 物件名(建物名)",
    "roomNumber: 部屋番号",
    "agencyFeeType: 仲介手数料の種類(1.1=1ヶ月+消費税 / 0.55=0.5ヶ月+消費税 / 118000=118000円税別 / 0=無料・AD物件 / custom=その他)",
    "customAgencyFee: agencyFeeTypeがcustomの場合の税込金額(数値のみ)",
    "guaranteeFeeType: 保証会社費用の種類(rate=料率 / fixed=固定金額)",
    "guaranteeFeeRate: 料率の場合の%(数値のみ 例:50)",
    "guaranteeFeeFixed: 固定金額の場合の円(数値のみ)",
    "insuranceFee: 火災保険料(円、数値のみ。記載なければ20000)",
    "keyExchangeFee: 鍵交換費用(円、数値のみ。記載なければ27500)",
    "cleaningFee: 退去時クリーニング費用(円、数値のみ。記載なければ55000)",
    "supportFee: 24時間サポート・緊急駆けつけサービスなど(円、数値のみ。記載なければ16500)",
    "hasDisinfection: 室内除菌・抗菌施工の記載があればtrue",
    "disinfectionFee: 室内除菌費用(円、数値のみ)",
    "hasContractFee: 契約事務手数料の記載があればtrue",
    "contractFee: 契約事務手数料(円、数値のみ)",
    "",
    "読み取りルール:",
    "敷金なし・敷0 → depositMonths=0",
    "礼金なし・礼0 → keyMoneyMonths=0",
    "AD100%・仲介手数料無料 → agencyFeeType=0",
    "AD50%など → agencyFeeType=1.1(借主負担)",
    "保証会社が固定額 → guaranteeFeeType=fixed",
    "保証会社が料率 → guaranteeFeeType=rate",
    "SAT119・緊急サポート → supportFee",
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
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64Image } }
          ]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
      })
    }
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || "HTTP " + response.status);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  const text = parts
    .filter((p: any) => !p.thought)
    .map((p: any) => p.text || "")
    .join("");

  const cleaned = text
    .replace(/^[\s\S]*?(\{)/m, "$1")
    .replace(/\}[\s\S]*$/, "}");

  let parsed: any = {};
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("解析に失敗しました。もう一度お試しください。");
    parsed = JSON.parse(match[0]);
  }

  return {
    rent: parsed.rent != null ? String(parsed.rent) : undefined,
    managementFee: parsed.managementFee != null ? String(parsed.managementFee) : undefined,
    depositMonths: parsed.depositMonths != null ? String(parsed.depositMonths) : undefined,
    keyMoneyMonths: parsed.keyMoneyMonths != null ? String(parsed.keyMoneyMonths) : undefined,
    propertyName: parsed.propertyName || undefined,
    roomNumber: parsed.roomNumber || undefined,
    agencyFeeType: parsed.agencyFeeType != null ? String(parsed.agencyFeeType) : undefined,
    customAgencyFee: parsed.customAgencyFee != null ? String(parsed.customAgencyFee) : undefined,
    guaranteeFeeType: parsed.guaranteeFeeType || undefined,
    guaranteeFeeRate: parsed.guaranteeFeeRate != null ? String(parsed.guaranteeFeeRate) : undefined,
    guaranteeFeeFixed: parsed.guaranteeFeeFixed != null ? String(parsed.guaranteeFeeFixed) : undefined,
    insuranceFee: parsed.insuranceFee != null ? String(parsed.insuranceFee) : undefined,
    keyExchangeFee: parsed.keyExchangeFee != null ? String(parsed.keyExchangeFee) : undefined,
    cleaningFee: parsed.cleaningFee != null ? String(parsed.cleaningFee) : undefined,
    supportFee: parsed.supportFee != null ? String(parsed.supportFee) : undefined,
    hasDisinfection: parsed.hasDisinfection || false,
    disinfectionFee: parsed.disinfectionFee != null ? String(parsed.disinfectionFee) : undefined,
    hasContractFee: parsed.hasContractFee || false,
    contractFee: parsed.contractFee != null ? String(parsed.contractFee) : undefined,
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
