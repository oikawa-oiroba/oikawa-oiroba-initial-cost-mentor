import { useState, useRef } from "react";
import { calculateCostBreakdown, formatCurrency } from "../utils/rentalCalculations";
import { extractPropertyDataFromImage, fileToBase64 } from "../utils/geminiExtract";
import { useRentalForm } from "../hooks/useRentalForm";

const DEPOSIT_OPTIONS = [
  { value: "0", label: "なし" },
  { value: "1", label: "1ヶ月" },
  { value: "2", label: "2ヶ月" },
  { value: "custom", label: "カスタム" },
];

const KEY_MONEY_OPTIONS = [
  { value: "0", label: "なし" },
  { value: "1", label: "1ヶ月" },
  { value: "2", label: "2ヶ月" },
  { value: "custom", label: "カスタム" },
];

const AGENCY_FEE_OPTIONS = [
  { value: "1.1", label: "1ヶ月+税" },
  { value: "0.55", label: "0.5ヶ月+税" },
  { value: "68000", label: "68,000円+税" },
  { value: "0", label: "なし" },
  { value: "custom", label: "カスタム" },
];

const GUARANTEE_OPTIONS = [
  { value: "0.5", label: "50%" },
  { value: "0.6", label: "60%" },
  { value: "0.8", label: "80%" },
  { value: "1.0", label: "100%" },
  { value: "custom", label: "カスタム" },
];

