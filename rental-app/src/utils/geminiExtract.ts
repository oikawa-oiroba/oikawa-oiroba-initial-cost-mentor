export interface ExtractedPropertyData {
  rent?: string;
  managementFee?: string;
  depositMonths?: string;
  keyMoneyMonths?: string;
  propertyName?: string;
  roomNumber?: string;
  agencyFeeType?: string;
}

export const extractPropertyDataFromImage = async (
  base64Image: string,
  mimeType: string,
  apiKey: string
): Promise<ExtractedPropertyData> => {
  const prompt = `この不動産の募集図面から以下の情報を抽出してください。JSONのみで回答してください（説明文不要）。

抽出項目：
- rent: 家賃（円、数値のみ。例: 80000）
- managementFee: 管理費・共益費（円、数値のみ。なければ0）
- depositMonths: 敷金（何ヶ月分か数値のみ。例: 1 または 2。なければ0）
- keyMoneyMonths: 礼金（何ヶ月分か数値のみ。例: 1 または 2。なければ0）
- propertyName: 物件名（建物名）
- roomNumber: 部屋番号
- agencyFeeType: 仲介手数料（"1.1"=1ヶ月+税, "0.55"=0.5ヶ月+税, "0"=なし）

見つからない項目はnullにしてください。必ずJSONのみで返してください。`;

  const response =
