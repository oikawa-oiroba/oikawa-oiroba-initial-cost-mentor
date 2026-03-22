import { useRef, useState } from "react";
import { formatCurrency } from "../utils/rentalCalculations";

interface EstimateSheetProps {
  result: any;
  monthlyResult: number | null;
  monthlyItems?: Array<{ label: string; amount: number }>;
  evidence?: Record<string, any>;
  warnings?: string[];
  depositMonths?: string;
  propertyName: string;
  roomNumber: string;
  propertyAddress: string;
  propertyUrl: string;
  propertyImage: string | null;
  rent: string;
  managementFee: string;
  exclusiveArea?: string;
  showRenewal?: boolean;
  renewalFeeRate?: string;
  renewalAdminFeeRate?: string;
  guaranteeRenewalFee?: string;
  insuranceRenewalFee?: string;
  supportRenewalFee?: string;
  keyMoneyMonths?: string;
}

export const EstimateSheet = ({
  result, monthlyResult, monthlyItems, evidence, warnings, depositMonths, propertyName, roomNumber, propertyAddress, propertyUrl, propertyImage, rent, managementFee,
  exclusiveArea, showRenewal, renewalFeeRate, renewalAdminFeeRate, guaranteeRenewalFee, insuranceRenewalFee, supportRenewalFee, keyMoneyMonths
}: EstimateSheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [showFullImage, setShowFullImage] = useState(false);
  const [isSavingPng, setIsSavingPng] = useState(false);
  const [showInternalModal, setShowInternalModal] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("午前");
  let _ = "";

  const handlePrint = () => window.print();

  const handleSavePNG = async () => {
    if (!sheetRef.current) return;
    setIsSavingPng(true);
    try {
      const html2canvas = (await import("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.esm.js" as any)).default;
      const canvas = await html2canvas(sheetRef.current, {
        scale: 2, useCORS: true, backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `初期費用_${propertyName || "物件"}_${roomNumber || ""}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      alert("PNG保存に失敗しました。印刷ボタンをお使いください。");
    } finally {
      setIsSavingPng(false);
    }
  };

  const abTotal = (result.subtotals?.contract ?? 0) + (result.subtotals?.option ?? 0) + (result.subtotals?.cleaning ?? 0);
  const rentNum0 = parseFloat(rent || "0");
  const mgmtNum0 = parseFloat(managementFee || "0");
  const shareText = `この物件の初期費用、AIで概算してみた✨\n${propertyName ? propertyName + " " : ""}月額${formatCurrency(rentNum0 + mgmtNum0)}  初期費用は${formatCurrency(abTotal)}＋契約時前家賃でし✨\nお部屋探しは xrooms.net`;

  const handleShare = async () => {
    // iframeでも動作するシェア：LINEにテキストで送る＋PNG保存
    const lineShareUrl = `https://line.me/R/msg/text/?${encodeURIComponent(shareText)}`;

    // PNG生成を試みる
    if (sheetRef.current) {
      setIsSavingPng(true);
      try {
        const html2canvas = (await import("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.esm.js" as any)).default;
        const canvas = await html2canvas(sheetRef.current, {
          scale: 2, useCORS: true, backgroundColor: "#ffffff",
        });
        // PNG自動保存
        const link = document.createElement("a");
        link.download = `初期費用_${propertyName || "物件"}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch {
        // PNG生成失敗は無視
      } finally {
        setIsSavingPng(false);
      }
    }

    // LINEを新しいタブで開く（iframeでも動作）
    window.open(lineShareUrl, "_blank", "noopener,noreferrer");
  };

  const today = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div>
      {/* 計算根拠ボックス */}
      {evidence && Object.keys(evidence).length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3 no-print">
          <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            計算根拠（図面より読み取り）
          </p>
          <div className="space-y-1.5">
            {[
              { key: "rent", label: "家賃" },
              { key: "managementFee", label: "管理費" },
              { key: "deposit", label: "敷金" },
              { key: "keyMoney", label: "礼金" },
              { key: "agencyFee", label: "仲介手数料" },
              { key: "guarantee", label: "保証会社" },
              { key: "insurance", label: "火災保険" },
              { key: "keyExchange", label: "鍵交換" },
              { key: "cleaning", label: "クリーニング" },
              { key: "acCleaning", label: "エアコン洗浄" },
              { key: "support", label: "24hサポート" },
              { key: "availableDate", label: "入居可能日" },
              { key: "disinfection", label: "除菌抗菌" },
            ].filter(({ key }) => evidence[key]).map(({ key, label }) => {
              const ev = evidence[key];
              const text = typeof ev === "object" ? ev.text : String(ev);
              const source = typeof ev === "object" ? ev.source : "detected";
              return (
                <div key={key} className="flex gap-2 text-xs">
                  <span className="text-gray-400 w-20 flex-shrink-0">{label}</span>
                  <span className={source === "default" ? "text-amber-600" : "text-gray-600"}>
                    {source === "default" ? "└ 記載がなかったため未算入（別途費用が発生する場合があります。詳しくはお問い合わせください）" : `└ 「${text}」`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 見積書本体 */}
      <div ref={sheetRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden estimate-sheet">
        {/* ヘッダー */}
        <div className="bg-blue-700 px-6 py-4 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold">初期費用概算計算書</h2>
              <p className="text-blue-200 text-xs mt-0.5">作成日: {today}</p>
            </div>
            <p className="text-blue-200 text-xs">powered by XROOMS</p>
          </div>
        </div>

        {/* 物件情報 */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex gap-4 items-start">
            {propertyImage && (
              <img src={propertyImage} alt="物件" className="w-20 h-20 object-cover rounded-lg flex-shrink-0 border border-gray-100" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-base">{propertyName || "（物件名未入力）"}</p>
              {roomNumber && <p className="text-sm text-gray-500">{roomNumber}号室</p>}
              {propertyAddress && (
                <a href={"https://maps.google.com/?q=" + encodeURIComponent(propertyAddress)}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-500 mt-0.5 flex items-center gap-0.5 hover:underline">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {propertyAddress}
                </a>
              )}
              {propertyUrl && <p className="text-xs text-blue-500 truncate mt-0.5">{propertyUrl}</p>}
              <div className="flex gap-4 mt-1.5">
                {rent && <span className="text-sm"><span className="text-gray-400">家賃</span> <span className="font-bold text-gray-800">{formatCurrency(parseFloat(rent))}</span></span>}
                {managementFee && <span className="text-sm"><span className="text-gray-400">管理費</span> <span className="font-bold text-gray-800">{formatCurrency(parseFloat(managementFee))}</span></span>}
              </div>
            </div>
          </div>
        </div>

        {/* 物件資料 */}
        {propertyImage && (
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">物件資料</p>
            <img
              src={propertyImage} alt="物件資料"
              className="w-full rounded-xl border border-gray-100 cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => setShowFullImage(!showFullImage)}
            />
            {!isSavingPng && (
              <p className="text-xs text-gray-400 mt-1 text-center no-png">タップで拡大表示</p>
            )}
            {showFullImage && (
              <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowFullImage(false)}>
                <img src={propertyImage} alt="物件資料" className="max-w-full max-h-full object-contain rounded-xl" />
                <button className="absolute top-4 right-4 text-white text-2xl font-bold">✕</button>
              </div>
            )}
          </div>
        )}

        {/* 合計 */}
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <p className="text-xs font-bold text-blue-800 mb-1">概算契約諸費用（固定分）</p>
          <p className="text-xs text-blue-500 mb-2">※前家賃・日割り家賃は含まれていません</p>
          {result.prorationInfo && (
            <p className="text-xs text-blue-600 mb-1">契約開始日(仮)　{result.prorationInfo.startDate}〜</p>
          )}
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="text-3xl font-bold text-blue-700">{formatCurrency((result.subtotals?.contract ?? 0) + (result.subtotals?.option ?? 0) + (result.subtotals?.cleaning ?? 0))}</span>
          </div>
        </div>

        {/* 内訳 */}
        <div className="px-6 py-4 space-y-4">
          {/* 契約金A */}
          {(() => {
            const items = Object.values(result.items as Record<string, any>).filter((c: any) => c.category === "contract");
            const agencyFeeItem = items.find((i: any) => i.label.includes("仲介手数料"));
            const showAgencyNote = agencyFeeItem && agencyFeeItem.amount === 0;
            return (
              <div>
                <div className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-blue-50 mb-1">
                  <p className="text-xs font-bold text-blue-700">契約金 A項目（敷金・礼金・仲介手数料・保証会社）</p>
                  <p className="text-sm font-bold text-blue-700">{formatCurrency((result.subtotals?.contract ?? 0))}</p>
                </div>
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  {items.map((item: any, idx: number) => (
                    <div key={item.label} className={`flex justify-between px-3 py-2 text-xs ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                      <span className="text-gray-500 flex-1 pr-2">{item.label}</span>
                      <span className={`font-medium whitespace-nowrap ${item.amount < 0 ? "text-green-600" : "text-gray-800"}`}>{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
                {showAgencyNote && (
                  <p className="text-xs text-gray-400 mt-1 px-1">※契約条件により仲介手数料が発生する場合がございます。詳しくは担当までお問い合わせください。</p>
                )}
              </div>
            );
          })()}

          {/* 契約金B */}
          {(() => {
            const items = Object.values(result.items as Record<string, any>).filter((c: any) => c.category === "option" && c.amount !== 0);
            if (items.length === 0) return null;
            return (
              <div>
                <div className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-purple-50 mb-1">
                  <p className="text-xs font-bold text-purple-700">契約金 B項目（火災保険・鍵交換代・24時間サポートほか）</p>
                  <p className="text-sm font-bold text-purple-700">{formatCurrency((result.subtotals?.option ?? 0))}</p>
                </div>
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  {items.map((item: any, idx: number) => (
                    <div key={item.label} className={`flex justify-between px-3 py-2 text-xs ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                      <span className="text-gray-500 flex-1 pr-2">{item.label}</span>
                      <span className="font-medium whitespace-nowrap text-gray-800">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* 契約金C */}
          {(() => {
            const items = Object.values(result.items as Record<string, any>).filter((c: any) => c.category === "cleaning" && c.amount !== 0);
            if (items.length === 0) return null;
            const hasDeposit = depositMonths && parseFloat(depositMonths) >= 1;
            return (
              <div>
                <div className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-orange-50 mb-1">
                  <p className="text-xs font-bold text-orange-700">契約金 C項目（退去時クリーニング代など）</p>
                  <p className="text-sm font-bold text-orange-700">{formatCurrency((result.subtotals?.cleaning ?? 0))}</p>
                </div>
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  {items.map((item: any, idx: number) => (
                    <div key={item.label} className={`flex justify-between px-3 py-2 text-xs ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                      <span className="text-gray-500 flex-1 pr-2">{item.label}</span>
                      <span className="font-medium whitespace-nowrap text-gray-800">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
                {hasDeposit && (
                  <p className="text-xs text-orange-600 mt-1 px-1">
                    ※退去時支払いとなる場合があります。詳しくは担当者までお問い合わせください。
                  </p>
                )}
              </div>
            );
          })()}

          {/* 小計A+B+C */}
          <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-gray-100">
            <p className="text-xs font-bold text-gray-700">小計（契約金 A＋B＋C項目）</p>
            <p className="text-sm font-bold text-gray-800">{formatCurrency((result.subtotals?.contract ?? 0) + (result.subtotals?.option ?? 0) + (result.subtotals?.cleaning ?? 0))}</p>
          </div>

          {/* 契約時前家賃 */}
          {(() => {
            const items = Object.values(result.items as Record<string, any>).filter((c: any) => c.category === "firstMonth" && c.amount !== 0);
            if (items.length === 0) return null;
            return (
              <div>
                <div className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-green-50 mb-1">
                  <p className="text-xs font-bold text-green-700">契約時前家賃（初月賃料日割り＋翌月賃料１ヶ月分）</p>
                  <p className="text-sm font-bold text-green-700">{formatCurrency((result.subtotals?.firstMonth ?? 0))}</p>
                </div>
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  {items.map((item: any, idx: number) => (
                    <div key={item.label} className={`flex justify-between px-3 py-2 text-xs ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                      <span className="text-gray-500 flex-1 pr-2">{item.label}</span>
                      <span className={`font-medium whitespace-nowrap ${item.amount < 0 ? "text-green-600" : "text-gray-800"}`}>{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* 合計ライン */}
          <div className="border-t-2 border-gray-800 pt-3">
            <p className="font-bold text-gray-900 text-xs mb-1">概算契約諸費用（固定分）</p>
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="font-bold text-blue-700 text-2xl">{formatCurrency((result.subtotals?.contract ?? 0) + (result.subtotals?.option ?? 0) + (result.subtotals?.cleaning ?? 0))}</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center pt-1">
            ※この見積書はあくまで概算です。実際の金額は契約内容により異なります。
          </p>

          {/* 推定・振込総額 */}
          <div className="bg-blue-700 rounded-xl px-4 py-3 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-blue-200 mb-0.5">推定・振込総額（概算）</p>
                <p className="text-xs text-blue-300">
                  {result.prorationInfo ? `${result.prorationInfo.startDate}契約開始(仮)として計算` : "前家賃・日割り家賃を含む総額"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{formatCurrency(result.total ?? 0)}</p>
              </div>
            </div>
          </div>

          {/* 参考セクション */}
          {(monthlyResult !== null || showRenewal) && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <p className="text-xs font-bold text-gray-500 text-center">&lt;参考&gt;</p>

              {/* 毎月の費用 */}
              {monthlyResult !== null && (
                <div>
                  <div className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-amber-50 mb-1">
                    <p className="text-xs font-bold text-amber-700">毎月の費用</p>
                    <p className="text-sm font-bold text-amber-700">{formatCurrency(monthlyResult)}/月</p>
                  </div>
                  {monthlyItems && monthlyItems.length > 0 && (
                    <div className="border border-gray-100 rounded-lg overflow-hidden">
                      {monthlyItems.map((item, idx) => (
                        <div key={item.label} className={`flex justify-between px-3 py-2 text-xs ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                          <span className="text-gray-500">{item.label}</span>
                          <span className="font-medium text-gray-800">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 px-1 mt-1">※家賃・管理費・保証会社月額などの合計</p>
                </div>
              )}

              {/* 更新時の費用 */}
              {showRenewal && (() => {
                const rentNum = parseFloat(rent || "0");
                const renewalFee = renewalFeeRate && parseFloat(renewalFeeRate) > 0 ? Math.floor(rentNum * parseFloat(renewalFeeRate)) : 0;
                const renewalAdminFee = renewalAdminFeeRate && parseFloat(renewalAdminFeeRate) > 0 ? Math.floor(rentNum * parseFloat(renewalAdminFeeRate) * 1.1) : 0;
                const gRenewal = guaranteeRenewalFee && parseFloat(guaranteeRenewalFee) > 0 ? parseFloat(guaranteeRenewalFee) : 0;
                const insRenewal = insuranceRenewalFee && parseFloat(insuranceRenewalFee) > 0 ? parseFloat(insuranceRenewalFee) : 0;
                const supRenewal = supportRenewalFee && parseFloat(supportRenewalFee) > 0 ? parseFloat(supportRenewalFee) : 0;
                const renewalTotal = renewalFee + renewalAdminFee + gRenewal + insRenewal + supRenewal;
                const naNote = "記載がなかったため未算入（別途費用が発生する場合があります。詳しくはお問い合わせください）";
                const items2 = [
                  { label: `更新料${renewalFeeRate ? `（${renewalFeeRate}ヶ月分）` : ""}`, amount: renewalFee, missing: !renewalFeeRate || renewalFee === 0 },
                  { label: `更新事務手数料${renewalAdminFeeRate ? `（${renewalAdminFeeRate}ヶ月税別）` : ""}`, amount: renewalAdminFee, missing: !renewalAdminFeeRate || renewalAdminFee === 0 },
                  { label: "保証会社更新料", amount: gRenewal, note: "/年", missing: !guaranteeRenewalFee || gRenewal === 0 },
                  { label: "火災保険", amount: insRenewal, note: "/2年", missing: !insuranceRenewalFee || insRenewal === 0 },
                  { label: "24時間サポート", amount: supRenewal, note: "/2年", missing: !supportRenewalFee || supRenewal === 0 },
                ];
                return (
                  <div>
                    <div className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-indigo-50 mb-1">
                      <p className="text-xs font-bold text-indigo-700">更新時の費用（2年毎）</p>
                      <p className="text-sm font-bold text-indigo-700">{formatCurrency(renewalTotal)}</p>
                    </div>
                    <div className="border border-gray-100 rounded-lg overflow-hidden">
                      {items2.map((item, idx) => (
                        <div key={item.label} className={`flex justify-between px-3 py-2 text-xs ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                          <span className="text-gray-500 flex-1 pr-2">{item.label}{item.note && <span className="text-gray-400">{item.note}</span>}</span>
                          {item.missing
                            ? <span className="text-amber-600 text-right" style={{fontSize:"10px"}}>{naNote}</span>
                            : <span className="font-medium text-gray-800 whitespace-nowrap">{formatCurrency(item.amount)}</span>
                          }
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* めやす賃料 */}
          {(() => {
            const rentNum = parseFloat(rent || "0");
            const mgmtNum = parseFloat(managementFee || "0");
            const keyMoneyAmt = rentNum * parseFloat(keyMoneyMonths || "0");
            const renewalFeeAmt = renewalFeeRate ? Math.floor(rentNum * parseFloat(renewalFeeRate)) : 0;
            // 4年間（48ヶ月）= 2回更新
            const monthlyBase = rentNum + mgmtNum;
            const totalCost = monthlyBase * 48 + keyMoneyAmt + renewalFeeAmt * 2;
            const meyasuRent = Math.floor(totalCost / 48);
            const meyasuPerSqm = exclusiveArea ? Math.floor(meyasuRent / parseFloat(exclusiveArea)) : null;
            return (
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <p className="text-xs font-bold text-gray-600">めやす賃料</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">めやす賃料</span>
                    <span className="font-bold text-gray-900">{formatCurrency(meyasuRent)}/月</span>
                  </div>
                  {meyasuPerSqm !== null && (
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-gray-700">1㎡あたり</span>
                      <span className="font-bold text-gray-900">{formatCurrency(meyasuPerSqm)}/㎡</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  ※賃料・共益費・管理費・礼金・更新料を含み、賃料等条件の改定がないものと仮定して4年間賃借した場合の1ヶ月当たりの金額です。実際の総支払額と異なる場合があります。
                </p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ボタン類（一番下） */}
      <div className="mt-4 space-y-3 no-print">

        {/* LINE CTA */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="bg-green-600 px-4 py-3 text-white text-center">
            <p className="text-sm font-bold">XROOMSの担当者に相談する（無料）</p>
            <p className="text-xs text-green-200 mt-0.5">専門エージェントが解析データを精査し、お客様のご状況に合わせた最適な契約条件を検証いたします</p>
          </div>
          <div className="p-3 space-y-2">
            {(() => {
              const pName = propertyName || "不明";
              const pRoom = roomNumber ? roomNumber + "号室" : "";
              const pAddr = propertyAddress || "不明";
              const pRent = rent || "不明";
              const msgSecond = `お世話になっております。【初期費用診断】から連絡しました。
以下の物件について、不明な諸費用についても管理会社に確認のうえ、改めてお見積書の作成をお願いいたします。
物件名：${pName} ${pRoom}
住所：${pAddr}
家賃：${pRent}円
手元の見積書もこの後お送りします。内容が適正かアドバイスいただけますか？`;
              const msgApply = `お世話になっております。以下の物件の入居申し込みを希望します。
不明な諸費用についても管理会社に確認のうえ、改めてお見積書の作成をお願いいたします。
物件名：${pName} ${pRoom}
住所：${pAddr}
家賃：${pRent}円
申込フォームの発行をお願いいたします。`;
              const toLine = (msg: string) => `https://line.me/R/oaMessage/%40xrooms/?${encodeURIComponent(msg)}`;
              return (
                <>
                  {[
                    { label: "見積書を専門エージェントが精査（セカンドオピニオン）", emoji: "🔍", color: "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100", msg: msgSecond },
                    { label: "この条件で申し込みを進める", emoji: "✍️", color: "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100", msg: msgApply },
                  ].map(({ label, emoji, color, msg }) => (
                    <a key={label} href={toLine(msg)} target="_blank" rel="noopener noreferrer"
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${color}`}>
                      <span className="text-lg flex-shrink-0">{emoji}</span>
                      <span>{label}</span>
                      <svg className="w-4 h-4 ml-auto flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </a>
                  ))}
                  {/* 内見予約ボタン */}
                  <button onClick={() => setShowInternalModal(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100 text-sm font-medium transition-colors">
                    <span className="text-lg flex-shrink-0">📅</span>
                    <span>内見を予約する（無料）</span>
                    <svg className="w-4 h-4 ml-auto flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </>
              );
            })()}
          </div>
        </div>

        {/* PDF/PNG */}
        <div className="flex gap-2">
          <button onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            PDF出力
          </button>
          <button onClick={handleSavePNG} disabled={isSavingPng}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {isSavingPng ? "保存中..." : "PNG保存"}
          </button>
        </div>

        {/* シェアボタン */}
        <button onClick={handleShare} disabled={isSavingPng}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-xl text-sm font-medium transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          {isSavingPng ? "準備中..." : "シェアする（LINE・SNS）"}
        </button>
        <p className="text-xs text-gray-400 text-center">※スマホでは画像付きシェアシートが開きます。PCでは画像を保存してからお送りください。</p>
      </div>

      {/* 内見予約モーダル */}
      {showInternalModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowInternalModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <p className="font-bold text-gray-900">内見予約</p>
              <button onClick={() => setShowInternalModal(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">第一希望日</label>
              <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">時間帯</label>
              <div className="flex gap-2">
                {["午前", "午後", "夕方"].map(t => (
                  <button key={t} onClick={() => setVisitTime(t)}
                    className={"flex-1 py-2 text-sm rounded-lg border transition-colors " + (visitTime === t ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200")}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <a
              href={`https://line.me/R/oaMessage/%40xrooms/?${encodeURIComponent(`お世話になっております。以下の物件の内見を希望します。
不明な諸費用についても管理会社に確認のうえ、改めてお見積書の作成をお願いいたします。
物件名：${propertyName || "不明"} ${roomNumber ? roomNumber + "号室" : ""}
住所：${propertyAddress || "不明"}
家賃：${rent || "不明"}円
第一希望：${visitDate || "未定"} ${visitTime}`)}`}
              target="_blank" rel="noopener noreferrer"
              onClick={() => setShowInternalModal(false)}
              className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-sm transition-colors"
            >
              📅 この日程でLINEを送る
            </a>
            <p className="text-xs text-gray-400 text-center">LINEアプリが開きます</p>
          </div>
        </div>
      )}

      {/* 印刷スタイル */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body * { visibility: hidden; }
          .estimate-sheet, .estimate-sheet * { visibility: visible; }
          .estimate-sheet {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100% !important; margin: 0 !important;
            border-radius: 0 !important; box-shadow: none !important;
            page-break-inside: avoid !important;
          }
          @page { margin: 10mm; size: A4; }
        }
        .no-png { display: block; }
      `}</style>
    </div>
  );
};
