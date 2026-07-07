// 为所有提示词（图片+视频）从 Pexels 获取真实匹配的图片/视频
// 使用: node scripts/gen-all-media.cjs YOUR_PEXELS_API_KEY
const fs = require('fs');
const path = require('path');

const API_KEY = process.argv[2] || process.env.PEXELS_API_KEY;
if (!API_KEY) {
  console.error('请提供 Pexels API Key: node scripts/gen-all-media.cjs YOUR_KEY');
  process.exit(1);
}

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
  '科幻': 'sci-fi', '情感': 'emotional', '抽象艺术': 'abstract art',
  '流体': 'fluid', '颜料': 'paint', '几何': 'geometric', '变换': 'morphing',
  '动态图形': 'motion graphics', '粒子': 'particles', '光线': 'light', '霓虹辉光': 'neon glow',
  '液态金属': 'liquid metal', '反射': 'reflection', '未来': 'futuristic', '万花筒': 'kaleidoscope',
  '对称': 'symmetric', '迷幻': 'psychedelic', '色彩': 'colorful', '声波': 'sound wave',
  '可视化': 'visualization', '3D': '3d', '沉浸式': 'immersive', '分形': 'fractal',
  '递归': 'recursive', '数学': 'math', '人形': 'human figure',
  '神秘': 'mystery', '时尚走秀': 'fashion', '高定': 'haute couture', 'T台': 'runway',
  '华丽': 'glamorous', '潮牌': 'streetwear', '嘻哈': 'hip hop',
  '旗袍': 'cheongsam', '金属': 'metal', '前卫': 'avant garde', '婚纱': 'wedding dress',
  '飘逸': 'flowing', '运动装': 'sportswear', '健身': 'fitness', '皮草': 'fur', '风雪': 'blizzard',
  '大片': 'editorial', '民族': 'ethnic', '服饰': 'costume', '节庆': 'festival',
  '运动镜头': 'sports', '篮球': 'basketball', '扣篮': 'slam dunk', '冲浪': 'surfing',
  '滑雪': 'skiing', '极限': 'extreme', '拳击': 'boxing', '激烈': 'intense',
  '足球': 'soccer', '射门': 'kick', '跑酷': 'parkour', '攀岩': 'climbing',
  '自行车': 'cycling', '冲刺': 'sprint', '电影场景': 'cinematic', '太空': 'space',
  '飞船': 'spaceship', '西部': 'western', '决斗': 'duel', '正午': 'noon',
  '末日': 'post-apocalyptic', '废墟': 'ruins', '孤独': 'lonely', '古代': 'ancient',
  '战场': 'battle', '侦探': 'detective', '黑色电影': 'noir', '拥吻': 'kiss',
  '追车': 'car chase', '动作': 'action', '低角度': 'low angle',
  '紧张': 'tense', '施法': 'spell', '奇幻': 'fantasy',
  '山脊': 'mountain ridge', '风光': 'landscape', '海岸线': 'coastline',
  '城市': 'city', '夜景': 'night', '环绕': 'orbit', '灯光': 'lights', '梯田': 'terrace',
  '盘旋': 'circling', '沙漠公路': 'desert road', '森林': 'forest', '河流': 'river',
  '火山口': 'volcano crater', '冰原': 'ice field', '北极': 'arctic', '北极熊': 'polar bear',
  '水下': 'underwater', '鲸鱼': 'whale', '珊瑚': 'coral',
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
  '转晴': 'clearing up', '彩虹': 'rainbow',
  
  // 新增更多关键词
  'Logo': 'logo design', 'UI设计': 'ui design', '建筑': 'architecture',
  '动物': 'animals', '科幻': 'science fiction', '奇幻': 'fantasy',
  '水彩': 'watercolor painting', '油画': 'oil painting',
  '3D渲染': '3d render', '像素艺术': 'pixel art', '国风水墨': 'chinese ink painting',
  '摄影': 'photography', '商业': 'commercial', '高端': 'luxury',
  '极简': 'minimalist', '现代': 'modern', '复古': 'vintage',
  '电影感': 'cinematic', '艺术': 'art', '概念': 'concept',
  '赛博朋克': 'cyberpunk', '霓虹': 'neon lights', '街头': 'street photography',
  '美食': 'food photography', '产品': 'product photography',
  '人物': 'portrait photography', '风景': 'landscape photography',
  '微距': 'macro photography', '人像': 'portrait', '萌宠': 'cute animals',
};

