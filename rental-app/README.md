# 賃貸初期費用シミュレーター

powered by XROOMS

## 機能

- 賃貸初期費用の概算計算（家賃・敷金・礼金・仲介手数料・保証会社費用・日割家賃など）
- 募集図面の画像をアップロードしてGemini AIで物件情報を自動抽出
- フリーレント対応
- 各種オプション費用の個別設定

## セットアップ

```bash
npm install
npm run dev
```

## Vercelへのデプロイ

1. GitHubにプッシュ
2. [vercel.com](https://vercel.com) でリポジトリを選択
3. Deployボタンをクリック

## Gemini APIキーの設定

アプリ内の「AIで募集図面から自動入力」セクションから設定できます。
[Google AI Studio](https://aistudio.google.com/app/apikey) で無料取得可能。

## 技術スタック

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Google Gemini API（画像解析）
