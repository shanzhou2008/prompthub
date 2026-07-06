const fs = require("fs");
const path = require("path");
const https = require("https");

const DATA_DIR = path.join(process.cwd(), "api", "data");
const IMAGES_DIR = path.join(process.cwd(), "public", "images");

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

const prompts = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "prompts.json"), "utf8"));

const SKIP_EXISTING = true;
const MAX_CONCURRENT = 3;
const RETRIES = 2;
const TIMEOUT_MS = 60000;
const REQUEST_DELAY_MS = 800;

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: TIMEOUT_MS, headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        const redirectUrl = res.headers.location;
        if (!redirectUrl) {
          reject(new Error("Redirect without location"));
          return;
        }
        downloadImage(redirectUrl, destPath).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const file = fs.createWriteStream(destPath);
      res.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
      file.on("error", (err) => {
        file.destroy();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        reject(err);
      });
    });
    req.on("error", (err) => {
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
    req.on("timeout", () => {
      req.destroy();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(new Error("Timeout"));
    });
  });
}

async function downloadWithRetry(url, destPath) {
  for (let i = 0; i <= RETRIES; i++) {
    try {
      await downloadImage(url, destPath);
      return true;
    } catch (err) {
      if (i === RETRIES) return false;
      await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS * (i + 1)));
    }
  }
  return false;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  let toDownload = [];
  for (const p of prompts) {
    if (!p.imageUrl) continue;
    const dest = path.join(IMAGES_DIR, `${p.id}.jpg`);
    if (SKIP_EXISTING && fs.existsSync(dest)) {
      console.log(`[SKIP] ${p.id} (exists)`);
      continue;
    }
    toDownload.push({ id: p.id, url: p.imageUrl, dest });
  }

  console.log(`\nTotal to download: ${toDownload.length}`);
  console.log(`Concurrent: ${MAX_CONCURRENT}, Retries: ${RETRIES}, Timeout: ${TIMEOUT_MS}ms\n`);

  const start = Date.now();
  let success = 0;
  let failed = 0;
  const failedList = [];

  for (let i = 0; i < toDownload.length; i += MAX_CONCURRENT) {
    const batch = toDownload.slice(i, i + MAX_CONCURRENT);
    const batchPromises = batch.map(async (item) => {
      const result = await downloadWithRetry(item.url, item.dest);
      if (result) {
        const size = fs.statSync(item.dest).size;
        console.log(`[OK] ${item.id} (${(size / 1024).toFixed(1)}KB)`);
        return { success: true };
      } else {
        console.log(`[FAIL] ${item.id}`);
        failedList.push(item.id);
        return { success: false };
      }
    });

    const results = await Promise.all(batchPromises);
    success += results.filter((r) => r.success).length;
    failed += results.filter((r) => !r.success).length;

    await sleep(REQUEST_DELAY_MS);
  }

  const elapsed = (Date.now() - start) / 1000;
  console.log(`\n=== Done ===`);
  console.log(`Success: ${success}, Failed: ${failed}, Time: ${elapsed.toFixed(1)}s`);

  if (failedList.length > 0) {
    fs.writeFileSync(path.join(DATA_DIR, "failed-images.json"), JSON.stringify(failedList, null, 2));
    console.log(`Failed list saved to: failed-images.json`);
  }

  let updatedCount = 0;
  const updated = prompts.map((p) => {
    const localPath = `/images/${p.id}.jpg`;
    const hasLocal = fs.existsSync(path.join(IMAGES_DIR, `${p.id}.jpg`));
    if (hasLocal) updatedCount++;
    return {
      ...p,
      imageUrl: hasLocal ? localPath : p.imageUrl,
      imageLgUrl: hasLocal ? localPath : p.imageLgUrl,
    };
  });
  fs.writeFileSync(path.join(DATA_DIR, "prompts.json"), JSON.stringify(updated, null, 2));
  console.log(`Updated ${updatedCount}/${prompts.length} prompts with local paths.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
