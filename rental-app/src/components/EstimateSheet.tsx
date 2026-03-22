import { useRef, useState } from "react";
import { formatCurrency } from "../utils/rentalCalculations";

interface EstimateSheetProps {
  result: any;
  monthlyResult: number | null;
  monthlyItems?: Array<{ label: string; amount: number }>;
  propertyName: string;
  roomNumber: string;
  propertyAddress: string;
  propertyUrl: string;
  propertyImage: string | null;
  rent: string;
  managementFee: string;
}

export const EstimateSheet = ({
  result, monthlyResult, monthlyItems, propertyName, roomNumber, propertyAddress, propertyUrl, propertyImage, rent, managementFee
}: EstimateSheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [showFullImage, setShowFullImage] = useState(false);
  const [isSavingPng, setIsSavingPng] = useState(false);

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

  const shareText = `この物件の初期費用、AIで概算してみた✨\n${propertyName ? propertyName + " " : ""}初期費用合計：${formatCurrency(result.total)}\nお部屋探しは xrooms.net`;
  const shareUrl = "https://xrooms.net";

  const handleShareLine = () => {
    window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, "_blank");
  };
  const handleShareX = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
  };
  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, "_blank");
  };

  const today = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div>
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
              {propertyAddress && <p className="text-xs text-gray-500 mt-0.5">{propertyAddress}</p>}
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
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <p className="text-sm font-bold text-blue-800">初期費用合計（概算）</p>
              {result.prorationInfo && (
                <p className="text-xs text-blue-600 mt-0.5">契約開始日(仮)　{result.prorationInfo.startDate}〜</p>
              )}
            </div>
            <p className="text-3xl font-bold text-blue-700">{formatCurrency(result.total)}</p>
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
                  <p className="text-sm font-bold text-blue-700">{formatCurrency(result.subtotals.contract)}</p>
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
                  <p className="text-sm font-bold text-purple-700">{formatCurrency(result.subtotals.option)}</p>
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

          {/* 小計A+B */}
          <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-gray-100">
            <p className="text-xs font-bold text-gray-700">小計（契約金 A項目 ＋ B項目）</p>
            <p className="text-sm font-bold text-gray-800">{formatCurrency(result.subtotals.contract + result.subtotals.option)}</p>
          </div>

          {/* 契約時前家賃 */}
          {(() => {
            const items = Object.values(result.items as Record<string, any>).filter((c: any) => c.category === "firstMonth" && c.amount !== 0);
            if (items.length === 0) return null;
            return (
              <div>
                <div className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-green-50 mb-1">
                  <p className="text-xs font-bold text-green-700">契約時前家賃（初月賃料日割り＋翌月賃料１ヶ月分）</p>
                  <p className="text-sm font-bold text-green-700">{formatCurrency(result.subtotals.firstMonth)}</p>
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

          {/* 毎月の費用（内訳付き） */}
          {monthlyResult !== null && (
            <div>
              <div className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-amber-50 mb-1">
                <p className="text-xs font-bold text-amber-700">毎月の費用（参考）</p>
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

          {/* 合計ライン */}
          <div className="border-t-2 border-gray-800 pt-3 flex justify-between items-center">
            <p className="font-bold text-gray-900 text-sm">初期費用合計（概算）</p>
            <p className="font-bold text-blue-700 text-2xl">{formatCurrency(result.total)}</p>
          </div>

          <p className="text-xs text-gray-400 text-center pt-1">
            ※この見積書はあくまで概算です。実際の金額は契約内容により異なります。
          </p>
        </div>
      </div>

      {/* ボタン類（一番下） */}
      <div className="mt-4 space-y-3 no-print">
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

        {/* SNSシェア */}
        <div>
          <p className="text-xs text-gray-400 text-center mb-2">シェアする</p>
          <div className="flex gap-2">
            <button onClick={handleShareLine}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#06C755] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
              </svg>
              LINE
            </button>
            <button onClick={handleShareX}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              X
            </button>
            <button onClick={handleShareFacebook}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#1877F2] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
          </div>
        </div>
      </div>

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