const TITLE_TRANSLATION = {
  '霓虹雨夜东京人像': 'neon tokyo portrait rain night',
  '高原牧民沧桑肖像': 'tibetan elder portrait mountains',
  '复古港风街头人像': 'hong kong street portrait vintage',
  '童真笑容自然光人像': 'child laughing wheat field natural light',
  '黑白极简人像': 'black white minimalist portrait',
  '商务高管正式肖像': 'corporate executive portrait',
  '雨中漫步情绪人像': 'woman walking rain umbrella moody',
  '民族盛装人像': 'mongolian woman traditional dress grassland',
  '黄昏逆光少女': 'girl sunset backlight',
  '舞台聚光舞者肖像': 'ballet dancer stage spotlight',
  '张家界云海奇峰': 'zhangjiajie mountains clouds sunrise',
  '冰岛极光瀑布': 'iceland waterfall aurora borealis',
  '托斯卡纳田园秋色': 'tuscany countryside autumn',
  '富士山樱花湖景': 'mount fuji cherry blossom lake',
  '撒哈拉星空沙丘': 'sahara desert milky way',
  '挪威峡湾晨雾': 'norwegian fjord morning mist',
  '秋日红枫林间小径': 'autumn maple forest path',
  '热带海滩落日': 'tropical beach sunset',
  '川西高原花海': 'western sichuan plateau flower field',
  '雷暴草原闪电': 'prairie thunderstorm lightning',
  '新海诚风夕阳车站': 'makoto shinkai style sunset train station anime',
  '哥特萝莉角色立绘': 'gothic lolita anime girl',
  '宫崎骏风龙猫森林': 'studio ghibli forest scene',
  '赛博风女骑士立绘': 'cyber knight anime girl',
  '京都和服少女': 'anime girl kimono kyoto',
  '机甲驾驶员特写': 'mecha pilot anime boy',
  '废土少女与机械犬': 'post-apocalyptic girl robot dog',
  '魔法学院星空图书馆': 'magic library floating books anime',
  '赛博朋克女黑客': 'cyberpunk girl hacker anime',
  '巫女雪景祈福': 'miko shrine maiden snow anime',
  '水晶凤凰概念设计': 'crystal phoenix concept art',
  '末日避难所场景设计': 'post-apocalyptic bunker concept',
  '巨龙盘踞金币山': 'dragon gold coins concept art',
  '悬浮未来城市概念': 'floating city futuristic concept',
  '黑暗魔王王座场景': 'dark lord throne fantasy',
  '外星丛林生态设计': 'alien jungle concept art',
  '蒸汽朋克飞艇港口': 'steampunk airship harbor',
  '圣洁天使降临场景': 'seraph angel descending concept',
  '机械巨兽攻城场景': 'mechanical beast fortress battle',
  '水下亚特兰蒂斯遗迹': 'sunken atlantis ruins underwater',
};

const FALLBACK_KEYWORDS = [
  'nature landscape', 'urban city', 'people portrait', 'food photography',
  'technology abstract', 'animal wildlife', 'sports action', 'art creative',
  'travel landscape', 'night city', 'anime style', 'fantasy art',
  'product photography', 'architecture', 'macro photography',
  'concept art', 'cinematic', 'watercolor', 'oil painting', '3d render'
];

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function buildSearchQuery(title, contentZh, tags) {
  if (TITLE_TRANSLATION[title]) {
    return TITLE_TRANSLATION[title];
  }

  const parts = [title, ...(tags || [])];
  const englishKeywords = [];
  
  for (const part of parts) {
    if (!part) continue;
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
    const unique = [...new Set(englishKeywords)];
    return unique.slice(0, 4).join(' ');
  }

  return FALLBACK_KEYWORDS[hashCode(title) % FALLBACK_KEYWORDS.length];
}

async function searchPexelsPhotos(query, perPage = 5, retries = 3) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;
  
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'Authorization': API_KEY }
      });
      if (res.status === 429) {
        const wait = (i + 1) * 2;
        console.log(`  ⏳ Rate limit, waiting ${wait}s...`);
        await new Promise(r => setTimeout(r, wait * 1000));
        continue;
      }
      if (!res.ok) throw new Error(`Pexels API error: ${res.status}`);
      const data = await res.json();
      return data.photos || null;
    } catch (e) {
      if (i === retries - 1) return null;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return null;
}

async function searchPexelsVideos(query, perPage = 5, retries = 3) {
  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;
  
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'Authorization': API_KEY }
      });
      if (res.status === 429) {
        const wait = (i + 1) * 2;
        console.log(`  ⏳ Rate limit, waiting ${wait}s...`);
        await new Promise(r => setTimeout(r, wait * 1000));
        continue;
      }
      if (!res.ok) throw new Error(`Pexels API error: ${res.status}`);
      const data = await res.json();
      return data.videos || null;
    } catch (e) {
      if (i === retries - 1) return null;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return null;
}

