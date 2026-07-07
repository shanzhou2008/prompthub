// 调用 Pexels API 搜索视频，给视频提示词分配真实匹配的视频
// 使用: node scripts/gen-videos.cjs <PEXELS_API_KEY>
const fs = require('fs');
const path = require('path');

const API_KEY = process.argv[2] || process.env.PEXELS_API_KEY;
if (!API_KEY) {
  console.error('请提供 Pexels API Key: node scripts/gen-videos.cjs YOUR_KEY');
  process.exit(1);
}

// 关键词翻译表（中英文标签 → 英文 Pexels 搜索词）
const TAG_TRANSLATION = {
  '自然风光': 'nature landscape', '延时摄影': 'timelapse', '雪山': 'snow mountain',
  '日出': 'sunrise', '航拍': 'aerial drone', '雨林': 'rainforest', '晨雾': 'morning mist',
  '体积光': 'light rays', '星空': 'starry sky', '银河': 'milky way', '沙漠': 'desert',
  '延时': 'timelapse', '冰川': 'glacier', '慢动作': 'slow motion', '纪录片': 'documentary',
  '极地': 'arctic', '火山': 'volcano', '熔岩': 'lava', '夜景': 'night', '瀑布': 'waterfall',
  '彩虹': 'rainbow', '峡谷': 'canyon', '电影感': 'cinematic', '草原': 'grassland',
  '野生动物': 'wildlife', '金色时刻': 'golden hour', '跟拍': 'tracking shot',
  '极光': 'aurora', '雪原': 'snowy', '樱花': 'cherry blossom', '河谷': 'valley',
  '春季': 'spring', '秋景': 'autumn', '红叶': 'maple', '高山湖': 'alpine lake',
  '倒影': 'reflection', '海岸': 'coast', '悬崖': 'cliff', '巨浪': 'big wave',
  '盐湖': 'salt lake', '日落': 'sunset', '极简': 'minimal', '城市延时': 'city timelapse',
  '东京': 'tokyo', '霓虹': 'neon', '赛博朋克': 'cyberpunk', '纽约': 'new york',
  '天际线': 'skyline', '蓝调时刻': 'blue hour', '香港': 'hong kong', '维港': 'victoria harbour',
  '上海': 'shanghai', '陆家嘴': 'lujiazui', '迪拜': 'dubai', '云海': 'sea of clouds',
  '巴黎': 'paris', '埃菲尔铁塔': 'eiffel tower', '浪漫': 'romantic', '伦敦': 'london',
  '雨夜': 'rain night', '街景': 'street', '氛围感': 'moody', '首尔': 'seoul',
  '车流': 'traffic', '光轨': 'light trail', '新加坡': 'singapore', '滨海湾': 'marina bay',
  '未来感': 'futuristic', '芝加哥': 'chicago', '高架铁路': 'elevated train', '黄昏': 'sunset',
  '都市': 'urban', '人物运镜': 'portrait', '人像': 'portrait', '回眸': 'turning',
  '浅景深': 'bokeh', '特写': 'close up', '老人': 'old man', '烟雾': 'smoke',
  '明暗对比': 'chiaroscuro', '舞蹈': 'dance', '旋转': 'spinning', '长裙': 'dress',
  '奔跑': 'running', '跟拍': 'tracking', '惊悚': 'thriller', '孩童': 'child',
  '气球': 'balloon', '温馨': 'warm', '武术': 'martial arts', '武士': 'samurai',
  '竹林': 'bamboo forest', '史诗': 'epic', '音乐': 'music', '钢琴': 'piano',
  '舞台': 'stage', '滑板': 'skateboard', '青春': 'youth', '厨师': 'chef',
  '火焰': 'flame', '美食': 'food', '画家': 'painter', '作画': 'painting',
  '艺术': 'art', '产品展示': 'product', '香水': 'perfume', '微距': 'macro',
  '高端': 'luxury', '手表': 'watch', '机械': 'mechanical', '精细': 'detailed',
  '运动鞋': 'sneaker', '悬浮': 'floating', '潮酷': 'cool', '手机': 'smartphone',
  '全息': 'hologram', '科技': 'technology', '咖啡': 'coffee', '拉花': 'latte art',
  '化妆品': 'cosmetic', '美妆': 'beauty', '珠宝': 'jewelry', '钻石': 'diamond',
  '奢华': 'luxury', '汽车': 'car', '跑车': 'sports car', '广告': 'advertising',
  '美食制作': 'cooking', '汉堡': 'burger', '寿司': 'sushi', '手工': 'handmade',
  '匠心': 'craftsmanship', '拉面': 'ramen', '热气': 'steam', '俯拍': 'top down',
  '巧克力': 'chocolate', '甜品': 'dessert', '披萨': 'pizza', '出炉': 'baking',
  '意式': 'italian', '蛋糕': 'cake', '装饰': 'decoration', '优雅': 'elegant',
  '牛排': 'steak', '煎烤': 'grilling', '拉茶': 'tea pouring', '街头': 'street',
  '文化': 'culture', '动画短片': 'animation', '3D动画': '3d animation', '狐狸': 'fox',
  '皮克斯': 'pixar', '魔法': 'magic', '黏土动画': 'claymation', '定格': 'stop motion',
  '怀旧': 'nostalgic', '剪影': 'silhouette', '皮影': 'shadow', '传统': 'traditional',
  '民间故事': 'folklore', '像素风': 'pixel art', '复古': 'retro', '游戏': 'game',
  '水墨': 'ink wash', '金鱼': 'goldfish', '诗意': 'poetic', '低多边形': 'low poly',
  '恐龙': 'dinosaur', '游戏CG': 'game cinematic', '趣味': 'fun', '手绘': 'hand drawn',
  '动漫': 'anime', '吉卜力': 'studio ghibli', '梦幻': 'dreamy', '机器人': 'robot',
  '科幻': 'sci-fi', '情感': 'emotional', '电影感': 'cinematic', '抽象艺术': 'abstract art',
  '流体': 'fluid', '颜料': 'paint', '几何': 'geometric', '变换': 'morphing',
  '动态图形': 'motion graphics', '粒子': 'particles', '光线': 'light', '霓虹辉光': 'neon glow',
  '液态金属': 'liquid metal', '反射': 'reflection', '未来': 'futuristic', '万花筒': 'kaleidoscope',
  '对称': 'symmetric', '迷幻': 'psychedelic', '色彩': 'colorful', '声波': 'sound wave',
  '可视化': 'visualization', '3D': '3d', '沉浸式': 'immersive', '分形': 'fractal',
  '递归': 'recursive', '数学': 'math', '烟雾': 'smoke', '人形': 'human figure',
  '神秘': 'mystery', '时尚走秀': 'fashion', '高定': 'haute couture', 'T台': 'runway',
  '华丽': 'glamorous', '潮牌': 'streetwear', '街头': 'street', '嘻哈': 'hip hop',
  '青年': 'youth', '旗袍': 'cheongsam', '上海': 'shanghai', '未来主义': 'futurism',
  '金属': 'metal', '前卫': 'avant garde', '婚纱': 'wedding dress', '飘逸': 'flowing',
  '运动装': 'sportswear', '健身': 'fitness', '皮草': 'fur', '风雪': 'blizzard',
  '大片': 'editorial', '民族': 'ethnic', '服饰': 'costume', '节庆': 'festival',
  '运动镜头': 'sports', '篮球': 'basketball', '扣篮': 'slam dunk', '冲浪': 'surfing',
  '滑雪': 'skiing', '极限': 'extreme', '拳击': 'boxing', '激烈': 'intense',
  '足球': 'soccer', '射门': 'kick', '跑酷': 'parkour', '攀岩': 'climbing',
  '自行车': 'cycling', '冲刺': 'sprint', '电影场景': 'cinematic', '太空': 'space',
  '飞船': 'spaceship', '西部': 'western', '决斗': 'duel', '正午': 'noon',
  '末日': 'post-apocalyptic', '废墟': 'ruins', '孤独': 'lonely', '古代': 'ancient',
  '战场': 'battle', '侦探': 'detective', '黑色电影': 'noir', '浪漫': 'romantic',
  '拥吻': 'kiss', '追车': 'car chase', '动作': 'action', '低角度': 'low angle',
  '紧张': 'tense', '魔法': 'magic', '施法': 'spell', '奇幻': 'fantasy',
  '特效': 'vfx', '山脊': 'mountain ridge', '风光': 'landscape', '海岸线': 'coastline',
  '城市': 'city', '夜景': 'night', '环绕': 'orbit', '灯光': 'lights', '梯田': 'terrace',
  '盘旋': 'circling', '沙漠公路': 'desert road', '森林': 'forest', '河流': 'river',
  '火山口': 'volcano crater', '冰原': 'ice field', '北极': 'arctic', '北极熊': 'polar bear',
  '水下': 'underwater', '鲸鱼': 'whale', '伴游': 'swimming with', '珊瑚': 'coral',
  '鱼群': 'fish school', '水母': 'jellyfish', '发光': 'bioluminescence', '空灵': 'ethereal',
  '沉船': 'shipwreck', '探秘': 'exploration', '洞穴': 'cave', '探险': 'exploration',
  '自由潜水': 'freediving', '下潜': 'diving', '宁静': 'serene', '海龟': 'sea turtle',
  '游弋': 'gliding', '鲨鱼': 'shark', '编队': 'formation', '水滴': 'water drop',
  '皇冠': 'crown', '高速': 'high speed', '气球': 'balloon', '爆炸': 'explosion',
  '酒杯': 'wine glass', '碎裂': 'shatter', '火柴': 'match', '点燃': 'ignite',
  '雨滴': 'rain drop', '花瓣': 'flower petal', '鸟类': 'bird', '起飞': 'taking off',
  '牛奶': 'milk', '烟花': 'fireworks', '绽放': 'bloom', '春': 'spring',
  '夏': 'summer', '渐变': 'transition', '秋': 'autumn', '落叶': 'falling leaves',
  '冬': 'winter', '雪': 'snow', '花开': 'flower blooming', '融雪': 'snow melting',
  '麦田': 'wheat field', '金黄': 'golden', '丰收': 'harvest', '雷雨': 'thunderstorm',
  '转晴': 'clearing up', '彩虹': 'rainbow'
};

