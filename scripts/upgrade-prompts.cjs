// 高质量提示词生成脚本
// 使用: node scripts/upgrade-prompts.cjs
const fs = require('fs');
const path = require('path');

// 艺术家风格库
const ARTISTS = {
  portrait: ['greg rutkowski', 'loish', 'artgerm', 'sakimichan', 'ilya kuvshinov', 'krenz cushart', 'mandy jurgens'],
  landscape: ['ansel adams', 'greg rutkowski', 'albert bierstadt', 'thomas cole', 'claude monet', 'vincent van gogh', 'caspar david friedrich'],
  anime: ['makoto shinkai', 'studio ghibli', 'hayao miyazaki', 'yoshiyuki sadamoto', 'a-1 pictures', 'trigger studio'],
  concept: ['greg rutkowski', 'james jean', 'beeple', 'artstation trending', 'cinematic concept art', 'video game concept'],
  cyberpunk: ['blade runner', 'ghost in the shell', 'cyberpunk 2077', 'syd mead', 'moebius'],
  food: ['bon appétit photography', 'food network style', 'michellin star plating', 'gordon ramsay style'],
  product: ['apple product photography', 'dyson product design', 'luxury branding', 'high end commercial'],
  architecture: ['le corbusier', 'frank lloyd wright', 'norman foster', 'architectural digest', 'archdaily'],
  wildlife: ['national geographic', 'steve mccurry', 'david attenborough', 'wildlife photography'],
  sciFi: ['blade runner', 'dune', 'star wars', 'mass effect', 'cyberpunk 2077'],
  fantasy: ['lord of the rings', 'game of thrones', 'dark souls', 'elden ring', 'final fantasy'],
  watercolor: ['john singer sargent', 'winslow homer', 'claude monet', 'watercolor master'],
  oil: ['rembrandt', 'vincent van gogh', 'claude monet', 'pablo picasso', 'salvador dali'],
  pixel: ['stardew valley', 'celeste', 'hyper light drifter', 'undertale', 'retro game art'],
  ink: ['qi baishi', 'xu beihong', 'wu changshuo', 'traditional chinese ink'],
  ui: ['dribbble', 'behance', 'apple design', 'google material design', 'wwdc design'],
};

// 摄影参数库
const CAMERAS = {
  portrait: { lens: ['85mm f1.4', '50mm f1.2', '135mm f2.0'], settings: ['shallow depth of field', 'bokeh', 'film grain', 'soft lighting'] },
  landscape: { lens: ['16-35mm f2.8', '24-70mm f2.8', '14mm f2.8'], settings: ['ultra wide', 'deep depth of field', 'long exposure', 'hdr'] },
  macro: { lens: ['100mm macro', '60mm macro'], settings: ['macro photography', 'extreme close up', 'shallow dof', 'ring light'] },
  food: { lens: ['50mm f1.4', '85mm f1.8', '100mm macro'], settings: ['side lighting', 'soft shadows', 'food styling', 'appetizing'] },
};

// 风格化参数映射
const STYLE_PARAMS = {
  cinematic: '--stylize 500 --v 6',
  artistic: '--stylize 750 --v 6',
  photorealistic: '--stylize 250 --v 6',
  detailed: '--stylize 600 --v 6',
  minimalist: '--stylize 150 --v 6',
  epic: '--stylize 800 --v 6',
  anime: '--stylize 500 --niji 6 --v 6',
  portrait: '--stylize 300 --v 6',
  landscape: '--stylize 400 --v 6',
};