export const RentalCalculator = () => {
  const form = useRentalForm();
  const [breakdown, setBreakdown] = useState<any>(null);
  const [propertyImage, setPropertyImage] = useState<string | null>(null);
  const [hasOtherFee1, setHasOtherFee1] = useState(false);
  const [hasOtherFee2, setHasOtherFee2] = useState(false);
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem("gemini_api_key") || "");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [analyzeSuccess, setAnalyzeSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // プレビュー表示
    const reader = new FileReader();
    reader.onload = (ev) => setPropertyImage(ev.target?.result as string);
    reader.readAsDataURL(file);

    if (!apiKey) {
      setShowApiKeyInput(true);
      return;
    }

    await analyzeImage(file);
  };

  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);
    setError("");
    setAnalyzeSuccess(false);
    try {
      const { base64, mimeType } = await fileToBase64(file);
      const extracted = await extractPropertyDataFromImage(base64, mimeType, apiKey);

      if (extracted.rent) form.setRent(extracted.rent);
      if (extracted.managementFee) form.setManagementFee(extracted.managementFee);
      if (extracted.depositMonths) form.setDepositMonths(extracted.depositMonths);
      if (extracted.keyMoneyMonths) form.setKeyMoneyMonths(extracted.keyMoneyMonths);
      if (extracted.propertyName) form.setPropertyName(extracted.propertyName);
      if (extracted.roomNumber) form.setRoomNumber(extracted.roomNumber);
      if (extracted.agencyFeeType) form.setAgencyFeeType(extracted.agencyFeeType);
      setAnalyzeSuccess(true);
    } catch (err: any) {
      setError("画像の解析に失敗しました。APIキーを確認してください。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveApiKey = () => {
    localStorage.setItem("gemini_api_key", apiKey);
    setShowApiKeyInput(false);
    const file = fileInputRef.current?.files?.[0];
    if (file) analyzeImage(file);
  };

  const calculate = () => {
    if (!form.rent || !form.moveInDate) {
      setError("家賃と入居予定日を入力してください。");
      return;
    }
    setError("");

    const otherFees = [];
    if (hasOtherFee1 && form.otherFee1Name && form.otherFee1Amount) {
      otherFees.push({ name: form.otherFee1Name, amount: parseFloat(form.otherFee1Amount) });
    }
    if (hasOtherFee2 && form.otherFee2Name && form.otherFee2Amount) {
      otherFees.push({ name: form.otherFee2Name, amount: parseFloat(form.otherFee2Amount) });
    }

    const result = calculateCostBreakdown(
      parseFloat(form.rent),
      parseFloat(form.managementFee || "0"),
      form.moveInDate,
      parseFloat(form.sanitationFee || "0"),
      parseFloat(form.supportFee || "0"),
      parseFloat(form.contractFee || "0"),
      form.depositMonths === "custom"
        ? parseFloat(form.customDeposit || "0") / parseFloat(form.rent)
        : parseFloat(form.depositMonths),
      form.keyMoneyMonths === "custom"
        ? parseFloat(form.customKeyMoney || "0") / parseFloat(form.rent)
        : parseFloat(form.keyMoneyMonths),
      form.agencyFeeType,
      form.customAgencyFee ? parseFloat(form.customAgencyFee) : undefined,
      form.guaranteeFeeRate === "custom"
        ? parseFloat(form.customGuaranteeFeeRate || "0") / 100
        : parseFloat(form.guaranteeFeeRate),
      form.hasRentFree,
      form.hasRentFree ? parseFloat(form.rentFreeMonths) : 0,
      {
        hasInsuranceFee: form.hasInsuranceFee,
        hasKeyExchangeFee: form.hasKeyExchangeFee,
        hasCleaningFee: form.hasCleaningFee,
        insuranceFeeAmount: form.insuranceFeeAmount,
        keyExchangeFeeAmount: form.keyExchangeFeeAmount,
        cleaningFeeAmount: form.cleaningFeeAmount,
        otherFees,
      }
    );
    setBreakdown(result);
  };

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";
  const sectionClass = "bg-gray-50 rounded-xl p-4 mb-4";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">賃貸初期費用シミュレーター</h1>
          </div>
          <p className="text-sm text-gray-500">powered by XROOMS</p>
        </div>

        {/* Image Upload Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xs">AI</span>
            募集図面から自動入力
          </h2>
          
          {showApiKeyInput && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700 mb-2 font-medium">Gemini APIキーを入力してください</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="flex-1 border border-amber-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
                <button onClick={saveApiKey} className="px-3 py-1.5 bg-amber-500 text-white rounded text-xs font-medium hover:bg-amber-600">
                  保存
                </button>
              </div>
              <p className="text-xs text-amber-600 mt-1">
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">
                  Google AI Studioで取得
                </a>
              </p>
            </div>
          )}

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            {propertyImage ? (
              <div className="relative">
                <img src={propertyImage} alt="募集図面" className="max-h-48 mx-auto rounded-lg object-contain" />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-xs text-blue-600 font-medium">AIが解析中...</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <p className="text-sm text-gray-500">募集図面の画像をアップロード</p>
                <p className="text-xs text-gray-400 mt-1">クリックまたはドラッグ＆ドロップ</p>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

          {analyzeSuccess && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <p className="text-xs text-green-700 font-medium">物件情報を自動入力しました。内容を確認してください。</p>
            </div>
          )}

          {!apiKey && !showApiKeyInput && (
            <button onClick={() => setShowApiKeyInput(true)} className="mt-2 text-xs text-purple-600 underline hover:text-purple-800">
              APIキーを設定する
            </button>
          )}
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* 物件情報 */}
          <div className={sectionClass}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">物件情報</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelClass}>物件名</label>
                <input className={inputClass} placeholder="〇〇マンション" value={form.propertyName} onChange={e => form.setPropertyName(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>部屋番号</label>
                <input className={inputClass} placeholder="101" value={form.roomNumber} onChange={e => form.setRoomNumber(e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelClass}>物件URL（任意）</label>
              <input className={inputClass} placeholder="https://suumo.jp/..." value={form.propertyUrl} onChange={e => form.setPropertyUrl(e.target.value)} />
            </div>
          </div>

          {/* 基本情報 */}
          <div className={sectionClass}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">基本情報</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelClass}>家賃（円）<span className="text-red-500">*</span></label>
                <input className={inputClass} type="number" placeholder="80000" value={form.rent} onChange={e => form.setRent(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>管理費・共益費（円）</label>
                <input className={inputClass} type="number" placeholder="5000" value={form.managementFee} onChange={e => form.setManagementFee(e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelClass}>入居予定日<span className="text-red-500">*</span></label>
              <input className={inputClass} type="date" value={form.moveInDate} onChange={e => form.setMoveInDate(e.target.value)} />
            </div>
          </div>

          {/* 契約条件 */}
          <div className={sectionClass}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">契約条件</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelClass}>敷金</label>
                <select className={inputClass} value={form.depositMonths} onChange={e => form.setDepositMonths(e.target.value)}>
                  {DEPOSIT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {form.depositMonths === "custom" && (
                  <input className={`${inputClass} mt-1`} type="number" placeholder="金額（円）" value={form.customDeposit} onChange={e => form.setCustomDeposit(e.target.value)} />
                )}
              </div>
              <div>
                <label className={labelClass}>礼金</label>
                <select className={inputClass} value={form.keyMoneyMonths} onChange={e => form.setKeyMoneyMonths(e.target.value)}>
                  {KEY_MONEY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {form.keyMoneyMonths === "custom" && (
                  <input className={`${inputClass} mt-1`} type="number" placeholder="金額（円）" value={form.customKeyMoney} onChange={e => form.setCustomKeyMoney(e.target.value)} />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>仲介手数料</label>
                <select className={inputClass} value={form.agencyFeeType} onChange={e => form.setAgencyFeeType(e.target.value)}>
                  {AGENCY_FEE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {form.agencyFeeType === "custom" && (
                  <input className={`${inputClass} mt-1`} type="number" placeholder="金額（税抜・円）" value={form.customAgencyFee} onChange={e => form.setCustomAgencyFee(e.target.value)} />
                )}
              </div>
              <div>
                <label className={labelClass}>保証会社料率</label>
                <select className={inputClass} value={form.guaranteeFeeRate} onChange={e => form.setGuaranteeFeeRate(e.target.value)}>
                  {GUARANTEE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {form.guaranteeFeeRate === "custom" && (
                  <input className={`${inputClass} mt-1`} type="number" placeholder="料率（%）" value={form.customGuaranteeFeeRate} onChange={e => form.setCustomGuaranteeFeeRate(e.target.value)} />
                )}
              </div>
            </div>
          </div>

          {/* フリーレント */}
          <div className={sectionClass}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.hasRentFree} onChange={e => form.setHasRentFree(e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
              <span className="text-sm font-medium text-gray-700">フリーレントあり</span>
            </label>
            {form.hasRentFree && (
              <div className="mt-2">
                <label className={labelClass}>フリーレント期間</label>
                <select className={inputClass} value={form.rentFreeMonths} onChange={e => form.setRentFreeMonths(e.target.value)}>
                  {["1","2","3"].map(m => <option key={m} value={m}>{m}ヶ月</option>)}
                </select>
              </div>
            )}
          </div>

          {/* オプション費用 */}
          <div className={sectionClass}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">オプション費用</h3>
            <div className="space-y-3">
              {[
                { check: form.hasInsuranceFee, setCheck: form.setHasInsuranceFee, label: "火災保険料", amount: form.insuranceFeeAmount, setAmount: form.setInsuranceFeeAmount },
                { check: form.hasKeyExchangeFee, setCheck: form.setHasKeyExchangeFee, label: "鍵交換費用", amount: form.keyExchangeFeeAmount, setAmount: form.setKeyExchangeFeeAmount },
                { check: form.hasCleaningFee, setCheck: form.setHasCleaningFee, label: "退去時清掃費用", amount: form.cleaningFeeAmount, setAmount: form.setCleaningFeeAmount },
              ].map(({ check, setCheck, label, amount, setAmount }) => (
                <div key={label} className="flex items-center gap-3">
                  <input type="checkbox" checked={check} onChange={e => setCheck(e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
                  <span className="text-sm text-gray-700 w-32">{label}</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    disabled={!check}
                    className={`flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm ${!check ? "bg-gray-100 text-gray-400" : "bg-white"}`}
                  />
                  <span className="text-xs text-gray-400">円</span>
                </div>
              ))}

              {/* その他費用 */}
              {[
                { has: hasOtherFee1, setHas: setHasOtherFee1, name: form.otherFee1Name, setName: form.setOtherFee1Name, amount: form.otherFee1Amount, setAmount: form.setOtherFee1Amount },
                { has: hasOtherFee2, setHas: setHasOtherFee2, name: form.otherFee2Name, setName: form.setOtherFee2Name, amount: form.otherFee2Amount, setAmount: form.setOtherFee2Amount },
              ].map(({ has, setHas, name, setName, amount, setAmount }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input type="checkbox" checked={has} onChange={e => setHas(e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={!has}
                    placeholder="費用名"
                    className={`w-32 border border-gray-200 rounded-lg px-2 py-1.5 text-sm ${!has ? "bg-gray-100 text-gray-400" : "bg-white"}`}
                  />
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    disabled={!has}
                    className={`flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm ${!has ? "bg-gray-100 text-gray-400" : "bg-white"}`}
                  />
                  <span className="text-xs text-gray-400">円</span>
                </div>
              ))}

              {/* 固定オプション費用 */}
              <div className="border-t border-gray-100 pt-3 mt-3 space-y-2">
                {[
                  { label: "室内除菌費用", value: form.sanitationFee, set: form.setSanitationFee },
                  { label: "24時間サポート費用", value: form.supportFee, set: form.setSupportFee },
                  { label: "契約事務手数料", value: form.contractFee, set: form.setContractFee },
                ].map(({ label, value, set }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-4 h-4" />
                    <span className="text-sm text-gray-700 w-32">{label}</span>
                    <input type="number" value={value} onChange={e => set(e.target.value)} className={`flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white`} />
                    <span className="text-xs text-gray-400">円</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
          )}

          <button
            onClick={calculate}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            初期費用を計算する
          </button>
        </div>

        {/* Result */}
        {breakdown && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-4">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {form.propertyName && <span className="text-blue-600">{form.propertyName} </span>}
              {form.roomNumber && <span className="text-gray-500 text-sm">{form.roomNumber}</span>}
            </h2>
            {form.propertyUrl && (
              <a href={form.propertyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 underline break-all">
                {form.propertyUrl}
              </a>
            )}

            {/* Total */}
            <div className="bg-blue-600 rounded-xl p-4 mt-4 mb-4 text-center">
              <p className="text-blue-100 text-sm mb-1">初期費用合計（概算）</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(breakdown.total)}</p>
            </div>

            {/* Breakdown by category */}
            {[
              { key: "basic", label: "契約金", color: "blue" },
              { key: "optional", label: "オプション費用", color: "purple" },
              { key: "firstMonth", label: "初月家賃関連", color: "green" },
            ].map(({ key, label, color }) => {
              const items = Object.values(breakdown.costs as Record<string, any>).filter(
                (c: any) => c.category === key && c.amount !== 0
              );
              const subtotal = breakdown.subtotals[key];
              if (items.length === 0) return null;

              const colorMap: Record<string, string> = {
                blue: "bg-blue-50 border-blue-100 text-blue-700",
                purple: "bg-purple-50 border-purple-100 text-purple-700",
                green: "bg-green-50 border-green-100 text-green-700",
              };
              const headerColor: Record<string, string> = {
                blue: "text-blue-800 bg-blue-100",
                purple: "text-purple-800 bg-purple-100",
                green: "text-green-800 bg-green-100",
              };

              return (
                <div key={key} className={`rounded-xl border ${colorMap[color]} p-4 mb-3`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${headerColor[color]}`}>{label}</span>
                    <span className="text-sm font-bold">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="space-y-1.5">
                    {items.map((item: any) => (
                      <div key={item.label} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.label}</span>
                        <span className={`font-medium ${item.amount < 0 ? "text-green-600" : "text-gray-800"}`}>
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <p className="text-xs text-gray-400 text-center mt-4">
              ※この計算結果はあくまで概算です。実際の金額は契約内容により異なります。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
