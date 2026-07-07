const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const DATA_DIR = path.join(process.cwd(), "api", "data");
const IMAGES_DIR = path.join(process.cwd(), "public", "images");

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

const prompts = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "prompts.json"), "utf8"));

function downloadWithCurl(url, destPath) {
  try {
    execSync(`curl -s --max-time 30 -o "${destPath}" "${url}"`, { stdio: "pipe" });
    const size = fs.statSync(destPath).size;
    return size > 1000;
  } catch {
    return false;
  }
}

function main() {
  let toDownload = [];
  for (const p of prompts) {
    if (!p.imageUrl) continue;
    const dest = path.join(IMAGES_DIR, `${p.id}.jpg`);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) continue;
    
    const url = p.imageUrl
      .replace("width=768&height=512", "width=400&height=300")
      .replace("width=1280&height=720", "width=800&height=600");
    toDownload.push({ id: p.id, url, dest });
  }

  console.log(`Total to download: ${toDownload.length}`);
  const start = Date.now();
  let success = 0, failed = 0;

  for (let i = 0; i < toDownload.length; i++) {
    const item = toDownload[i];
    let ok = false;
    for (let retry = 0; retry < 2; retry++) {
      ok = downloadWithCurl(item.url, item.dest);
      if (ok) break;
    }
    if (ok) success++;
    else { failed++; if (fs.existsSync(item.dest)) fs.unlinkSync(item.dest); }
    
    if ((i + 1) % 10 === 0 || i === toDownload.length - 1) {
      process.stdout.write(`\rProgress: ${i + 1}/${toDownload.length} (OK:${success} FAIL:${failed})`);
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nDone: ${success} OK, ${failed} failed, ${elapsed}s`);

  // Update prompts.json to use local paths
  const updated = prompts.map((p) => {
    const localPath = `/images/${p.id}.jpg`;
    const hasLocal = fs.existsSync(path.join(IMAGES_DIR, `${p.id}.jpg`)) && 
                     fs.statSync(path.join(IMAGES_DIR, `${p.id}.jpg`)).size > 1000;
    return {
      ...p,
      imageUrl: hasLocal ? localPath : p.imageUrl,
      imageLgUrl: hasLocal ? localPath : p.imageLgUrl,
    };
  });
  fs.writeFileSync(path.join(DATA_DIR, "prompts.json"), JSON.stringify(updated));
  console.log(`Updated prompts.json with local paths`);
}

main();
