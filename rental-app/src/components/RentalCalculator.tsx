import { useState, useRef } from "react";
import { formatCurrency, calculateInitialCost, calculateMonthlyTotal, InitialCostInput, MonthlyInput } from "../utils/rentalCalculations";
import { extractPropertyDataFromImage, fileToBase64 } from "../utils/geminiExtract";

const AGENCY_OPTIONS = [
  { value: "1.1", label: "1ヶ月（税別）" },
  { value: "0.55", label: "0.5ヶ月（税別）" },
  { value: "118000", label: "118,000円（税込）" },
  { value: "0", label: "0円" },
  { value: "custom", label: "直接入力（税込）" },
];

export const RentalCalculator = () => {
  const [rent, setRent] = useState("");
  const [managementFee, setManagementFee] = useState("");
  const [guaranteeFeeType, setGuaranteeFeeType] = useState<"rate"|"fixed">("rate");
  const [guaranteeFeeRate, setGuaranteeFeeRate] = useState("50");
  const [guaranteeFeeFixed, setGuaranteeFeeFixed] = useState("");
  const [agencyFeeType, setAgencyFeeType] = useState("1.1");
  const [customAgencyFee, setCustomAgencyFee] = useState("");
  const [showDetail, setShowDetail] = useState(false);
  const [depositMonths, setDepositMonths] = useState("1");
  const [keyMoneyMonths, setKeyMoneyMonths] = useState("1");
  const [insuranceFee, setInsuranceFee] = useState("20000");
  const [keyExchangeFee, setKeyExchangeFee] = useState("27500");
  const [cleaningFee, setCleaningFee] = useState("55000");
  const [supportFee, setSupportFee] = useState("16500");
  const [hasDisinfection, setHasDisinfection] = useState(false);
  const [disinfectionFee, setDisinfectionFee] = useState("16500");
  const [hasContractFee, setHasContractFee] = useState(false);
  const [contractFee, setContractFee] = useState("5500");
  const [moveInDate, setMoveInDate] = useState("");
  const [hasRentFree, setHasRentFree] = useState(false);
  const [rentFreeMonths, setRentFreeMonths] = useState("1");
  const [showMonthly, setShowMonthly] = useState(false);
  const [guaranteeMonthlyRate, setGuaranteeMonthlyRate] = useState("");
  const [guaranteeMonthlyFixed, setGuaranteeMonthlyFixed] = useState("");
  const [insuranceMonthly, setInsuranceMonthly] = useState("0");
  const [supportMonthly, setSupportMonthly] = useState("0");
  const [townFee, setTownFee] = useState("0");
  const [otherMonthlyName, setOtherMonthlyName] = useState("その他");
  const [otherMonthlyFee, setOtherMonthlyFee] = useState("0");
  const [propertyName, setPropertyName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [propertyUrl, setPropertyUrl] = useState("");
  const [propertyImage, setPropertyImage] = useState<string|null>(null);
  const [apiKey, setApiKey] = useState(localStorage.getItem("gemini_api_key") || "");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeSuccess, setAnalyzeSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [monthlyResult, setMonthlyResult] = useState<number|null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPropertyImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    if (!apiKey) { setShowApiKeyInput(true); return; }
    await analyzeImage(file);
  };

  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);
    setError("");
    setAnalyzeSuccess(false);
    try {
      const { base64, mimeType } = await fileToBase64(file);
      const ex = await extractPropertyDataFromImage(base64, mimeType, apiKey);
      if (ex.rent) setRent(ex.rent);
      if (ex.managementFee) setManagementFee(ex.managementFee);
      if (ex.depositMonths != null) setDepositMonths(ex.depositMonths);
      if (ex.keyMoneyMonths != null) setKeyMoneyMonths(ex.keyMoneyMonths);
      if (ex.propertyName) setPropertyName(ex.propertyName);
      if (ex.roomNumber) setRoomNumber(ex.roomNumber);
      if (ex.agencyFeeType) setAgencyFeeType(ex.agencyFeeType);
      if (ex.customAgencyFee) setCustomAgencyFee(ex.customAgencyFee);
      if (ex.guaranteeFeeType) setGuaranteeFeeType(ex.guaranteeFeeType as "rate"|"fixed");
      if (ex.guaranteeFeeRate) setGuaranteeFeeRate(ex.guaranteeFeeRate);
      if (ex.guaranteeFeeFixed) setGuaranteeFeeFixed(ex.guaranteeFeeFixed);
      if (ex.insuranceFee) setInsuranceFee(ex.insuranceFee);
      if (ex.keyExchangeFee) setKeyExchangeFee(ex.keyExchangeFee);
      if (ex.cleaningFee) setCleaningFee(ex.cleaningFee);
      if (ex.supportFee) setSupportFee(ex.supportFee);
      if (ex.hasDisinfection) { setHasDisinfection(true); setShowDetail(true); }
      if (ex.disinfectionFee) setDisinfectionFee(ex.disinfectionFee);
      if (ex.hasContractFee) { setHasContractFee(true); setShowDetail(true); }
      if (ex.contractFee) setContractFee(ex.contractFee);
      setAnalyzeSuccess(true);
      setShowDetail(true);
    } catch (err: any) {
      setError(err.message || "解析エラー");
      setShowApiKeyInput(true);
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
    if (!rent) { setError("家賃を入力してください。"); return; }
    setError("");
    const rentNum = parseFloat(rent);
    const mgmtNum = parseFloat(managementFee || "0");
    const input: InitialCostInput = {
      rent: rentNum, managementFee: mgmtNum,
      depositMonths: parseFloat(depositMonths),
      keyMoneyMonths: parseFloat(keyMoneyMonths),
      agencyFeeType,
      customAgencyFee: customAgencyFee ? parseFloat(customAgencyFee) : undefined,
      guaranteeFeeType,
      guaranteeFeeRate: guaranteeFeeType === "rate" ? parseFloat(guaranteeFeeRate) : undefined,
      guaranteeFeeFixed: guaranteeFeeType === "fixed" ? parseFloat(guaranteeFeeFixed || "0") : undefined,
      insuranceFee: parseFloat(insuranceFee),
      keyExchangeFee: parseFloat(keyExchangeFee),
      cleaningFee: parseFloat(cleaningFee),
      supportFee: parseFloat(supportFee),
      hasDisinfection, disinfectionFee: parseFloat(disinfectionFee),
      hasContractFee, contractFee: parseFloat(contractFee),
      moveInDate, hasRentFree, rentFreeMonths: parseFloat(rentFreeMonths),
    };
    setResult(calculateInitialCost(input));
    if (showMonthly) {
      const monthly: MonthlyInput = {
        guaranteeMonthlyRate: guaranteeMonthlyRate ? parseFloat(guaranteeMonthlyRate) : 0,
        guaranteeMonthlyFixed: guaranteeMonthlyFixed ? parseFloat(guaranteeMonthlyFixed) : 0,
        insuranceMonthly: parseFloat(insuranceMonthly),
        supportMonthly: parseFloat(supportMonthly),
        townFee: parseFloat(townFee),
        otherMonthlyName, otherMonthlyFee: parseFloat(otherMonthlyFee),
      };
      setMonthlyResult(calculateMonthlyTotal(rentNum, mgmtNum, monthly));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const ic = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
  const lc = "block text-xs font-medium text-gray-600 mb-1";
  const monthlyGuaranteeCalc = rent && managementFee && guaranteeMonthlyRate
    ? Math.floor((parseFloat(rent) + parseFloat(managementFee)) * (parseFloat(guaranteeMonthlyRate) / 100))
    : null;

  return (
    <>
      {/* 印刷スタイル */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
          .print-area { box-shadow: none !important; border: none !important; }
        }
        @media screen {
          .print-only { display: none; }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Header */}
          <div className="text-center no-print">
            <div className="inline-flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">賃貸初期費用シミュレーター</h1>
            </div>
            <p className="text-xs text-gray-400">powered by XROOMS</p>
          </div>

          {/* AI画像解析 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 no-print">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="bg-purple-100 text-purple-600 text-xs px-2 py-0.5 rounded-full font-bold">AI</span>
              募集図面から自動入力
            </h2>
            {showApiKeyInput && (
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700 mb-2 font-medium">Gemini APIキーを入力</p>
                <div className="flex gap-2">
                  <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
                    placeholder="AIzaSy..." className="flex-1 border border-amber-200 rounded px-2 py-1.5 text-xs" />
                  <button onClick={saveApiKey} className="px-3 py-1.5 bg-amber-500 text-white rounded text-xs font-medium">保存</button>
                </div>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-xs text-amber-600 underline mt-1 block">Google AI Studioで取得</a>
              </div>
            )}
            <div onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              {propertyImage ? (
                <div className="relative">
                  <img src={propertyImage} alt="募集図面" className="max-h-40 mx-auto rounded-lg object-contain" />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                      <div className="text-center">
                        <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                        <p className="text-xs text-blue-600">AIが解析中...</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <p className="text-sm text-gray-400">募集図面をアップロード（クリック）</p>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            {analyzeSuccess && <p className="text-xs text-green-600 mt-2 font-medium">✓ 物件情報を自動入力しました。内容を確認してください。</p>}
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            <div className="mt-2 flex items-center gap-3">
              <button onClick={() => setShowApiKeyInput(!showApiKeyInput)} className="text-xs text-purple-500 underline">
                {apiKey ? "APIキーを変更" : "APIキーを設定"}
              </button>
              {apiKey && <span className="text-xs text-gray-400">設定済み ✓</span>}
            </div>
          </div>

          {/* 物件情報 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 no-print">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">物件情報（任意）</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><label className={lc}>物件名</label>
                <input className={ic} placeholder="〇〇マンション" value={propertyName} onChange={e => setPropertyName(e.target.value)} /></div>
              <div><label className={lc}>部屋番号</label>
                <input className={ic} placeholder="101" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} /></div>
            </div>
            <div><label className={lc}>物件URL</label>
              <input className={ic} placeholder="https://suumo.jp/..." value={propertyUrl} onChange={e => setPropertyUrl(e.target.value)} /></div>
          </div>

          {/* メイン4項目 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 no-print">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">基本情報</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><label className={lc}>家賃（円）<span className="text-red-500">*</span></label>
                <input className={ic} type="number" placeholder="80000" value={rent} onChange={e => setRent(e.target.value)} /></div>
              <div><label className={lc}>管理費・共益費（円）</label>
                <input className={ic} type="number" placeholder="5000" value={managementFee} onChange={e => setManagementFee(e.target.value)} /></div>
            </div>
            <div className="mb-3">
              <label className={lc}>保証会社（初回）</label>
              <div className="flex gap-2 mb-2">
                <button onClick={() => setGuaranteeFeeType("rate")}
                  className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${guaranteeFeeType === "rate" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200"}`}>
                  料率（%）
                </button>
                <button onClick={() => setGuaranteeFeeType("fixed")}
                  className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${guaranteeFeeType === "fixed" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200"}`}>
                  直接入力（円）
                </button>
              </div>
              {guaranteeFeeType === "rate" ? (
                <div className="flex items-center gap-2">
                  <input className={`${ic} flex-1`} type="number" placeholder="50" value={guaranteeFeeRate} onChange={e => setGuaranteeFeeRate(e.target.value)} />
                  <span className="text-sm text-gray-500">%</span>
                  {rent && guaranteeFeeRate && (
                    <span className="text-xs text-blue-600 whitespace-nowrap">
                      ≈ {formatCurrency(Math.floor((parseFloat(rent) + parseFloat(managementFee||"0")) * parseFloat(guaranteeFeeRate) / 100))}
                    </span>
                  )}
                </div>
              ) : (
                <input className={ic} type="number" placeholder="50000" value={guaranteeFeeFixed} onChange={e => setGuaranteeFeeFixed(e.target.value)} />
              )}
              <p className="text-xs text-gray-400 mt-1">30〜120%が目安。交渉可能な場合あり。</p>
            </div>
            <div>
              <label className={lc}>仲介手数料</label>
              <select className={ic} value={agencyFeeType} onChange={e => setAgencyFeeType(e.target.value)}>
                {AGENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {agencyFeeType === "custom" && (
                <input className={`${ic} mt-2`} type="number" placeholder="金額（税込・円）" value={customAgencyFee} onChange={e => setCustomAgencyFee(e.target.value)} />
              )}
            </div>
          </div>

          {/* 詳細設定 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden no-print">
            <button onClick={() => setShowDetail(!showDetail)}
              className="w-full flex items-center justify-between p-5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              <span>詳細設定（敷金・礼金・各種費用）</span>
              <svg className={`w-5 h-5 text-gray-400 transition-transform ${showDetail ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {showDetail && (
              <div className="px-5 pb-5 space-y-4 border-t border-gray-50">
                <div className="pt-4">
                  <label className={lc}>入居予定日</label>
                  <input className={ic} type="date" value={moveInDate} onChange={e => setMoveInDate(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lc}>敷金</label>
                    <select className={ic} value={depositMonths} onChange={e => setDepositMonths(e.target.value)}>
                      {["0","1","2","3"].map(m => <option key={m} value={m}>{m === "0" ? "なし" : `${m}ヶ月`}</option>)}
                    </select></div>
                  <div><label className={lc}>礼金</label>
                    <select className={ic} value={keyMoneyMonths} onChange={e => setKeyMoneyMonths(e.target.value)}>
                      {["0","1","2","3"].map(m => <option key={m} value={m}>{m === "0" ? "なし" : `${m}ヶ月`}</option>)}
                    </select></div>
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input type="checkbox" checked={hasRentFree} onChange={e => setHasRentFree(e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
                    <span className="text-sm text-gray-700">フリーレントあり</span>
                  </label>
                  {hasRentFree && (
                    <select className={ic} value={rentFreeMonths} onChange={e => setRentFreeMonths(e.target.value)}>
                      {["1","2","3"].map(m => <option key={m} value={m}>{m}ヶ月</option>)}
                    </select>
                  )}
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">初回費用</p>
                  <div className="space-y-2">
                    {[
                      { label: "火災保険料", value: insuranceFee, set: setInsuranceFee },
                      { label: "鍵交換費用", value: keyExchangeFee, set: setKeyExchangeFee },
                      { label: "退去時クリーニング", value: cleaningFee, set: setCleaningFee },
                      { label: "24時間サポート", value: supportFee, set: setSupportFee },
                    ].map(({ label, value, set }) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-36">{label}</span>
                        <input type="number" value={value} onChange={e => set(e.target.value)}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" />
                        <span className="text-xs text-gray-400">円</span>
                      </div>
                    ))}
                    <div className="pt-1">
                      <label className="flex items-center gap-2 cursor-pointer mb-1">
                        <input type="checkbox" checked={hasDisinfection} onChange={e => setHasDisinfection(e.target.checked)} className="w-4 h-4 rounded" />
                        <span className="text-sm text-gray-600">室内除菌抗菌</span>
                      </label>
                      {hasDisinfection && (
                        <div className="flex items-center gap-3 ml-6">
                          <input type="number" value={disinfectionFee} onChange={e => setDisinfectionFee(e.target.value)}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" />
                          <span className="text-xs text-gray-400">円</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer mb-1">
                        <input type="checkbox" checked={hasContractFee} onChange={e => setHasContractFee(e.target.checked)} className="w-4 h-4 rounded" />
                        <span className="text-sm text-gray-600">契約事務手数料</span>
                      </label>
                      {hasContractFee && (
                        <div className="flex items-center gap-3 ml-6">
                          <input type="number" value={contractFee} onChange={e => setContractFee(e.target.value)}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" />
                          <span className="text-xs text-gray-400">円</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 毎月の費用 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden no-print">
            <button onClick={() => setShowMonthly(!showMonthly)}
              className="w-full flex items-center justify-between p-5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              <span>毎月の費用（参考表示）</span>
              <svg className={`w-5 h-5 text-gray-400 transition-transform ${showMonthly ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {showMonthly && (
              <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-3">
                <div>
                  <label className={lc}>保証会社（月額）</label>
                  <div className="flex items-center gap-2">
                    <input className={`${ic} flex-1`} type="number" placeholder="1" value={guaranteeMonthlyRate}
                      onChange={e => { setGuaranteeMonthlyRate(e.target.value); setGuaranteeMonthlyFixed(""); }} />
                    <span className="text-xs text-gray-500">%</span>
                    {monthlyGuaranteeCalc !== null && guaranteeMonthlyRate && (
                      <span className="text-xs text-blue-600 whitespace-nowrap">≈ {formatCurrency(monthlyGuaranteeCalc)}/月</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">または直接入力（円）：</p>
                  <input className={`${ic} mt-1`} type="number" placeholder="直接入力" value={guaranteeMonthlyFixed}
                    onChange={e => { setGuaranteeMonthlyFixed(e.target.value); setGuaranteeMonthlyRate(""); }} />
                </div>
                {[
                  { label: "火災保険（月割）", value: insuranceMonthly, set: setInsuranceMonthly },
                  { label: "24時間サポート（月額）", value: supportMonthly, set: setSupportMonthly },
                  { label: "町内会費", value: townFee, set: setTownFee },
                ].map(({ label, value, set }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-36">{label}</span>
                    <input type="number" value={value} onChange={e => set(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" />
                    <span className="text-xs text-gray-400">円</span>
                  </div>
                ))}
                <div className="flex items-center gap-3">
                  <input type="text" value={otherMonthlyName} onChange={e => setOtherMonthlyName(e.target.value)}
                    className="w-36 border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white" placeholder="項目名" />
                  <input type="number" value={otherMonthlyFee} onChange={e => setOtherMonthlyFee(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" />
                  <span className="text-xs text-gray-400">円</span>
                </div>
              </div>
            )}
          </div>

          <button onClick={calculate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-colors text-base shadow-sm no-print">
            初期費用を計算する
          </button>

          {/* 見積書 */}
          {result && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 print-area">
              {/* 印刷ヘッダー */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">賃貸初期費用　見積書</h2>
                    <p className="text-xs text-gray-400">出日付: {new Date().toLocaleDateString('ja-JP')}</p>
                  </div>
                  <button onClick={handlePrint}
                    className="no-print flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                    </svg>
                    PDF出力
                  </button>
                </div>

                {/* 物件情報 */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex gap-4">
                    {propertyImage && (
                      <img src={propertyImage} alt="物件" className="w-24 h-24 object-cover rounded-lg flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-lg">{propertyName || "（物件名未入力）"}</p>
                      {roomNumber && <p className="text-sm text-gray-500 mb-1">{roomNumber}号室</p>}
                      {propertyUrl && (
                        <a href={propertyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 underline break-all">{propertyUrl}</a>
                      )}
                      <div className="mt-2 flex flex-wrap gap-3">
                        <span className="text-sm"><span className="text-gray-500">家賃</span> <span className="font-bold">{formatCurrency(parseFloat(rent))}</span></span>
                        {managementFee && <span className="text-sm"><span className="text-gray-500">管理費</span> <span className="font-bold">{formatCurrency(parseFloat(managementFee))}</span></span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 合計 */}
              <div className="px-6 py-5 bg-blue-600">
                <p className="text-blue-200 text-sm mb-1 text-center">初期費用合計（概算）</p>
                <p className="text-4xl font-bold text-white text-center">{formatCurrency(result.total)}</p>
              </div>

              {/* 内訳テーブル */}
              <div className="p-6 space-y-5">
                {[
                  { key: "contract", label: "■ 契約金", color: "text-blue-700" },
                  { key: "option", label: "■ 初回オプション費用", color: "text-purple-700" },
                  { key: "firstMonth", label: "■ 初月家賃関連", color: "text-green-700" },
                ].map(({ key, label, color }) => {
                  const items = Object.values(result.items as Record<string, any>).filter((c: any) => c.category === key && c.amount !== 0);
                  if (items.length === 0) return null;
                  return (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-2">
                        <p className={`text-sm font-bold ${color}`}>{label}</p>
                        <p className="text-sm font-bold text-gray-800">{formatCurrency(result.subtotals[key])}</p>
                      </div>
                      <div className="border border-gray-100 rounded-xl overflow-hidden">
                        {items.map((item: any, idx: number) => (
                          <div key={item.label} className={`flex justify-between px-4 py-2.5 text-sm ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                            <span className="text-gray-600">{item.label}</span>
                            <span className={`font-medium ${item.amount < 0 ? "text-green-600" : "text-gray-800"}`}>{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* 毎月の費用 */}
                {monthlyResult !== null && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-bold text-amber-700">■ 毎月の費用（参考）</p>
                      <p className="text-sm font-bold text-gray-800">{formatCurrency(monthlyResult)}/月</p>
                    </div>
                    <p className="text-xs text-gray-400">※家賃・管理費・保証会社月額などの合計</p>
                  </div>
                )}

                {/* 合計行 */}
                <div className="border-t-2 border-gray-800 pt-4">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-gray-900 text-base">初期費用合計（概算）</p>
                    <p className="font-bold text-blue-600 text-2xl">{formatCurrency(result.total)}</p>
                  </div>
                </div>

                <p className="text-xs text-gray-400 text-center pt-2 border-t border-gray-100">
                  ※この見積書はあくまで概算です。実際の金額は契約内容により異なります。<br/>
                  powered by XROOMS賃貸初期費用シミュレーター
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
