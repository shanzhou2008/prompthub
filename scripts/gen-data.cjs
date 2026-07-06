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

// 从提示词内容生成简洁的图片描述（去掉 MJ/SD 参数，缩短到关键画面描述）
function buildImagePrompt(title, content, contentZh, type) {
  // 去掉 Midjourney / SD 专用参数
  const cleaned = (content || title)
    .replace(/--\w+\s+\S+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (type === 'image') {
    // 生图：用核心描述（取前 150 字符），加质量词
    const core = cleaned.slice(0, 150);
    return `${core}, masterpiece, best quality, ultra detailed`;
  }

  if (type === 'video') {
    // 生视频：生成视频关键帧，更像电影截图
    const core = cleaned.slice(0, 150);
    return `cinematic still frame, ${core}, photorealistic, dramatic lighting, 8k`;
  }

  // 任务类型：科技可视化
  return `futuristic holographic dashboard for "${title}", dark UI, neon cyan and purple, abstract data visualization, ultra detailed`;
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
