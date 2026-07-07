// 生成静态 JSON 数据，供 Vercel Serverless API 使用
// 运行: node scripts/gen-data.cjs
const fs = require('fs');
const path = require('path');

// 简单哈希函数
function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// 从提示词内容生成高质量图片描述
function buildImagePrompt(title, content, contentZh, type) {
  const cleanedEn = (content || '')
    .replace(/--\w+\s+\S+/g, '')
    .replace(/\{[\w]+\}/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const cleanedZh = (contentZh || '').replace(/\{[\w]+\}/g, '').replace(/\s{2,}/g, ' ').trim();

  const titleEn = title.replace(/\{[\w]+\}/g, '').trim();
  const titleZh = title.replace(/\{[\w]+\}/g, '').trim();

  const isChinese = cleanedZh.length > cleanedEn.length;

  if (type === 'image') {
    let core;
    if (isChinese) {
      core = cleanedZh.slice(0, 120) || titleZh;
    } else {
      core = cleanedEn.slice(0, 150) || titleEn;
    }

    const styleWords = [
      'ultra realistic',
      'photorealistic',
      '8k',
      'ultra detailed',
      'cinematic lighting',
      'professional photography',
      'masterpiece',
      'best quality',
      'sharp focus',
      'high contrast',
    ];

    if (core.includes('portrait') || core.includes('人像') || core.includes('face') || core.includes('woman') || core.includes('man')) {
      styleWords.push('beautiful face', 'elegant', 'soft lighting', 'bokeh', 'professional portrait');
    }
    if (core.includes('landscape') || core.includes('风景') || core.includes('mountains') || core.includes('ocean') || core.includes('sea')) {
      styleWords.push('epic landscape', 'vast', 'majestic', 'golden hour', 'natural lighting');
    }
    if (core.includes('anime') || core.includes('动漫') || core.includes('manga') || core.includes('ghibli') || core.includes('吉卜力')) {
      styleWords.push('anime style', 'studio ghibli', 'vibrant colors', 'detailed background');
    }
    if (core.includes('cyberpunk') || core.includes('赛博') || core.includes('neon')) {
      styleWords.push('cyberpunk', 'neon lighting', 'futuristic', 'dystopian', 'blade runner');
    }
    if (core.includes('food') || core.includes('美食') || core.includes('cake') || core.includes('sushi') || core.includes('ramen')) {
      styleWords.push('food photography', 'appetizing', 'warm lighting', 'professional food styling');
    }
    if (core.includes('product') || core.includes('产品') || core.includes('perfume') || core.includes('watch') || core.includes('phone')) {
      styleWords.push('product photography', 'studio lighting', 'clean background', 'premium', 'luxury');
    }
    if (core.includes('concept art') || core.includes('概念') || core.includes('fantasy') || core.includes('dragon') || core.includes('phoenix')) {
      styleWords.push('concept art', 'fantasy art', 'epic', 'dramatic', 'cinematic');
    }
    if (core.includes('architecture') || core.includes('建筑') || core.includes('building') || core.includes('house')) {
      styleWords.push('architectural photography', 'modern design', 'clean lines', 'professional');
    }
    if (core.includes('animal') || core.includes('动物') || core.includes('wildlife') || core.includes('cat') || core.includes('dog')) {
      styleWords.push('wildlife photography', 'natural behavior', 'professional', 'sharp detail');
    }
    if (core.includes('sci-fi') || core.includes('科幻') || core.includes('space') || core.includes('robot')) {
      styleWords.push('sci-fi', 'futuristic', 'cinematic', 'detailed', 'immersive');
    }

    return `${core}, ${styleWords.join(', ')}`;
  }

  if (type === 'video') {
    let core;
    if (isChinese) {
      core = cleanedZh.slice(0, 100) || titleZh;
    } else {
      core = cleanedEn.slice(0, 150) || titleEn;
    }

    const styleWords = [
      'cinematic still frame',
      'movie scene',
      'film still',
      'ultra realistic',
      '8k',
      'photorealistic',
      'dramatic lighting',
      'professional cinematography',
      'cinematic composition',
      'high quality',
    ];

    if (core.includes('timelapse') || core.includes('延时') || core.includes('sunrise') || core.includes('sunset')) {
      styleWords.push('time-lapse photography', 'golden hour', 'dramatic sky');
    }
    if (core.includes('aerial') || core.includes('航拍') || core.includes('drone')) {
      styleWords.push('aerial photography', 'drone shot', 'cinematic aerial');
    }
    if (core.includes('slow motion') || core.includes('慢动作') || core.includes('slowmo')) {
      styleWords.push('slow motion', 'high speed photography', 'freeze frame');
    }
    if (core.includes('underwater') || core.includes('水下') || core.includes('ocean')) {
      styleWords.push('underwater photography', 'marine life', 'blue water');
    }
    if (core.includes('sports') || core.includes('运动') || core.includes('basketball') || core.includes('surf')) {
      styleWords.push('sports photography', 'action shot', 'dynamic motion');
    }
    if (core.includes('dance') || core.includes('舞蹈') || core.includes('ballet')) {
      styleWords.push('dance photography', 'elegant movement', 'graceful');
    }
    if (core.includes('abstract') || core.includes('抽象') || core.includes('fluid') || core.includes('particles')) {
      styleWords.push('abstract art', 'visual effects', 'creative', 'artistic');
    }
    if (core.includes('fashion') || core.includes('时尚') || core.includes('model')) {
      styleWords.push('fashion photography', 'editorial', 'high fashion');
    }

    return `${core}, ${styleWords.join(', ')}`;
  }

  const taskStyleWords = [
    'futuristic holographic interface',
    'dark background',
    'neon cyan and purple',
    'abstract data visualization',
    'digital HUD',
    'technology',
    'modern UI',
    'glowing elements',
    'sci-fi aesthetic',
    'ultra detailed',
    '8k',
    'cinematic lighting',
  ];

  return `${titleEn || titleZh}, ${taskStyleWords.join(', ')}`;
}

// 生成 Pollinations 图片 URL
function generateImageUrl(title, content, contentZh, type, size = '768x512') {
  const prompt = buildImagePrompt(title, content, contentZh, type);
  const seed = hashCode(title);
  const [w, h] = size.split('x');
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&seed=${seed}&nologo=true&model=flux`;
}

// 动态 import backend store
async function main() {
  const { execSync } = require('child_process');
  
  const tmpFile = path.join(__dirname, '_tmp_gen.mjs');
  const code = `
import { prompts, users, collections, favorites, projects } from '../backend/store.ts';
const publicPrompts = prompts.filter(p => p.status === 'published' && p.visibility === 'public');
const data = { prompts: publicPrompts, users: users.map(u => ({...u, passwordHash: undefined})), collections, favorites, projects };
console.log(JSON.stringify(data));
`;
  fs.writeFileSync(tmpFile, code);
  
  try {
    const result = execSync(`npx tsx ${tmpFile}`, { encoding: 'utf8', cwd: path.join(__dirname, '..') });
    const data = JSON.parse(result);
    
    const outDir = path.join(__dirname, '..', 'api', 'data');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    
    // 为每个提示词预生成图片 URL
    const enrichPrompts = data.prompts.map(p => ({
      ...p,
      imageUrl: generateImageUrl(p.title, p.contentEn || p.content, p.contentZh, p.type, '768x512'),
      imageLgUrl: generateImageUrl(p.title, p.contentEn || p.content, p.contentZh, p.type, '1280x720'),
    }));
    
    // 计算 stats
    const stats = {
      total: data.prompts.length,
      image: data.prompts.filter(p => p.type === 'image').length,
      video: data.prompts.filter(p => p.type === 'video').length,
      task: data.prompts.filter(p => p.type === 'task').length,
      last7Days: 38,
      users: data.users.length,
      pendingSubmissions: 2,
      sources: 6,
      activeSources: 5,
    };
    
    // 计算 filters
    const modelMap = new Map();
    const tagMap = new Map();
    data.prompts.forEach(p => {
      modelMap.set(p.model, (modelMap.get(p.model) || 0) + 1);
      p.tags.forEach(t => tagMap.set(t, (tagMap.get(t) || 0) + 1));
    });
    const models = Array.from(modelMap.entries()).map(([name, count]) => ({
      name,
      vendor: name.includes('midjourney') ? 'Midjourney' : name.includes('flux') ? 'Black Forest Labs' : name.includes('stable') ? 'Stability AI' : (name.includes('dall') || name.includes('gpt') || name.includes('sora')) ? 'OpenAI' : name.includes('claude') ? 'Anthropic' : name.includes('gemini') ? 'Google' : 'Unknown',
      type: (name.includes('sora') || name.includes('kling') || name.includes('runway') || name.includes('jimeng') || name.includes('pika') || name.includes('hailuo')) ? 'video' : (name.includes('gpt') || name.includes('claude') || name.includes('gemini') || name.includes('deepseek')) ? 'task' : 'image',
      count,
    }));
    const tags = Array.from(tagMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    
    fs.writeFileSync(path.join(outDir, 'prompts.json'), JSON.stringify(enrichPrompts));
    fs.writeFileSync(path.join(outDir, 'stats.json'), JSON.stringify(stats));
    fs.writeFileSync(path.join(outDir, 'filters.json'), JSON.stringify({ models, tags }));
    fs.writeFileSync(path.join(outDir, 'users.json'), JSON.stringify(data.users));
    fs.writeFileSync(path.join(outDir, 'collections.json'), JSON.stringify(data.collections));
    fs.writeFileSync(path.join(outDir, 'favorites.json'), JSON.stringify(data.favorites));
    fs.writeFileSync(path.join(outDir, 'projects.json'), JSON.stringify(data.projects));
    
    console.log(`✓ 生成 ${enrichPrompts.length} 条 prompts 数据（含 imageUrl）`);
    console.log(`✓ 生成 ${models.length} 个模型`);
    console.log(`✓ 生成 ${tags.length} 个标签`);
    console.log(`示例图片 URL: ${enrichPrompts[0]?.imageUrl?.slice(0, 100)}...`);
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
