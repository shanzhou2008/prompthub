/**
 * 批量下载 Pollinations 图片到本地静态资源
 * 在 Vercel 构建时运行，利用海外服务器网络优势
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const DATA_DIR = path.join(process.cwd(), "api", "data");
const IMAGES_DIR = path.join(process.cwd(), "public", "images");

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

const prompts = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "prompts.json"), "utf8"));

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https
      .get(url, { timeout: 45000 }, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          // follow redirect
          const redirectUrl = res.headers.location;
          file.destroy();
          if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
          if (!redirectUrl) {
            reject(new Error("Redirect without location"));
            return;
          }
          downloadImage(redirectUrl, destPath).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          file.destroy();
          if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        file.destroy();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        reject(err);
      })
      .on("timeout", () => {
        file.destroy();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        reject(new Error("Timeout"));
      });
  });
}

async function downloadWithRetry(url, destPath, retries = 1) {
  for (let i = 0; i <= retries; i++) {
    try {
      await downloadImage(url, destPath);
      return true;
    } catch (err) {
      if (i === retries) {
        console.error(`  Failed: ${err.message}`);
        return false;
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  return false;
}

async function downloadBatch(items, concurrency = 8) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchPromises = batch.map(async (item) => {
      const { id, url, dest } = item;
      const success = await downloadWithRetry(url, dest);
      if (success) {
        const size = fs.statSync(dest).size;
        console.log(`  [OK] ${id} (${(size / 1024).toFixed(1)}KB)`);
      } else {
        console.log(`  [FAIL] ${id}`);
      }
      return { id, success };
    });
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    if (i + concurrency < items.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return results;
}

async function main() {
  // 只下载有 imageUrl 的提示词，且跳过已存在的
  const downloadList = [];
  for (const p of prompts) {
    if (!p.imageUrl) continue;
    const dest = path.join(IMAGES_DIR, `${p.id}.jpg`);
    if (fs.existsSync(dest)) {
      console.log(`  [SKIP] ${p.id} (already exists)`);
      continue;
    }
    downloadList.push({ id: p.id, url: p.imageUrl, dest });
  }

  if (downloadList.length === 0) {
    console.log("All images already downloaded.");
  } else {
    console.log(`Downloading ${downloadList.length} images (concurrency=8)...\n`);
    const results = await downloadBatch(downloadList, 8);
    const successCount = results.filter((r) => r.success).length;
    console.log(`\nDownloaded: ${successCount}/${downloadList.length}`);
  }

  // 更新 prompts.json 指向本地路径
  console.log("\nUpdating prompts.json with local paths...");
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
  console.log(`Updated ${updatedCount} prompts to use local images.`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