// 增强提示词函数
function enhancePrompt(title, content, contentZh, tags, model) {
  let enhancedEn = content;
  let enhancedZh = contentZh;
  
  // 分析主题
  const themes = [];
  if (tags.some(t => ['人像', 'portrait', '人物'].includes(t))) themes.push('portrait');
  if (tags.some(t => ['风景', 'landscape', '山水'].includes(t))) themes.push('landscape');
  if (tags.some(t => ['动漫', 'anime', '二次元'].includes(t))) themes.push('anime');
  if (tags.some(t => ['概念艺术', 'concept'].includes(t))) themes.push('concept');
  if (tags.some(t => ['赛博朋克', 'cyberpunk'].includes(t))) themes.push('cyberpunk');
  if (tags.some(t => ['美食', 'food'].includes(t))) themes.push('food');
  if (tags.some(t => ['产品', 'product'].includes(t))) themes.push('product');
  if (tags.some(t => ['建筑', 'architecture'].includes(t))) themes.push('architecture');
  if (tags.some(t => ['动物', 'wildlife'].includes(t))) themes.push('wildlife');
  if (tags.some(t => ['科幻', 'sci-fi'].includes(t))) themes.push('sciFi');
  if (tags.some(t => ['奇幻', 'fantasy'].includes(t))) themes.push('fantasy');
  if (tags.some(t => ['水彩', 'watercolor'].includes(t))) themes.push('watercolor');
  if (tags.some(t => ['油画', 'oil'].includes(t))) themes.push('oil');
  if (tags.some(t => ['像素', 'pixel'].includes(t))) themes.push('pixel');
  if (tags.some(t => ['水墨', 'ink'].includes(t))) themes.push('ink');
  if (tags.some(t => ['UI', 'ui'].includes(t))) themes.push('ui');
  
  const primaryTheme = themes[0] || 'photorealistic';
  
  // 添加艺术家风格
  const artists = ARTISTS[primaryTheme] || [];
  const randomArtist = artists[Math.floor(Math.random() * artists.length)];
  
  // 添加摄影参数
  const camera = CAMERAS[primaryTheme] || CAMERAS.portrait;
  const randomLens = camera.lens[Math.floor(Math.random() * camera.lens.length)];
  const randomSetting = camera.settings[Math.floor(Math.random() * camera.settings.length)];
  
  // 添加风格化参数
  const styleParam = STYLE_PARAMS[primaryTheme] || STYLE_PARAMS.photorealistic;
  
  // 构建增强的英文提示词
  const additionsEn = [];
  if (randomArtist && !content.toLowerCase().includes(randomArtist.toLowerCase())) {
    additionsEn.push(`by ${randomArtist}`);
  }
  if (randomLens && !content.includes('mm')) {
    additionsEn.push(randomLens);
  }
  if (randomSetting && !content.toLowerCase().includes(randomSetting.toLowerCase())) {
    additionsEn.push(randomSetting);
  }
  
  // 确保有分辨率和质量描述
  if (!content.toLowerCase().includes('8k') && !content.toLowerCase().includes('4k')) {
    additionsEn.push('8k');
  }
  if (!content.toLowerCase().includes('ultra realistic') && !content.toLowerCase().includes('photorealistic')) {
    additionsEn.push('ultra realistic');
  }
  
  // 添加艺术平台标签
  if (!content.toLowerCase().includes('artstation') && !content.toLowerCase().includes('cinematic')) {
    additionsEn.push('artstation');
  }
  
  // 构建增强的中文提示词
  const additionsZh = [];
  if (randomArtist) {
    additionsZh.push(`${randomArtist} 风格`);
  }
  if (randomLens) {
    additionsZh.push(`${randomLens} 镜头`);
  }
  if (randomSetting) {
    additionsZh.push(randomSetting);
  }
  additionsZh.push('8K超高清');
  additionsZh.push('超写实');
  additionsZh.push('ArtStation 热门');
  
  // 组合
  enhancedEn = `${content}, ${additionsEn.join(', ')}, ${styleParam}`;
  enhancedZh = `${contentZh}，${additionsZh.join('，')}`;
  
  // 移除重复项
  const seenEn = new Set();
  enhancedEn = enhancedEn.split(', ').filter(p => {
    const clean = p.trim().toLowerCase();
    if (seenEn.has(clean)) return false;
    seenEn.add(clean);
    return true;
  }).join(', ');
  
  const seenZh = new Set();
  enhancedZh = enhancedZh.split('，').filter(p => {
    const clean = p.trim();
    if (seenZh.has(clean)) return false;
    seenZh.add(clean);
    return true;
  }).join('，');
  
  return { enhancedEn, enhancedZh };
}

// 主函数
function main() {
  const dataFile = path.join(__dirname, '..', 'api', 'data', 'prompts.json');
  const prompts = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  
  console.log(`📝 共 ${prompts.length} 个提示词`);
  
  let enhancedCount = 0;
  
  for (const p of prompts) {
    const originalLen = p.content.length;
    const { enhancedEn, enhancedZh } = enhancePrompt(p.title, p.content, p.contentZh, p.tags, p.model);
    
    p.content = enhancedEn;
    p.contentZh = enhancedZh;
    p.enhanced = true;
    
    const newLen = p.content.length;
    const diff = newLen - originalLen;
    if (diff > 0) {
      enhancedCount++;
    }
  }
  
  fs.writeFileSync(dataFile, JSON.stringify(prompts, null, 2));
  console.log(`✅ 完成: ${enhancedCount} 个提示词已增强`);
  console.log(`📦 数据已更新: ${dataFile}`);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