// 标题 → 搜索词
const TITLE_TRANSLATION = {
  '雪山日出延时': 'snow mountain sunrise', '热带雨林晨雾': 'rainforest mist',
  '沙漠星空银河': 'milky way desert', '冰川崩裂巨浪': 'glacier calving',
  '火山喷发熔岩': 'volcano eruption lava', '瀑布彩虹': 'waterfall rainbow',
  '草原羚羊群': 'antelope running savanna', '极光雪原': 'aurora snowy',
  '樱花河谷': 'cherry blossom river', '红叶高山湖': 'autumn mountain lake',
  '海岸悬崖浪花': 'cliff waves', '盐湖镜面倒影': 'salt flat mirror',
  '东京霓虹夜街': 'tokyo neon night', '纽约曼哈顿天际线': 'manhattan skyline',
  '香港维港夜景': 'hong kong harbour night', '上海陆家嘴日出': 'shanghai lujiazui sunrise',
  '迪拜哈利法塔云海': 'burj khalifa clouds', '巴黎埃菲尔铁塔': 'eiffel tower',
  '伦敦雨夜街景': 'london rainy night', '首尔江南车流': 'seoul gangnam night',
  '新加坡滨海湾': 'marina bay sands', '芝加哥高架铁路': 'chicago elevated train',
  '女孩回眸微笑': 'woman turning smile', '老人抽烟特写': 'old man smoking closeup',
  '舞者旋转长裙': 'dancer spinning dress', '男士奔跑街头': 'man running street',
  '孩童追逐气球': 'child chasing balloon', '武术家挥剑': 'samurai sword',
  '钢琴家演奏': 'pianist playing', '滑板少年': 'skateboarder',
  '厨师烹饪火焰': 'chef cooking flame', '画家作画': 'painter painting',
  '香水瓶旋转': 'perfume bottle rotating', '手表特写': 'luxury watch closeup',
  '运动鞋展示': 'sneaker floating', '智能手机悬浮': 'smartphone floating',
  '咖啡杯拉花': 'latte art pour', '化妆品水花': 'cosmetic water splash',
  '珠宝钻石': 'diamond ring sparkle', '汽车广告': 'sports car tunnel',
  '汉堡制作': 'burger cooking', '寿司捏制': 'sushi chef making',
  '拉面热气': 'ramen steam', '巧克力融化': 'chocolate melting',
  '披萨出炉': 'pizza oven', '蛋糕装饰': 'cake decorating',
  '牛排煎烤': 'steak grilling', '拉茶过程': 'indian chai pouring',
  '3D卡通小狐狸': 'cute fox', '黏土动画小屋': 'clay cottage',
  '纸偶剪影故事': 'paper silhouette', '像素风冒险': 'pixel art adventure',
  '水墨动画金鱼': 'goldfish ink', '低多边形恐龙': 'low poly dinosaur',
  '手绘少女眨眼': 'anime girl', '机器人伙伴': 'small robot',
  '流体颜料混合': 'fluid paint mix', '几何形态变换': 'geometric morph',
  '光线粒子舞': 'particles dancing', '液态金属': 'liquid metal mercury',
  '万花筒': 'kaleidoscope', '声波可视化': 'sound wave',
  '分形递归': 'fractal', '烟雾人形': 'smoke figure',
  '高定礼服T台': 'fashion runway', '街头潮牌': 'streetwear model',
  '复古旗袍': 'cheongsam woman', '未来主义金属装': 'futuristic chrome model',
  '婚纱飘逸': 'wedding dress wind', '运动装健身': 'fitness workout',
  '皮草大衣风雪': 'fur coat snow', '民族服饰': 'ethnic costume',
  '篮球扣篮慢镜': 'basketball dunk', '冲浪巨浪': 'surfing wave',
  '滑雪飞跃': 'skiing jump', '拳击出拳': 'boxing punch',
  '足球射门': 'soccer kick', '跑酷城市': 'parkour rooftop',
  '攀岩悬崖': 'rock climbing', '自行车冲刺': 'cycling race',
  '太空飞船': 'spaceship', '西部决斗': 'western duel',
  '末日废墟': 'post apocalyptic city', '古代战场': 'ancient battle',
  '侦探雨夜': 'noir detective rain', '浪漫雨中拥吻': 'couple kissing rain',
  '追车戏': 'car chase city', '魔法施法': 'wizard magic spell',
  '翻越山脊': 'mountain ridge drone', '海岸线巡视': 'coast aerial',
  '城市俯瞰夜景': 'city aerial night', '梯田盘旋': 'rice terrace',
  '沙漠公路': 'desert road car', '森林河流': 'forest river aerial',
  '火山口': 'volcano crater', '冰原北极': 'arctic ice polar bear',
  '鲸鱼伴游': 'whale diver', '珊瑚礁鱼群': 'coral reef fish',
  '水母发光': 'jellyfish bioluminescence', '沉船探秘': 'shipwreck',
  '海底洞穴': 'underwater cave', '自由潜水者': 'freediving blue',
  '海龟游弋': 'sea turtle', '鲨鱼群': 'shark school',
  '水滴溅起': 'water drop crown', '气球爆炸': 'balloon water burst',
  '酒杯碎裂': 'wine glass shatter', '火柴点燃': 'match ignite',
  '雨滴落花': 'raindrop flower', '鸟类起飞': 'bird takeoff water',
  '牛奶皇冠': 'milk drop splash', '烟花绽放': 'fireworks bloom',
  '春樱到夏绿': 'spring summer tree', '秋叶飘落': 'autumn leaves fall',
  '冬雪覆盖': 'snow village', '一年四季同一棵树': 'tree four seasons',
  '花开延时': 'flower bloom timelapse', '冰雪消融': 'snow melting stream',
  '麦田金黄': 'wheat field golden', '雷雨转晴': 'thunderstorm rainbow'
};

