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

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
        generationConfig: { temperature: 0.1, maxOutputTokens: 500 }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  
  // JSONブロックを抽出
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("JSONが見つかりません");
  
  const parsed = JSON.parse(jsonMatch[0]);
  
  return {
    rent: parsed.rent ? String(parsed.rent) : undefined,
    managementFee: parsed.managementFee ? String(parsed.managementFee) : undefined,
    depositMonths: parsed.depositMonths != null ? String(parsed.depositMonths) : undefined,
    keyMoneyMonths: parsed.keyMoneyMonths != null ? String(parsed.keyMoneyMonths) : undefined,
    propertyName: parsed.propertyName || undefined,
    roomNumber: parsed.roomNumber || undefined,
    agencyFeeType: parsed.agencyFeeType || undefined,
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
