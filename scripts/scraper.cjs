// ====================
// 提示词平台爬虫脚本
// 运行方式: node scripts/scraper.cjs
// 需要: 安装 axios (npm install axios -g)
// ====================

const fs = require('fs');
const path = require('path');
const axios = require('axios').default;

const CONFIG = {
  outputDir: path.join(__dirname, '..', 'api', 'data'),
  imageDir: path.join(__dirname, '..', 'public', 'images'),
  limitPerSource: 30,
  delay: 1500,
};

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function saveImage(url, filename) {
  try {
    const response = await axios({ url, responseType: 'arraybuffer' });
    const filepath = path.join(CONFIG.imageDir, filename);
    fs.writeFileSync(filepath, Buffer.from(response.data));
    return `/images/${filename}`;
  } catch (e) {
    console.log(`  ❌ 保存图片失败: ${e.message}`);
    return null;
  }
}

// ===== Civitai 爬虫 =====
async function scrapeCivitai() {
  console.log('\n🔍 爬取 Civitai...');
  const prompts = [];
  
  try {
    const url = `https://civitai.com/api/v1/models?modelType=Stable%20Diffusion&limit=${CONFIG.limitPerSource}&sort=mostDownloaded`;
    const res = await axios.get(url);
    
    if (!res.data.items || res.data.items.length === 0) {
      console.log('  ❌ 无结果');
      return prompts;
    }
    
    for (const item of res.data.items) {
      if (!item.modelVersions || item.modelVersions.length === 0) continue;
      
      const version = item.modelVersions[0];
      const imageInfo = version.images?.[0];
      if (!imageInfo) continue;
      
      const imageUrl = imageInfo.url;
      const hash = imageInfo.hash;
      const previewUrl = hash ? `https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/${hash}/width=512/` : imageUrl;
      
      const localPath = await saveImage(previewUrl, `civitai_${item.id}.jpg`);
      
      prompts.push({
        title: item.name,
        content: item.description || '',
        contentEn: item.description || '',
        contentZh: '',
        tags: item.tags || [],
        model: 'stable-diffusion',
        type: 'image',
        imageUrl: localPath || previewUrl,
        imageLgUrl: localPath || imageUrl,
        sourceUrl: `https://civitai.com/models/${item.id}`,
        source: 'crawled',
      });
      
      console.log(`  ✅ "${item.name}"`);
      await delay(CONFIG.delay);
    }
  } catch (e) {
    console.log(`  ❌ 爬取失败: ${e.message}`);
  }
  
  return prompts;
}

// ===== PromptHero 爬虫 =====
async function scrapePromptHero() {
  console.log('\n🔍 爬取 PromptHero...');
  const prompts = [];
  
  try {
    const url = `https://prompthero.com/api/prompts/best-prompts?limit=${CONFIG.limitPerSource}`;
    const res = await axios.get(url, {
      headers: {
        'Referer': 'https://prompthero.com/'
      }
    });
    
    if (!res.data || !Array.isArray(res.data)) {
      console.log('  ❌ 无结果');
      return prompts;
    }
    
    for (const item of res.data) {
      const imageUrl = item.image_url || item.thumbnail_url;
      if (!imageUrl || !item.text) continue;
      
      const filename = `prompthero_${item.id || Date.now()}.jpg`;
      const localPath = await saveImage(imageUrl, filename);
      
      prompts.push({
        title: item.title || item.text.substring(0, 50),
        content: item.text,
        contentEn: item.text,
        contentZh: '',
        tags: item.tags || [],
        model: item.model || 'midjourney',
        type: 'image',
        imageUrl: localPath || imageUrl,
        imageLgUrl: localPath || imageUrl,
        sourceUrl: `https://prompthero.com/prompt/${item.id || item.slug}`,
        source: 'crawled',
      });
      
      console.log(`  ✅ "${item.title || item.text.substring(0, 30)}..."`);
      await delay(CONFIG.delay);
    }
  } catch (e) {
    console.log(`  ❌ 爬取失败: ${e.message}`);
  }
  
  return prompts;
}

