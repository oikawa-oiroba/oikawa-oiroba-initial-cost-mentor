import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { key } = req.body || {};
  const validKey = process.env.UNLOCK_KEY; // VITE_なし = サーバー側のみ

  if (!validKey || !key || key !== validKey) {
    return res.status(200).json({ ok: false });
  }

  // 有効期限付きトークンを返す（24時間）
  const token = Buffer.from(
    JSON.stringify({ valid: true, exp: Date.now() + 24 * 60 * 60 * 1000 })
  ).toString("base64");

  return res.status(200).json({ ok: true, token });
}
