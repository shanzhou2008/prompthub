// 为图片提示词从 Pexels 获取真实匹配图片（分批处理，避免 rate limit）
// 使用: node scripts/gen-images.cjs YOUR_PEXELS_API_KEY
const fs = require('fs');
const path = require('path');

const API_KEY = process.argv[2] || process.env.PEXELS_API_KEY;
if (!API_KEY) {
  console.error('请提供 Pexels API Key');
  process.exit(1);
}

const TAG_TRANSLATION = {
  '自然风光': 'nature landscape', '雪山': 'snow mountain', '日出': 'sunrise',
  '航拍': 'aerial', '雨林': 'rainforest', '晨雾': 'morning mist',
  '星空': 'starry sky', '银河': 'milky way', '沙漠': 'desert',
  '冰川': 'glacier', '瀑布': 'waterfall', '彩虹': 'rainbow',
  '峡谷': 'canyon', '草原': 'grassland', '极光': 'aurora',
  '樱花': 'cherry blossom', '红叶': 'autumn maple', '海岸': 'coast',
  '悬崖': 'cliff', '盐湖': 'salt lake', '日落': 'sunset',
  '城市': 'city', '东京': 'tokyo', '霓虹': 'neon',
  '纽约': 'new york', '香港': 'hong kong', '上海': 'shanghai',
  '巴黎': 'paris', '伦敦': 'london', '首尔': 'seoul',
  '人像': 'portrait', '回眸': 'woman portrait', '老人': 'elder portrait',
  '舞者': 'dancer', '少女': 'young woman', '孩童': 'child',
  '武士': 'samurai', '厨师': 'chef', '画家': 'painter',
  '美食': 'food', '汉堡': 'burger', '寿司': 'sushi',
  '拉面': 'ramen', '蛋糕': 'cake', '咖啡': 'coffee',
  '产品': 'product', '香水': 'perfume', '手表': 'watch',
  '运动鞋': 'sneaker', '珠宝': 'jewelry', '化妆品': 'cosmetic',
  'Logo': 'logo design', 'UI': 'ui design', '建筑': 'architecture',
  '动漫': 'anime', '吉卜力': 'studio ghibli', '科幻': 'science fiction',
  '奇幻': 'fantasy', '赛博朋克': 'cyberpunk', '水彩': 'watercolor',
  '油画': 'oil painting', '3D': '3d render', '像素': 'pixel art',
  '水墨': 'chinese ink', '动物': 'animal', '萌宠': 'cute pet',
};

const FALLBACK_KEYWORDS = [
  'nature', 'portrait', 'city', 'food', 'technology', 'art', 'animal', 'travel'
];

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function buildSearchQuery(title, tags) {
  const parts = [title, ...(tags || [])];
  const keywords = [];
  for (const part of parts) {
    if (!part) continue;
    for (const [zh, en] of Object.entries(TAG_TRANSLATION)) {
      if (part.includes(zh)) keywords.push(en);
    }
  }
  if (keywords.length > 0) return keywords.slice(0, 3).join(' ');
  return FALLBACK_KEYWORDS[hashCode(title) % FALLBACK_KEYWORDS.length];
}

async function searchPexels(query, retries = 3) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: { 'Authorization': API_KEY } });
      if (res.status === 429) {
        console.log(`  ⏳ Rate limit, waiting ${(i+1)*3}s...`);
        await new Promise(r => setTimeout(r, (i+1)*3000));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.photos || null;
    } catch (e) {
      if (i === retries - 1) return null;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  return null;
}

async function main() {
  const dataFile = path.join(__dirname, '..', 'api', 'data', 'prompts.json');
  const prompts = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  const imagePrompts = prompts.filter(p => p.type === 'image');
  
  console.log(`📷 图片提示词: ${imagePrompts.length}`);
  let success = 0, failed = 0;
  const usedIds = new Set();

  for (let i = 0; i < imagePrompts.length; i++) {
    const p = imagePrompts[i];
    // 跳过已经有 Pexels 图片的
    if (p.imageUrl?.includes('images.pexels.com')) {
      success++;
      continue;
    }
    
    const query = buildSearchQuery(p.title, p.tags);
    process.stdout.write(`[${i+1}/${imagePrompts.length}] "${p.title}" → "${query}" ... `);
    
    const photos = await searchPexels(query);
    if (!photos || photos.length === 0) {
      console.log('✗');
      failed++;
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }
    
    let chosen = photos.find(ph => !usedIds.has(ph.id)) || photos[0];
    usedIds.add(chosen.id);
    
    const idx = prompts.findIndex(x => x.id === p.id);
    prompts[idx].imageUrl = chosen.src.medium;
    prompts[idx].imageLgUrl = chosen.src.large;
    prompts[idx].source = 'pexels';
    prompts[idx].pexelsPhotoId = chosen.id;
    
    console.log(`✓ ${chosen.id}`);
    success++;
    await new Promise(r => setTimeout(r, 2000)); // 2秒间隔避免 rate limit
  }

  fs.writeFileSync(dataFile, JSON.stringify(prompts, null, 2));
  console.log(`\n✅ 完成: 成功 ${success}, 失败 ${failed}`);
}

main().catch(e => { console.error('错误:', e); process.exit(1); });