function pickVideoFile(videoFiles) {
  if (!videoFiles || videoFiles.length === 0) return null;
  const sorted = [...videoFiles].sort((a, b) => {
    const aw = a.width || 0;
    const bw = b.width || 0;
    const aScore = (aw >= 480 && aw <= 1280) ? 0 : 1;
    const bScore = (bw >= 480 && bw <= 1280) ? 0 : 1;
    if (aScore !== bScore) return aScore - bScore;
    return Math.abs(aw - 720) - Math.abs(bw - 720);
  });
  return sorted[0]?.link;
}

async function main() {
  const dataFile = path.join(__dirname, '..', 'api', 'data', 'prompts.json');
  const prompts = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  
  const imagePrompts = prompts.filter(p => p.type === 'image');
  const videoPrompts = prompts.filter(p => p.type === 'video');
  
  console.log(`📷 图片提示词: ${imagePrompts.length}`);
  console.log(`📹 视频提示词: ${videoPrompts.length}`);
  
  let imageSuccess = 0, imageFailed = 0;
  let videoSuccess = 0, videoFailed = 0;
  const usedMediaIds = new Set();

  // 处理图片提示词
  for (let i = 0; i < imagePrompts.length; i++) {
    const p = imagePrompts[i];
    if (p.source === 'pexels' && p.imageUrl?.startsWith('https://images.pexels.com')) continue;
    
    const query = buildSearchQuery(p.title, p.contentZh, p.tags);
    process.stdout.write(`[IMG ${i + 1}/${imagePrompts.length}] "${p.title}" → "${query}" ... `);
    
    let photos = await searchPexelsPhotos(query);
    if (!photos || photos.length === 0) {
      const fallback = FALLBACK_KEYWORDS[hashCode(p.id) % FALLBACK_KEYWORDS.length];
      const retryPhotos = await searchPexelsPhotos(fallback);
      if (!retryPhotos || retryPhotos.length === 0) {
        console.log('✗');
        imageFailed++;
        continue;
      }
      photos = retryPhotos;
    }
    
    let chosen = null;
    for (const photo of photos) {
      if (!usedMediaIds.has(photo.id)) {
        chosen = photo;
        usedMediaIds.add(photo.id);
        break;
      }
    }
    if (!chosen) {
      chosen = photos[0];
      usedMediaIds.add(chosen.id);
    }
    
    const idx = prompts.findIndex(x => x.id === p.id);
    prompts[idx].imageUrl = chosen.src.medium || chosen.src.large || chosen.src.original;
    prompts[idx].imageLgUrl = chosen.src.large || chosen.src.original;
    prompts[idx].source = 'pexels';
    prompts[idx].pexelsPhotoId = chosen.id;
    
    console.log(`✓ ${chosen.id}`);
    imageSuccess++;
    await new Promise(r => setTimeout(r, 1000));
  }

  // 处理视频提示词
  for (let i = 0; i < videoPrompts.length; i++) {
    const p = videoPrompts[i];
    if (p.source === 'pexels' && p.videoUrl) continue;
    
    const query = buildSearchQuery(p.title, p.contentZh, p.tags);
    process.stdout.write(`[VID ${i + 1}/${videoPrompts.length}] "${p.title}" → "${query}" ... `);
    
    let videos = await searchPexelsVideos(query);
    if (!videos || videos.length === 0) {
      const fallback = FALLBACK_KEYWORDS[hashCode(p.id) % FALLBACK_KEYWORDS.length];
      const retryVideos = await searchPexelsVideos(fallback);
      if (!retryVideos || retryVideos.length === 0) {
        console.log('✗');
        videoFailed++;
        continue;
      }
      videos = retryVideos;
    }
    
    let chosen = null;
    for (const v of videos) {
      if (!usedMediaIds.has(v.id)) {
        chosen = v;
        usedMediaIds.add(v.id);
        break;
      }
    }
    if (!chosen) {
      chosen = videos[0];
      usedMediaIds.add(chosen.id);
    }
    
    const videoUrl = pickVideoFile(chosen.video_files);
    const imageUrl = chosen.image;
    
    const idx = prompts.findIndex(x => x.id === p.id);
    prompts[idx].videoUrl = videoUrl;
    prompts[idx].imageUrl = imageUrl;
    prompts[idx].imageLgUrl = imageUrl;
    prompts[idx].source = 'pexels';
    prompts[idx].pexelsVideoId = chosen.id;
    
    console.log(`✓ ${chosen.id} (${chosen.duration}s)`);
    videoSuccess++;
    await new Promise(r => setTimeout(r, 250));
  }

  fs.writeFileSync(dataFile, JSON.stringify(prompts, null, 2));
  
  console.log(`\n✅ 完成:`);
  console.log(`  📷 图片: 成功 ${imageSuccess}, 失败 ${imageFailed}`);
  console.log(`  📹 视频: 成功 ${videoSuccess}, 失败 ${videoFailed}`);
  console.log(`  📦 数据已更新: ${dataFile}`);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
