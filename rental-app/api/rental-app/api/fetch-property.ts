import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { url } = req.query;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "url parameter is required" });
  }

  // 許可するドメインのみ
  const allowed = ["abm.athome.jp", "nomad-cloud.jp"];
  let hostname = "";
  try {
    hostname = new URL(url).hostname;
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  if (!allowed.some(d => hostname.includes(d))) {
    return res.status(403).json({ error: "Domain not allowed" });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RentalSimulator/1.0)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "ja,en;q=0.9",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Fetch failed: ${response.status}` });
    }

    const html = await response.text();
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.status(200).send(html);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
fetch-property
