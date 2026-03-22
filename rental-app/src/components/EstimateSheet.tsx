import { useRef, useState } from "react";
import { formatCurrency } from "../utils/rentalCalculations";

interface EstimateSheetProps {
  result: any;
  monthlyResult: number | null;
  propertyName: string;
  roomNumber: string;
  propertyUrl: string;
  propertyImage: string | null;
  rent: string;
  managementFee: string;
}

export const EstimateSheet = ({
  result, monthlyResult, propertyName, roomNumber, propertyUrl, propertyImage, rent, managementFee
}: EstimateSheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [showFullImage, setShowFullImage] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleSavePNG = async () => {
    if (!sheetRef.current) return;
    try {
      const html2canvas = (await import("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.esm.js" as any)).default;
      const canvas = await html2canvas(sheetRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `初期費用見積_${propertyName || "物件"}_${roomNumber || ""}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      alert("PNG保存にはhtml2canvasが必要です。印刷ボタンをお使いください。");
    }
  };

  const today = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div>
      {/* ボタン */}
      <div className="flex gap-2 mb-3 no-print">
        <button onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          PDF出力（印刷）
        </button>
        <button onClick={handleSavePNG}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          PNG保存
        </button>
      </div>

      {/* 見積書本体 */}
      <div ref={sheetRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden estimate-sheet">
        {/* ヘッダー */}
        <div className="bg-blue-700 px-6 py-4 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold">賃貸初期費用　見積書</h2>
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
              {propertyUrl && <p className="text-xs text-blue-500 truncate mt-0.5">{propertyUrl}</p>}
              <div className="flex gap-4 mt-1.5">
                {rent && <span className="text-sm"><span className="text-gray-400">家賃</span> <span className="font-bold text-gray-800">{formatCurrency(parseFloat(rent))}</span></span>}
                {managementFee && <span className="text-sm"><span className="text-gray-400">管理費</span> <span className="font-bold text-gray-800">{formatCurrency(parseFloat(managementFee))}</span></span>}
              </div>
            </div>
          </div>
        </div>

        {/* 物件資料（大きく表示） */}
        {propertyImage && (
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">物件資料</p>
            <img
              src={propertyImage}
              alt="物件資料"
              className="w-full rounded-xl border border-gray-100 cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => setShowFullImage(!showFullImage)}
            />
            <p className="text-xs text-gray-400 mt-1 text-center">タップで拡大表示</p>
            {showFullImage && (
              <div
                className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                onClick={() => setShowFullImage(false)}
              >
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
                <p className="text-xs text-blue-600 mt-0.5">
                  契約開始日(仮)　{result.prorationInfo.startDate}〜
                </p>
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
                      <span className={`font-medium whitespace-nowrap ${item.amount < 0 ? "text-green-600" : "text-gray-800"}`}>
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
                {showAgencyNote && (
                  <p className="text-xs text-gray-400 mt-1 px-1">
                    ※契約条件により仲介手数料が発生する場合がございます。詳しくは担当までお問い合わせください。
                  </p>
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

          {/* 小計（A+B） */}
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
                      <span className={`font-medium whitespace-nowrap ${item.amount < 0 ? "text-green-600" : "text-gray-800"}`}>
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* 毎月費用 */}
          {monthlyResult !== null && (
            <div>
              <div className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-amber-50 mb-1">
                <p className="text-xs font-bold text-amber-700">毎月の費用（参考）</p>
                <p className="text-sm font-bold text-amber-700">{formatCurrency(monthlyResult)}/月</p>
              </div>
              <p className="text-xs text-gray-400 px-1">※家賃・管理費・保証会社月額などの合計</p>
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

      {/* 印刷スタイル */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body * { visibility: hidden; }
          .estimate-sheet, .estimate-sheet * { visibility: visible; }
          .estimate-sheet {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
          }
          @page { margin: 10mm; size: A4; }
        }
      `}</style>
    </div>
  );
};
