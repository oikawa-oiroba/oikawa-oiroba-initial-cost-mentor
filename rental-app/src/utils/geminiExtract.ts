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
  const prompt = `あなたは不動産の募集図面から情報を抽出する専門家です。
以下の募集図面から情報を読み取り、JSONのみで回答してください。前置きや説明は不要です。

【抽出項目】
- rent: 家賃（円、数値のみ）
- managementFee: 管理費・共益費（円、数値のみ。なければ0）
- depositMonths: 敷金（ヶ月数の数値のみ。「なし」「0ヶ月」なら0）
- keyMoneyMonths: 礼金（ヶ月数の数値のみ。「なし」「0ヶ月」なら0）
- propertyName: 物件名（建物名）
- roomNumber: 部屋番号
- agencyFeeType: 仲介手数料の種類
  "1.1"=賃料1ヶ月+消費税
  "0.55"=賃料0.5ヶ月+消費税
  "118000"=118000円固定
  "0"=無料・AD物件・仲介手数料なし
  "custom"=上記以外の固定金額
- customAgencyFee: agencyFeeTypeがcustomの場合の税込金額（数値のみ）
- guaranteeFeeType: 保証会社費用の種類 "rate"=料率指定 "fixed"=固定金額
- guaranteeFeeRate: 保証料が料率の場合の％（数値のみ。例:50）
- guaranteeFeeFixed: 保証料が固定金額の場合の円（数値のみ）
- insuranceFee: 火災保険料（円、数値のみ。記載なければ20000）
- keyExchangeFee: 鍵交換費用（円、数値のみ。記載なければ27500）
- cleaningFee: 退去時クリーニング費用（円、数値のみ。記載なければ55000）
- supportFee: 24時間サポート・緊急駆けつけサービスなど（円、数値のみ。記載なければ16500）
- hasDisinfection: 室内除菌・抗菌施工の記載があればtrue
- disinfectionFee: 室内除菌費用（円、数値のみ）
- hasContractFee: 契約事務手数料の記載があればtrue
- contractFee: 契約事務手数料（円、数