// 备用搜索词（如果上面没匹配）
const FALLBACK_KEYWORDS = [
  'nature cinematic', 'urban city', 'people lifestyle', 'food closeup',
  'technology abstract', 'animal wildlife', 'sports action', 'art creative',
  'travel landscape', 'night city'
];

// 模拟 hashCode（与 gen-data.cjs 一致）
function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// 从提示词生成搜索词
function buildSearchQuery(title, contentZh, tags) {
  // 1. 先用标题翻译
  if (TITLE_TRANSLATION[title]) {
    return TITLE_TRANSLATION[title];
  }

  // 2. 从中文标题和标签中提取关键词
  const parts = [title, ...(tags || [])];

  const englishKeywords = [];
  for (const part of parts) {
    if (!part) continue;
    // 按空格和顿号分割
    const subParts = part.split(/[\s、,，]+/);
    for (const sp of subParts) {
      if (TAG_TRANSLATION[sp]) {
        englishKeywords.push(TAG_TRANSLATION[sp]);
      } else if (/^[a-zA-Z\s]+$/.test(sp)) {
        englishKeywords.push(sp);
      }
    }
  }

  if (englishKeywords.length > 0) {
    // 去重
    const unique = [...new Set(englishKeywords)];
    return unique.slice(0, 4).join(' ');
  }

  // 3. 用 hash 取模的备用词
  return FALLBACK_KEYWORDS[hashCode(title) % FALLBACK_KEYWORDS.length];
}

