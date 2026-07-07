import type { VercelRequest, VercelResponse } from "@vercel/node";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "api", "data");
let _cache: any[] | null = null;

function loadPrompts() {
  if (_cache) return _cache;
  try {
    _cache = JSON.parse(fs.readFileSync(path.join(dataDir, "prompts.json"), "utf8"));
    return _cache!;
  } catch {
    return [];
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string;
  if (!id) {
    return res.status(400).json({ error: "Missing id" });
  }

  const prompts = loadPrompts();
  const prompt = prompts.find((p: any) => p.id === id);
  if (!prompt) {
    return res.status(404).json({ error: "Not found" });
  }

  // If there's a local image, redirect to it
  const localPath = path.join(process.cwd(), "public", "images", `${id}.jpg`);
  if (fs.existsSync(localPath) && fs.statSync(localPath).size > 2000) {
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    return res.redirect(301, `/images/${id}.jpg`);
  }

  // Get the original Pollinations URL
  let imgUrl = prompt.imageLgUrl || prompt.imageUrl;
  if (!imgUrl) {
    return res.status(404).json({ error: "No image URL" });
  }

  // For card view, use smaller image
  const size = req.query.size as string;
  if (size === "card") {
    imgUrl = imgUrl
      .replace("width=1280&height=720", "width=400&height=300")
      .replace("width=768&height=512", "width=400&height=300");
  }

  try {
    const response = await fetch(imgUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!response.ok) {
      return res.status(502).json({ error: `Image fetch failed: ${response.status}` });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    return res.send(buffer);
  } catch (error: any) {
    return res.status(502).json({ error: `Proxy error: ${error.message}` });
  }
}