// ===== Reddit r/Midjourney 爬虫 =====
async function scrapeReddit() {
  console.log('\n🔍 爬取 Reddit r/Midjourney...');
  const prompts = [];
  
  try {
    const url = `https://www.reddit.com/r/Midjourney/top.json?t=week&limit=${CONFIG.limitPerSource}`;
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!res.data.data || !res.data.data.children) {
      console.log('  ❌ 无结果');
      return prompts;
    }
    
    for (const child of res.data.data.children) {
      const post = child.data;
      if (!post.url || post.is_self) continue;
      
      const imageUrl = post.url;
      if (!imageUrl.match(/\.(jpg|png|webp)$/) && !imageUrl.includes('i.redd.it')) continue;
      
      let prompt = '';
      if (post.title && post.title.includes(']')) {
        const match = post.title.match(/\[.*?\]\s*(.+)/);
        if (match) prompt = match[1];
      }
      if (!prompt && post.selftext) {
        prompt = post.selftext.substring(0, 500);
      }
      if (!prompt) continue;
      
      const filename = `reddit_${post.id}.jpg`;
      const localPath = await saveImage(imageUrl, filename);
      
      prompts.push({
        title: post.title.substring(0, 100),
        content: prompt,
        contentEn: prompt,
        contentZh: '',
        tags: [],
        model: 'midjourney',
        type: 'image',
        imageUrl: localPath || imageUrl,
        imageLgUrl: localPath || imageUrl,
        sourceUrl: `https://reddit.com${post.permalink}`,
        source: 'crawled',
      });
      
      console.log(`  ✅ "${post.title.substring(0, 30)}..."`);
      await delay(CONFIG.delay);
    }
  } catch (e) {
    console.log(`  ❌ 爬取失败: ${e.message}`);
  }
  
  return prompts;
}

// ===== PromptBase 爬虫 =====
async function scrapePromptBase() {
  console.log('\n🔍 爬取 PromptBase...');
  const prompts = [];
  
  try {
    const url = 'https://promptbase.com/api/prompts/search?q=&sort=popular&limit=30';
    const res = await axios.get(url, {
      headers: {
        'Referer': 'https://promptbase.com/',
        'Accept': 'application/json'
      }
    });
    
    if (!res.data || !res.data.results) {
      console.log('  ❌ 无结果');
      return prompts;
    }
    
    for (const item of res.data.results) {
      if (!item.prompt_text || !item.image_url) continue;
      
      const filename = `promptbase_${item.id}.jpg`;
      const localPath = await saveImage(item.image_url, filename);
      
      prompts.push({
        title: item.title || 'Untitled',
        content: item.prompt_text,
        contentEn: item.prompt_text,
        contentZh: '',
        tags: item.tags || [],
        model: item.model || 'gpt-4',
        type: item.type === 'image' ? 'image' : 'task',
        imageUrl: localPath || item.image_url,
        imageLgUrl: localPath || item.image_url,
        sourceUrl: `https://promptbase.com/p/${item.id}`,
        source: 'crawled',
      });
      
      console.log(`  ✅ "${item.title}"`);
      await delay(CONFIG.delay);
    }
  } catch (e) {
    console.log(`  ❌ 爬取失败: ${e.message}`);
  }
  
  return prompts;
}

// ===== 合并数据 =====
function mergeAndSave(newPrompts) {
  const dataFile = path.join(CONFIG.outputDir, 'prompts.json');
  let existing = [];
  
  try {
    existing = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } catch {
    console.log('⚠️ prompts.json 不存在，创建新文件');
  }
  
  console.log(`\n📊 现有提示词: ${existing.length}`);
  console.log(`📥 新爬取: ${newPrompts.length}`);
  
  const existingTitles = new Set(existing.map(p => p.title.toLowerCase()));
  const uniqueNew = newPrompts.filter(p => !existingTitles.has(p.title.toLowerCase()));
  
  console.log(`✅ 新增唯一提示词: ${uniqueNew.length}`);
  
  const now = new Date().toISOString();
  for (const p of uniqueNew) {
    p.id = `crawl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    p.vendor = p.model ? p.model.charAt(0).toUpperCase() + p.model.slice(1) : 'Unknown';
    p.params = {};
    p.language = 'en';
    p.hue = Math.floor(Math.random() * 360);
    p.pattern = ['mesh', 'orbs', 'rings', 'waves', 'grid', 'aurora'][Math.floor(Math.random() * 6)];
    p.viewCount = 0;
    p.copyCount = 0;
    p.ratingAvg = 0;
    p.ratingCount = 0;
    p.isFeatured = false;
    p.status = 'published';
    p.visibility = 'public';
    p.createdAt = now;
    p.updatedAt = now;
  }
  
  const merged = [...existing, ...uniqueNew];
  fs.writeFileSync(dataFile, JSON.stringify(merged, null, 2));
  
  console.log(`📦 总提示词: ${merged.length}`);
  console.log(`✅ 数据已保存到 ${dataFile}`);
}

// ===== 主函数 =====
async function main() {
  console.log('🚀 提示词平台爬虫启动');
  
  if (!fs.existsSync(CONFIG.imageDir)) {
    fs.mkdirSync(CONFIG.imageDir, { recursive: true });
    console.log(`📁 创建图片目录: ${CONFIG.imageDir}`);
  }
  
  const allPrompts = [];
  
  allPrompts.push(...await scrapeCivitai());
  allPrompts.push(...await scrapePromptHero());
  allPrompts.push(...await scrapeReddit());
  allPrompts.push(...await scrapePromptBase());
  
  mergeAndSave(allPrompts);
  
  console.log('\n🎉 爬取完成！');
}

main().catch(e => {
  console.error('💥 致命错误:', e);
  process.exit(1);
});