// 视频文件 URL 优先级
function pickVideoFile(videoFiles) {
  if (!videoFiles || videoFiles.length === 0) return null;
  // 优先选择 SD 480p 或 HD 720p 的 mp4
  const sorted = [...videoFiles].sort((a, b) => {
    const aw = a.width || 0;
    const bw = b.width || 0;
    // 偏好 480-1280 之间
    const aScore = (aw >= 480 && aw <= 1280) ? 0 : 1;
    const bScore = (bw >= 480 && bw <= 1280) ? 0 : 1;
    if (aScore !== bScore) return aScore - bScore;
    return Math.abs(aw - 720) - Math.abs(bw - 720);
  });
  const best = sorted[0];
  return best.link;
}

// 搜索视频（带重试）
async function searchPexelsVideo(query, perPage = 5, retries = 3) {
  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'Authorization': API_KEY }
      });
      if (res.status === 429) {
        // Rate limit
        const wait = (i + 1) * 2;
        console.log(`  ⏳ Rate limit, waiting ${wait}s...`);
        await new Promise(r => setTimeout(r, wait * 1000));
        continue;
      }
      if (!res.ok) {
        throw new Error(`Pexels API error: ${res.status}`);
      }
      const data = await res.json();
      if (data.videos && data.videos.length > 0) {
        return data.videos;
      }
      return null;
    } catch (e) {
      if (i === retries - 1) {
        console.log(`  ✗ Failed: ${e.message}`);
        return null;
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return null;
}

// 主函数：处理 prompts.json
async function main() {
  const dataFile = path.join(__dirname, '..', 'api', 'data', 'prompts.json');
  const prompts = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

  const videoPrompts = prompts.filter(p => p.type === 'video');
  console.log(`📹 找到 ${videoPrompts.length} 个视频提示词`);
  console.log(`🔑 使用 Pexels API Key: ${API_KEY.slice(0, 8)}...`);

  let success = 0;
  let failed = 0;
  const usedVideoIds = new Set(); // 避免重复使用同一个视频

  for (let i = 0; i < videoPrompts.length; i++) {
    const p = videoPrompts[i];
    const query = buildSearchQuery(p.title, p.contentZh, p.tags);
    process.stdout.write(`[${i + 1}/${videoPrompts.length}] "${p.title}" → "${query}" ... `);

    const videos = await searchPexelsVideo(query);
    if (!videos || videos.length === 0) {
      console.log('✗ no result, trying fallback...');
      // 用更宽泛的关键词
      const fallback = FALLBACK_KEYWORDS[hashCode(p.id) % FALLBACK_KEYWORDS.length];
      const retryVideos = await searchPexelsVideo(fallback);
      if (!retryVideos || retryVideos.length === 0) {
        console.log('  ✗✗ 完全没找到视频');
        failed++;
        continue;
      }
      videos.push(...retryVideos);
    }

    // 选择一个没使用过的视频
    let chosen = null;
    for (const v of videos) {
      if (!usedVideoIds.has(v.id)) {
        chosen = v;
        usedVideoIds.add(v.id);
        break;
      }
    }
    if (!chosen) {
      chosen = videos[0];
      usedVideoIds.add(chosen.id);
    }

    const videoUrl = pickVideoFile(chosen.video_files);
    const imageUrl = chosen.image; // Pexels 视频的封面图

    if (!videoUrl) {
      console.log('✗ no video file');
      failed++;
      continue;
    }

    // 更新 prompt
    const idx = prompts.findIndex(x => x.id === p.id);
    prompts[idx].videoUrl = videoUrl;
    // 视频关键帧作为卡片封面
    prompts[idx].imageUrl = imageUrl;
    prompts[idx].imageLgUrl = imageUrl;
    // 标记来源
    prompts[idx].videoSource = 'pexels';
    prompts[idx].pexelsVideoId = chosen.id;

    console.log(`✓ ${chosen.id} (${chosen.duration}s)`);
    success++;

    // 避免触发 rate limit
    await new Promise(r => setTimeout(r, 250));
  }

  // 写回文件
  fs.writeFileSync(dataFile, JSON.stringify(prompts));
  console.log(`\n✅ 完成: 成功 ${success}, 失败 ${failed}`);
  console.log(`📦 数据已更新: ${dataFile}`);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
