export interface ExtraItem {
  name: string;
  amount: number;
}

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
  availableDate?: string;
  insuranceFee?: string;
  keyExchangeFee?: string;
  cleaningFee?: string;
  supportFee?: string;
  hasDisinfection?: boolean;
  disinfectionFee?: string;
  hasContractFee?: boolean;
  contractFee?: string;
  extraItems?: ExtraItem[];
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
    "agencyFeeType: 仲介手数料の種類(1.1=1ヶ月+消費税 / 0.55=0.5ヶ月+消費税 / 118000=118000円税別 / 0=無料・AD100%物件 / custom=その他固定)",
    "customAgencyFee: agencyFeeTypeがcustomの場合の税込金額(数値のみ)",
    "guaranteeFeeType: 保証会社費用の種類(rate=料率 / fixed=固定金額)",
    "guaranteeFeeRate: 料率の場合の%(数値のみ 例:50)",
    "guaranteeFeeFixed: 固定金額の場合の円(数値のみ)",
    "availableDate: 入居可能日・入居時期(YYYY-MM-DD形式。即入居可・即時の場合は今日の日付。記載なければnull)",
    "insuranceFee: 火災保険料(円、数値のみ。記載があれば金額、なければnull)",
    "keyExchangeFee: 鍵交換費用(円、数値のみ。記載があれば金額、なければnull)",
    "cleaningFee: 退去時クリーニング費用(円、数値のみ。記載があれば金額、なければnull)",
    "supportFee: 24時間サポート・ホームメイト24・緊急駆けつけサービスなど(円、数値のみ。記載があれば金額、なければnull)",
    "hasDisinfection: 室内除菌・抗菌施工・光触媒コーティングの記載があればtrue",
    "disinfectionFee: 室内除菌費用(円、数値のみ)",
    "hasContractFee: 契約事務手数料の記載があればtrue",
    "contractFee: 契約事務手数料(円、数値のみ)",
    "extraItems: 上記以外の特殊費用の配列。SAT119・消火剤・光触媒・害虫駆除・その他オプションなど。各要素は{name:項目名, amount:円数値}形式",
    "",
    "読み取りルール:",
    "敷金なし・敷0 → depositMonths=0",
    "礼金なし・礼0 → keyMoneyMonths=0",
    "AD100%・仲介手数料無料 → agencyFeeType=0",
    "AD50%など → agencyFeeType=1.1(借主側は1ヶ月負担)",
    "保証会社が固定額 → guaranteeFeeType=fixed",
    "保証会社が料率 → guaranteeFeeType=rate",
    "即入居可 → availableDate=今日の日付",
    "火災保険・鍵交換・クリーニング・サポートは図面に記載がある場合のみ金額を返す。記載なければnull",
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
    availableDate: parsed.availableDate || undefined,
    insuranceFee: parsed.insuranceFee != null ? String(parsed.insuranceFee) : undefined,
    keyExchangeFee: parsed.keyExchangeFee != null ? String(parsed.keyExchangeFee) : undefined,
    cleaningFee: parsed.cleaningFee != null ? String(parsed.cleaningFee) : undefined,
    supportFee: parsed.supportFee != null ? String(parsed.supportFee) : undefined,
    hasDisinfection: parsed.hasDisinfection || false,
    disinfectionFee: parsed.disinfectionFee != null ? String(parsed.disinfectionFee) : undefined,
    hasContractFee: parsed.hasContractFee || false,
    contractFee: parsed.contractFee != null ? String(parsed.contractFee) : undefined,
    extraItems: extraItems.length > 0 ? extraItems : undefined,
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
