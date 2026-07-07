// 提示词平台爬虫 - 从真实来源爬取提示词和对应图片
// 使用: node scripts/scrape-prompts.cjs
const fs = require('fs');
const path = require('path');
const https = require('https');

// 请求函数
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...options.headers
      },
      ...options
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// Civitai 爬虫
async function scrapeCivitai(modelType = 'Stable%20Diffusion', limit = 50) {
  console.log(`🔍 爬取 Civitai ${modelType}...`);
  const prompts = [];
  
  try {
    const url = `https://civitai.com/api/v1/models?modelType=${modelType}&limit=${limit}&sort=mostDownloaded`;
    const res = await fetch(url);
    
    let json;
    try {
      json = JSON.parse(res.body);
    } catch {
      console.log('  ✗ JSON解析失败');
      return prompts;
    }
    
    if (!json.items || json.items.length === 0) {
      console.log('  ✗ 无结果');
      return prompts;
    }
    
    for (const item of json.items) {
      if (!item.modelVersions || item.modelVersions.length === 0) continue;
      
      const version = item.modelVersions[0];
      const imageUrl = version.images?.[0]?.url;
      const previewUrl = version.images?.[0]?.hash ? 
        `https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/${version.images[0].hash}/width=512/` : null;
      
      prompts.push({
        title: item.name,
        content: item.description || '',
        contentEn: item.description || '',
        contentZh: '',
        tags: item.tags || [],
        model: 'stable-diffusion',
        type: 'image',
        imageUrl: previewUrl || imageUrl,
        sourceUrl: `https://civitai.com/models/${item.id}`,
        source: 'crawled',
      });
    }
    
    console.log(`  ✓ 获取 ${prompts.length} 个提示词`);
  } catch (e) {
    console.log(`  ✗ 失败: ${e.message}`);
  }
  
  return prompts;
}

// Reddit 爬虫
async function scrapeReddit(subreddit = 'StableDiffusion', limit = 30) {
  console.log(`🔍 爬取 Reddit r/${subreddit}...`);
  const prompts = [];
  
  try {
    const url = `https://www.reddit.com/r/${subreddit}/top.json?t=week&limit=${limit}`;
    const res = await fetch(url);
    
    let json;
    try {
      json = JSON.parse(res.body);
    } catch {
      console.log('  ✗ JSON解析失败');
      return prompts;
    }
    
    if (!json.data || !json.data.children) {
      console.log('  ✗ 无结果');
      return prompts;
    }
    
    for (const child of json.data.children) {
      const post = child.data;
      if (!post.url || post.is_self) continue;
      
      const imageUrl = post.url.endsWith('.jpg') || post.url.endsWith('.png') || post.url.includes('i.redd.it') 
        ? post.url : null;
      
      let prompt = '';
      if (post.title && post.title.includes(']')) {
        const match = post.title.match(/\[.*?\]\s*(.+)/);
        if (match) prompt = match[1];
      } else {
        prompt = post.title;
      }
      
      if (imageUrl && prompt) {
        prompts.push({
          title: post.title.substring(0, 100),
          content: prompt,
          contentEn: prompt,
          contentZh: '',
          tags: [],
          model: 'stable-diffusion',
          type: 'image',
          imageUrl,
          sourceUrl: `https://reddit.com${post.permalink}`,
          source: 'crawled',
        });
      }
    }
    
    console.log(`  ✓ 获取 ${prompts.length} 个提示词`);
  } catch (e) {
    console.log(`  ✗ 失败: ${e.message}`);
  }
  
  return prompts;
}

// PromptHero 爬虫
async function scrapePromptHero(category = 'best-prompts', limit = 30) {
  console.log(`🔍 爬取 PromptHero ${category}...`);
  const prompts = [];
  
  try {
    const url = `https://prompthero.com/api/prompts/${category}?limit=${limit}`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Referer': 'https://prompthero.com/'
      }
    });
    
    let json;
    try {
      json = JSON.parse(res.body);
    } catch {
      console.log('  ✗ JSON解析失败');
      return prompts;
    }
    
    if (!json || !Array.isArray(json)) {
      console.log('  ✗ 无结果');
      return prompts;
    }
    
    for (const item of json) {
      const imageUrl = item.image_url || item.thumbnail_url;
      if (!imageUrl || !item.text) continue;
      
      prompts.push({
        title: item.title || item.text.substring(0, 50),
        content: item.text,
        contentEn: item.text,
        contentZh: '',
        tags: item.tags || [],
        model: item.model || 'midjourney',
        type: 'image',
        imageUrl,
        sourceUrl: `https://prompthero.com/prompt/${item.id || item.slug}`,
        source: 'crawled',
      });
    }
    
    console.log(`  ✓ 获取 ${prompts.length} 个提示词`);
  } catch (e) {
    console.log(`  ✗ 失败: ${e.message}`);
  }
  
  return prompts;
}

// 合并到 prompts.json
async function mergeAndSave(newPrompts) {
  const dataFile = path.join(__dirname, '..', 'api', 'data', 'prompts.json');
  const existing = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  
  console.log(`\n📊 现有提示词: ${existing.length}`);
  console.log(`📥 新爬取: ${newPrompts.length}`);
  
  // 去重（根据标题）
  const existingTitles = new Set(existing.map(p => p.title.toLowerCase()));
  const uniqueNew = newPrompts.filter(p => !existingTitles.has(p.title.toLowerCase()));
  
  console.log(`✅ 新增唯一提示词: ${uniqueNew.length}`);
  
  // 添加必要字段
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
    
    // 如果没有 imageLgUrl，用 imageUrl
    if (p.imageUrl && !p.imageLgUrl) {
      p.imageLgUrl = p.imageUrl;
    }
  }
  
  // 合并
  const merged = [...existing, ...uniqueNew];
  fs.writeFileSync(dataFile, JSON.stringify(merged, null, 2));
  
  console.log(`📦 总提示词: ${merged.length}`);
  console.log(`✅ 数据已保存到 ${dataFile}`);
}

// 主函数
async function main() {
  const allPrompts = [];
  
  // 爬取各个平台
  allPrompts.push(...await scrapeCivitai('Stable%20Diffusion', 30));
  await new Promise(r => setTimeout(r, 2000));
  
  allPrompts.push(...await scrapeCivitai('AI%20Art', 20));
  await new Promise(r => setTimeout(r, 2000));
  
  allPrompts.push(...await scrapeReddit('StableDiffusion', 20));
  await new Promise(r => setTimeout(r, 2000));
  
  allPrompts.push(...await scrapeReddit('Midjourney', 20));
  await new Promise(r => setTimeout(r, 2000));
  
  allPrompts.push(...await scrapePromptHero('best-prompts', 30));
  
  // 保存
  await mergeAndSave(allPrompts);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
