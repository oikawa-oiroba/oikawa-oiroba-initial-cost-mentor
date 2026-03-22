import type { ExtractedPropertyData } from "./geminiExtract";

// アットホームのHTMLから物件情報を抽出
const parseAtHome = (html: string): ExtractedPropertyData => {
  const get = (pattern: RegExp): string | undefined => {
    const m = html.match(pattern);
    return m ? m[1].trim() : undefined;
  };

  // 家賃
  const rentMatch = html.match(/賃料[^\d]*(\d[\d,]+)万?円/);
  let rent: string | undefined;
  if (rentMatch) {
    const raw = rentMatch[1].replace(/,/g, "");
    // 「11万円」形式
    if (html.match(/賃料[^\d]*\d+万円/)) {
      const manMatch = html.match(/賃料[^\d]*(\d+)万円/);
      if (manMatch) rent = String(parseInt(manMatch[1]) * 10000);
    } else {
      rent = raw;
    }
  }

  // 管理費・共益費
  const mgmtMatch = html.match(/共益費[^\d]*(\d[\d,]+)円/);
  const managementFee = mgmtMatch ? mgmtMatch[1].replace(/,/g, "") : undefined;

  // 敷金
  let depositMonths = "1";
  if (html.match(/敷金[^\d]*なし/) || html.match(/敷金[^\d]*0ヶ月/)) {
    depositMonths = "0";
  } else {
    const dm = html.match(/敷金[^\d]*(\d+)ヶ月/);
    if (dm) depositMonths = dm[1];
  }

  // 礼金
  let keyMoneyMonths = "1";
  if (html.match(/礼金[^\d]*なし/) || html.match(/礼金[^\d]*0ヶ月/)) {
    keyMoneyMonths = "0";
  } else {
    const km = html.match(/礼金[^\d]*(\d+)ヶ月/);
    if (km) keyMoneyMonths = km[1];
  }

  // 物件名
  const nameMatch = html.match(/<h2[^>]*class="[^"]*building[^"]*"[^>]*>([^<]+)<\/h2>/) ||
    html.match(/建物名[^:：]*[:：]\s*<[^>]+>([^<]+)/) ||
    html.match(/建物名\s*\n\s*:\s*([^\n]+)/);
  const propertyName = nameMatch ? nameMatch[1].trim() : undefined;

  // 保証会社
  let guaranteeFeeType: string | undefined;
  let guaranteeFeeRate: string | undefined;
  const guaranteeMatch = html.match(/賃貸保証[^%\d]*初回(\d+)％?%?/);
  if (guaranteeMatch) {
    guaranteeFeeType = "rate";
    guaranteeFeeRate = guaranteeMatch[1];
  }

  // 火災保険
  let insuranceFee: string | undefined;
  const insMatch = html.match(/火災保険[^\d]*(\d[\d,]+)円/) ||
    html.match(/借家人賠償火災保険[^\d]*(\d[\d,]+)円/);
  if (insMatch) insuranceFee = insMatch[1].replace(/,/g, "");

  // 鍵交換
  let keyExchangeFee: string | undefined;
  const keyMatch = html.match(/鍵交換[^\d]*(\d[\d,]+)円/) ||
    html.match(/鍵交換代[^\d]*(\d[\d,]+)円/);
  if (keyMatch) keyExchangeFee = keyMatch[1].replace(/,/g, "");

  // 24時間サポート
  let supportFee: string | undefined;
  const supportMatch = html.match(/トラブルサポート[^\d]*(\d[\d,]+)円/) ||
    html.match(/24時間[^\d]*(\d[\d,]+)円/) ||
    html.match(/緊急[^\d]*(\d[\d,]+)円\/月/);
  if (supportMatch) supportFee = supportMatch[1].replace(/,/g, "");

  // 入居可能日
  let availableDate: string | undefined;
  const availMatch = html.match(/入居可能時期[^:：]*[:：]\s*[^2]*(\d{4})年(\d{1,2})月/) ||
    html.match(/(\d{4})年(\d{1,2})月.*入居/);
  if (availMatch) {
    const y = availMatch[1];
    const m = availMatch[2].padStart(2, "0");
    availableDate = `${y}-${m}-01`;
  }

  return {
    rent, managementFee, depositMonths, keyMoneyMonths,
    propertyName, guaranteeFeeType, guaranteeFeeRate,
    insuranceFee, keyExchangeFee, supportFee, availableDate,
  };
};

// nomad-cloudのHTMLから物件情報を抽出
const parseNomad = (html: string): ExtractedPropertyData => {
  const getNum = (pattern: RegExp): string | undefined => {
    const m = html.match(pattern);
    return m ? m[1].replace(/,/g, "") : undefined;
  };

  const rent = getNum(/賃料[^\d]*(\d[\d,]+)/);
  const managementFee = getNum(/管理費[^\d]*(\d[\d,]+)/) || getNum(/共益費[^\d]*(\d[\d,]+)/);

  let depositMonths = "1";
  if (html.match(/敷金[^0-9]*0/)) depositMonths = "0";
  else { const m = html.match(/敷金[^\d]*(\d+)/); if (m) depositMonths = m[1]; }

  let keyMoneyMonths = "1";
  if (html.match(/礼金[^0-9]*0/)) keyMoneyMonths = "0";
  else { const m = html.match(/礼金[^\d]*(\d+)/); if (m) keyMoneyMonths = m[1]; }

  // 物件名・部屋番号
  const nameMatch = html.match(/<title>([^<|｜]+)/);
  const propertyName = nameMatch ? nameMatch[1].trim() : undefined;
  const roomMatch = html.match(/(\d+)号室/);
  const roomNumber = roomMatch ? roomMatch[1] : undefined;

  const insuranceFee = getNum(/火災保険[^\d]*(\d[\d,]+)/);
  const keyExchangeFee = getNum(/鍵交換[^\d]*(\d[\d,]+)/);
  const supportFee = getNum(/サポート[^\d]*(\d[\d,]+)/);

  let guaranteeFeeType: string | undefined;
  let guaranteeFeeRate: string | undefined;
  let guaranteeFeeFixed: string | undefined;
  const rateMatch = html.match(/保証[^%\d]*(\d+)[%％]/);
  const fixedMatch = html.match(/保証[^\d]*(\d[\d,]+)円/);
  if (rateMatch) { guaranteeFeeType = "rate"; guaranteeFeeRate = rateMatch[1]; }
  else if (fixedMatch) { guaranteeFeeType = "fixed"; guaranteeFeeFixed = fixedMatch[1].replace(/,/g, ""); }

  return {
    rent, managementFee, depositMonths, keyMoneyMonths,
    propertyName, roomNumber, guaranteeFeeType, guaranteeFeeRate, guaranteeFeeFixed,
    insuranceFee, keyExchangeFee, supportFee,
  };
};

export const extractFromUrl = async (url: string): Promise<ExtractedPropertyData> => {
  // Vercelのサーバーレス関数経由でフェッチ
  const proxyUrl = `/api/fetch-property?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl);

  if (!response.ok) {
    throw new Error(`URL取得エラー: ${response.status}`);
  }

  const html = await response.text();

  if (url.includes("abm.athome.jp") || url.includes("athome")) {
    return parseAtHome(html);
  } else if (url.includes("nomad-cloud.jp")) {
    return parseNomad(html);
  }

  throw new Error("対応していないURLです。アットホームまたはNomad CloudのURLを入力してください。");
};
