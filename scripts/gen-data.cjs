// 生成静态 JSON 数据，供 Vercel Serverless API 使用
// 运行: node scripts/gen-data.cjs
const fs = require('fs');
const path = require('path');

// 动态 import backend store
async function main() {
  // 用 tsx 临时加载 ts 文件
  const { execSync } = require('child_process');
  
  // 写一个临时 mjs 来导入 store 并输出 JSON
  const tmpFile = path.join(__dirname, '_tmp_gen.mjs');
  const code = `
import { prompts, users, collections, favorites, projects } from '../backend/store.ts';
const publicPrompts = prompts.filter(p => p.status === 'published' && p.visibility === 'public');
const data = { prompts: publicPrompts, users: users.map(u => ({...u, passwordHash: undefined})), collections, favorites, projects };
console.log(JSON.stringify(data));
`;
  fs.writeFileSync(tmpFile, code);
  
  // 用 esbuild-register 或 tsx 运行
  try {
    const result = execSync(`npx tsx ${tmpFile}`, { encoding: 'utf8', cwd: path.join(__dirname, '..') });
    const data = JSON.parse(result);
    
    const outDir = path.join(__dirname, '..', 'api', 'data');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    
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
    
    fs.writeFileSync(path.join(outDir, 'prompts.json'), JSON.stringify(data.prompts));
    fs.writeFileSync(path.join(outDir, 'stats.json'), JSON.stringify(stats));
    fs.writeFileSync(path.join(outDir, 'filters.json'), JSON.stringify({ models, tags }));
    fs.writeFileSync(path.join(outDir, 'users.json'), JSON.stringify(data.users));
    fs.writeFileSync(path.join(outDir, 'collections.json'), JSON.stringify(data.collections));
    fs.writeFileSync(path.join(outDir, 'favorites.json'), JSON.stringify(data.favorites));
    fs.writeFileSync(path.join(outDir, 'projects.json'), JSON.stringify(data.projects));
    
    console.log(`✓ 生成 ${data.prompts.length} 条 prompts 数据`);
    console.log(`✓ 生成 ${models.length} 个模型`);
    console.log(`✓ 生成 ${tags.length} 个标签`);
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
