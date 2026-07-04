import type { Prompt } from "../types";

type SeedPrompt = Omit<
  Prompt,
  "createdAt" | "updatedAt" | "userId" | "projectId"
> & { createdDaysAgo: number };

const PATTERNS = ["mesh", "orbs", "rings", "waves", "grid", "aurora"] as const;
const AUTHORS = ["curator", "aria", "kenji", "luna", "max"] as const;
const RATINGS = [4.2, 4.8, 4.5, 4.9, 4.1, 4.7, 4.3, 4.6, 4.4, 4.0] as const;

const MODELS: Array<{
  model: string;
  vendor: string;
  params: Record<string, string | number>;
}> = [
  { model: "sora", vendor: "OpenAI", params: { duration: "10s", resolution: "4k" } },
  { model: "kling", vendor: "Kuaishou", params: { duration: "8s", resolution: "4k" } },
  { model: "runway-gen3", vendor: "Runway", params: { duration: "6s", fps: 24 } },
  { model: "jimeng", vendor: "ByteDance", params: { duration: "8s" } },
  { model: "pika", vendor: "Pika Labs", params: { duration: "3s", fps: 24 } },
  { model: "hailuo", vendor: "MiniMax", params: { duration: "6s", resolution: "1080p" } },
];

const VIDEO_URLS = [
  "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4",
  "https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4",
  "https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4",
  "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_5MB.mp4",
  "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_5MB.mp4",
  "https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_5MB.mp4",
  "https://vjs.zencdn.net/v/oceans.mp4",
  "https://media.w3.org/2010/05/sintel/trailer.mp4",
];

const SUBMITTED_URLS = [
  "https://prompthero.com",
  "https://promptbase.com",
  "https://civitai.com",
  "https://www.reddit.com/r/SoraPrompts",
  "https://snackprompt.com",
];

const OFFICIAL_URLS = [
  "https://openai.com/sora",
  "https://kling.kuaishou.com",
  "https://runwayml.com/gen3",
  "https://jimeng.jianying.com",
  "https://pika.art",
  "https://hailuoai.video",
];

interface Raw {
  t: string;
  en: string;
  zh: string;
  tags: string[];
}

const RAW: Raw[] = [
  /* ===== 自然风光 ===== */
  { t: "雪山日出延时", en: "Cinematic timelapse of sunrise over snow-capped Himalayan peaks, golden light creeping across ridgelines, swirling morning mist in valleys, slow drifting clouds, lens flare, shot on RED camera, 8K, hyper-detailed, majestic atmosphere", zh: "电影级延时摄影，日出照耀喜马拉雅雪山之巅，金色光线沿山脊蔓延，山谷中晨雾缭绕，云层缓慢飘移，镜头光晕，RED摄影机拍摄，8K超高清，细节丰富，气势磅礴", tags: ["自然风光", "延时摄影", "雪山", "日出", "航拍"] },
  { t: "热带雨林晨雾", en: "Aerial glide through tropical rainforest at dawn, thick mist between giant trees, sunbeams piercing canopy, dew drops on leaves, parrots flying past, lush green, cinematic, volumetric lighting, 4K", zh: "黎明时分航拍滑过热带雨林，巨树间浓雾弥漫，阳光穿透树冠，叶尖露珠欲滴，鹦鹉掠过，翠绿生机，电影感，体积光，4K", tags: ["自然风光", "雨林", "晨雾", "航拍", "体积光"] },
  { t: "沙漠星空银河", en: "Time-lapse of Milky Way arching over Sahara desert dunes, star trails rotating, shooting stars, sand ripples glowing under moonlight, lone camel caravan silhouette, ultra wide, astrophotography style", zh: "延时摄影，银河横跨撒哈拉沙漠沙丘上空，星轨旋转，流星划过，月光下沙纹泛光，孤独骆驼商队剪影，超广角，天文摄影风格", tags: ["自然风光", "星空", "银河", "沙漠", "延时摄影"] },
  { t: "冰川崩裂巨浪", en: "Massive glacier calving into turquoise arctic sea, giant ice blocks crashing with thunderous splash, slow motion, spray catching sunlight, cinematic wide shot, blue ice texture, climate documentary style", zh: "巨大冰川崩裂坠入碧绿北极海域，巨型冰块轰然入水掀起巨浪，慢动作，水雾捕捉阳光，电影级广角镜头，蓝色冰层质感，气候纪录片风格", tags: ["自然风光", "冰川", "慢动作", "纪录片", "极地"] },
  { t: "火山喷发熔岩", en: "Active volcano eruption at night, glowing lava fountains, rivers of molten rock flowing down slope, ash clouds lit from below, sparks and embers, telephoto, dramatic, National Geographic style", zh: "夜间活火山喷发，炽热熔岩喷涌如泉，岩浆河流顺坡而下，火山灰云被下方火光照亮，火星飞溅，长焦镜头，戏剧性，国家地理风格", tags: ["自然风光", "火山", "熔岩", "夜景", "纪录片"] },
  { t: "瀑布彩虹", en: "Majestic waterfall in lush canyon, thundering water cascading over cliff, mist creating vivid rainbow, sunlight rays, lush vegetation, slow dolly forward, cinematic, 4K, hyper-detailed", zh: "壮丽瀑布位于翠绿峡谷之中，水幕轰鸣倾泻悬崖，水雾形成鲜艳彩虹，阳光穿透，植被丰茂，缓慢推轨前进，电影感，4K，细节精致", tags: ["自然风光", "瀑布", "彩虹", "峡谷", "电影感"] },
  { t: "草原羚羊群", en: "Vast African savanna at golden hour, herd of antelopes galloping across plains, dust kicked up catching warm light, acacia trees silhouette, telephoto tracking shot, wildlife documentary", zh: "金色时刻的辽阔非洲大草原，羚羊群奔腾而过，扬尘捕捉暖光，金合欢树剪影，长焦跟拍镜头，野生动物纪录片", tags: ["自然风光", "草原", "野生动物", "金色时刻", "跟拍"] },
  { t: "极光雪原", en: "Vibrant green and purple aurora borealis dancing over snowy arctic landscape, frozen lake reflection, lone cabin with warm window light, starry sky, time-lapse, ultra wide, magical", zh: "翠绿与紫色极光在雪原上空舞动，冰封湖面倒影，孤零零小屋透出暖光窗，繁星满天，延时摄影，超广角，梦幻", tags: ["自然风光", "极光", "雪原", "延时摄影", "夜景"] },
  { t: "樱花河谷", en: "Drone flyover along cherry blossom river valley in spring, petals drifting on water surface, pink canopy, soft morning light, traditional village in distance, gentle, dreamy, 4K", zh: "春季无人机沿樱花河谷飞行，花瓣飘落水面，粉色花海，柔和晨光，远处传统村落，温柔梦幻，4K", tags: ["自然风光", "樱花", "河谷", "航拍", "春季"] },
  { t: "红叶高山湖", en: "Calm alpine lake reflecting snow peak and fiery red autumn maple forest, mirror-still water, drifting mist, golden sunlight, slow pan, serene, cinematic landscape", zh: "平静高山湖泊倒映雪峰与火红秋季枫林，水面如镜，薄雾飘移，金色阳光，缓慢平移，宁静，电影级风光", tags: ["自然风光", "秋景", "红叶", "高山湖", "倒影"] },
  { t: "海岸悬崖浪花", en: "Dramatic coastal cliff with massive waves crashing against rocks, sea spray exploding upward, seabirds circling, stormy sky, low angle, slow motion, moody, cinematic", zh: "戏剧性海岸悬崖，巨浪撞击礁石，浪花爆炸般飞溅，海鸟盘旋，暴风雨天空，低角度，慢动作，氛围感，电影感", tags: ["自然风光", "海岸", "悬崖", "巨浪", "慢动作"] },
  { t: "盐湖镜面倒影", en: "Salar de Uyuni salt flat at sunset, endless mirror reflection of pink and orange sky, lone figure walking, geometric salt patterns, hyper-minimal, surreal, wide shot", zh: "乌尤尼盐沼日落，无尽镜面倒映粉橙天空，孤独身影行走，几何盐晶纹理，极简构图，超现实，广角镜头", tags: ["自然风光", "盐湖", "倒影", "日落", "极简"] },

  /* ===== 城市延时 ===== */
  { t: "东京霓虹夜街", en: "Hyperlapse through Shibuya Tokyo at night, neon signs flashing, crowded crosswalk, reflective wet pavement, rain, cyberpunk color grade, anamorphic lens flares, energetic", zh: "东京涩谷夜间超延时摄影，霓虹招牌闪烁，繁忙十字路口，湿润路面反光，雨夜，赛博朋克调色，变形宽银幕镜头光晕，活力十足", tags: ["城市延时", "东京", "霓虹", "夜景", "赛博朋克"] },
  { t: "纽约曼哈顿天际线", en: "Aerial timelapse of Manhattan skyline at blue hour, lights flickering on across skyscrapers, Brooklyn Bridge in foreground, Hudson River flowing, cinematic, grand scale", zh: "蓝调时刻曼哈顿天际线航拍延时，摩天楼灯光次第亮起，布鲁克林大桥前景，哈德逊河奔流，电影感，宏大尺度", tags: ["城市延时", "纽约", "天际线", "蓝调时刻", "航拍"] },
  { t: "香港维港夜景", en: "Victoria Harbour Hong Kong at night, symphony of lights, skyscrapers glowing, harbor with passing ferries, reflections on water, drone orbit, vibrant, 4K", zh: "香港维多利亚港夜景，幻彩咏香江，摩天楼璀璨，渡轮穿梭，水面倒影，无人机环绕，色彩斑斓，4K", tags: ["城市延时", "香港", "维港", "夜景", "航拍"] },
  { t: "上海陆家嘴日出", en: "Sunrise over Lujiazui Shanghai financial district, golden light hitting Oriental Pearl Tower and Shanghai Tower, mist clearing, Huangpu River, time-lapse, majestic", zh: "上海陆家嘴金融区日出，金色光线照射东方明珠与上海中心，薄雾消散，黄浦江蜿蜒，延时摄影，气势恢宏", tags: ["城市延时", "上海", "陆家嘴", "日出", "延时摄影"] },
  { t: "迪拜哈利法塔云海", en: "Top of Burj Khalifa piercing through sea of clouds at dawn, Dubai skyline emerging, sun rising above cloud layer, drone ascending, surreal, epic", zh: "黎明时分哈利法塔顶部刺穿云海，迪拜天际线浮现，太阳从云层上方升起，无人机上升，超现实，史诗感", tags: ["城市延时", "迪拜", "云海", "日出", "航拍"] },
  { t: "巴黎埃菲尔铁塔", en: "Eiffel Tower Paris at sunset, warm golden light, Seine river cruise passing, leaves drifting, romantic, slow push-in, vintage film look, dreamy bokeh", zh: "巴黎埃菲尔铁塔日落，温暖金光，塞纳河游船驶过，落叶飘零，浪漫，缓慢推进，复古胶片质感，梦幻散景", tags: ["城市延时", "巴黎", "埃菲尔铁塔", "日落", "浪漫"] },
  { t: "伦敦雨夜街景", en: "Rainy night in London, red double-decker bus passing, wet cobblestone reflections, vintage streetlamps, fog, moody cinematic, British noir, 4K", zh: "伦敦雨夜，红色双层巴士驶过，湿润鹅卵石路面反光，复古街灯，雾气，氛围电影感，英伦黑色电影，4K", tags: ["城市延时", "伦敦", "雨夜", "街景", "氛围感"] },
  { t: "首尔江南车流", en: "Gangnam Seoul night traffic hyperlapse, light trails of cars, glowing billboards, modern glass towers, dynamic motion blur, vibrant, energetic", zh: "首尔江南夜间车流超延时，汽车光轨，霓虹广告牌，现代玻璃高楼，动态运动模糊，色彩鲜艳，活力四射", tags: ["城市延时", "首尔", "车流", "光轨", "夜景"] },
  { t: "新加坡滨海湾", en: "Marina Bay Sands Singapore at blue hour, light water show, skyline reflection, Gardens by the Bay supertrees glowing, drone sweep, futuristic", zh: "蓝调时刻新加坡滨海湾金沙，光影水舞秀，天际线倒影，滨海湾花园超级树发光，无人机扫视，未来感", tags: ["城市延时", "新加坡", "滨海湾", "夜景", "未来感"] },
  { t: "芝加哥高架铁路", en: "Chicago L train rattling through Loop elevated tracks at dusk, golden light between buildings, steam vents, urban grunge, tracking shot, cinematic", zh: "黄昏芝加哥高架列车穿梭于Loop区高架轨道，楼宇间金色光线，蒸汽管道，都市粗粝感，跟拍镜头，电影感", tags: ["城市延时", "芝加哥", "高架铁路", "黄昏", "都市"] },

  /* ===== 人物运镜 ===== */
  { t: "女孩回眸微笑", en: "Cinematic portrait of young woman turning to camera with gentle smile, wind in hair, golden hour backlight, shallow depth of field, 85mm lens, film grain, warm tones", zh: "电影感人像，年轻女子转身对镜头温柔微笑，发丝飘动，金色时刻逆光，浅景深，85mm镜头，胶片颗粒，暖色调", tags: ["人物运镜", "人像", "回眸", "金色时刻", "浅景深"] },
  { t: "老人抽烟特写", en: "Close-up of elderly man smoking cigarette, smoke curling around weathered face, dramatic chiaroscuro lighting, deep wrinkles, shallow focus, film noir mood", zh: "老人抽烟特写，烟雾缭绕饱经风霜的面庞，戏剧性明暗对比布光，深刻皱纹，浅焦，黑色电影氛围", tags: ["人物运镜", "特写", "老人", "烟雾", "明暗对比"] },
  { t: "舞者旋转长裙", en: "Ballet dancer spinning in flowing red dress on rooftop at sunset, slow motion, fabric swirling gracefully, city skyline backdrop, golden rim light, elegant", zh: "日落时分屋顶上芭蕾舞者身着红色长裙旋转，慢动作，裙摆优雅盘旋，城市天际线背景，金色轮廓光，优雅", tags: ["人物运镜", "舞蹈", "旋转", "慢动作", "长裙"] },
  { t: "男士奔跑街头", en: "Man in trench coat running through narrow European alley, handheld tracking shot, motion blur, rain puddles splashing, urgent mood, cinematic thriller", zh: "穿风衣男子奔过欧洲窄巷，手持跟拍，运动模糊，雨水飞溅，紧迫氛围，电影惊悚感", tags: ["人物运镜", "奔跑", "跟拍", "雨夜", "惊悚"] },
  { t: "孩童追逐气球", en: "Joyful child chasing red balloon across sunlit meadow, slow motion, laughter, golden hour, lens flare, dreamy shallow depth of field, heartwarming", zh: "阳光草地上欢乐孩童追逐红色气球，慢动作，欢笑，金色时刻，镜头光晕，梦幻浅景深，温馨动人", tags: ["人物运镜", "孩童", "气球", "慢动作", "温馨"] },
  { t: "武术家挥剑", en: "Samurai master drawing katana in bamboo grove, slow motion sword slash, falling leaves sliced midair, misty morning, dramatic side lighting, epic", zh: "竹林中武士拔刀，慢动作挥剑，飘落竹叶半空被切，晨雾弥漫，戏剧性侧光，史诗感", tags: ["人物运镜", "武术", "武士", "慢动作", "竹林"] },
  { t: "钢琴家演奏", en: "Pianist hands close-up playing grand piano, dramatic stage spotlight, dust particles in light beam, keys blurring with motion, emotive, concert hall", zh: "钢琴家双手弹奏三角钢琴特写，戏剧性舞台聚光，光束中尘埃微粒，琴键运动模糊，情感充沛，音乐厅", tags: ["人物运镜", "音乐", "钢琴", "特写", "舞台"] },
  { t: "滑板少年", en: "Skateboarder performing kickflip at sunset skatepark, slow motion, motion blur, lens flare, urban graffiti backdrop, energetic youth culture, tracking shot", zh: "日落滑板公园少年完成踢翻动作，慢动作，运动模糊，镜头光晕，城市涂鸦背景，活力青年文化，跟拍", tags: ["人物运镜", "滑板", "慢动作", "青春", "跟拍"] },
  { t: "厨师烹饪火焰", en: "Chef tossing ingredients in flaming wok, dramatic fire burst, steam rising, dark kitchen with warm spotlight, slow motion, food cinematography, intense", zh: "厨师翻炒食材火焰腾起，戏剧性火焰爆裂，蒸汽升腾，昏暗厨房暖色聚光，慢动作，美食电影摄影，张力十足", tags: ["人物运镜", "厨师", "火焰", "慢动作", "美食"] },
  { t: "画家作画", en: "Painter brushing oil paint on large canvas in sunlit studio, close-up of brush strokes, paint texture, dust in light beams, slow dolly, artistic", zh: "阳光画室中画家在大幅画布上涂抹油画颜料，笔触特写，颜料质感，光束中尘埃，缓慢推轨，艺术感", tags: ["人物运镜", "画家", "作画", "特写", "艺术"] },

  /* ===== 产品展示 ===== */
  { t: "香水瓶旋转", en: "Luxury perfume bottle rotating on glossy black surface, golden backlight through amber liquid, water droplets, soft studio reflections, macro, premium product shot", zh: "奢华香水瓶在光亮黑色台面旋转，金色逆光穿透琥珀色液体，水珠点缀，柔和影棚反射，微距，高端产品镜头", tags: ["产品展示", "香水", "旋转", "微距", "高端"] },
  { t: "手表特写", en: "Macro close-up of luxury mechanical watch, gears turning, second hand sweeping, brushed steel catching light, dust-free studio, hyper-detailed, 4K", zh: "奢华机械手表微距特写，齿轮转动，秒针扫过，拉丝钢材捕捉光线，无尘影棚，超精细，4K", tags: ["产品展示", "手表", "微距", "机械", "精细"] },
  { t: "运动鞋展示", en: "Sneaker floating and rotating mid-air, dynamic studio lighting, color accents popping, slow motion, urban concrete backdrop, hype, product reveal", zh: "运动鞋悬浮空中旋转，动态影棚布光，色彩点缀跳跃，慢动作，城市混凝土背景，潮酷，产品揭幕", tags: ["产品展示", "运动鞋", "悬浮", "慢动作", "潮酷"] },
  { t: "智能手机悬浮", en: "Smartphone floating with apps bursting from screen as 3D holograms, clean white studio, smooth rotation, glossy reflections, tech commercial style", zh: "智能手机悬浮，应用以3D全息形态从屏幕迸发，纯净白色影棚，平滑旋转，光亮反射，科技广告风格", tags: ["产品展示", "手机", "全息", "悬浮", "科技"] },
  { t: "咖啡杯拉花", en: "Top-down macro of latte art being poured, milk swirling into espresso creating rosetta pattern, steam rising, warm cafe lighting, slow motion, cozy", zh: "俯拍微距拉花制作，牛奶旋入浓缩咖啡形成玫瑰花纹，蒸汽升腾，温暖咖啡馆布光，慢动作，惬意", tags: ["产品展示", "咖啡", "拉花", "微距", "慢动作"] },
  { t: "化妆品水花", en: "Cosmetic serum bottle splashing into clear water, droplets frozen in mid-air, pink and gold liquid swirls, high-speed macro, beauty commercial, glossy", zh: "化妆品精华瓶坠入清水激起水花，水珠悬停半空，粉金色液体漩涡，高速微距，美妆广告，光润质感", tags: ["产品展示", "化妆品", "水花", "微距", "美妆"] },
  { t: "珠宝钻石", en: "Diamond ring sparkling on velvet, light refracting into rainbow prisms, slow rotation, macro detail of facets, dark luxury background, ultra premium", zh: "丝绒上钻石戒指璀璨生辉，光线折射出彩虹棱镜，缓慢旋转，切面微距细节，深色奢华背景，极致高端", tags: ["产品展示", "珠宝", "钻石", "微距", "奢华"] },
  { t: "汽车广告", en: "Sleek sports car driving through neon-lit tunnel, light streaks reflecting on glossy body, motion blur, low angle tracking, cinematic car commercial, 4K", zh: "流线型跑车驶过霓虹隧道，光带映在光亮车身，运动模糊，低角度跟拍，电影级汽车广告，4K", tags: ["产品展示", "汽车", "跑车", "跟拍", "广告"] },

  /* ===== 美食制作 ===== */
  { t: "汉堡制作", en: "Gourmet burger assembly close-up, juicy patty sizzling, melted cheese dripping, fresh lettuce, sesame bun, slow motion, food porn, warm lighting", zh: "精制汉堡组装特写，多汁肉饼滋滋作响，融化的芝士滴落，新鲜生菜，芝麻面包，慢动作，诱惑美食，暖光", tags: ["美食制作", "汉堡", "特写", "慢动作", "美食"] },
  { t: "寿司捏制", en: "Sushi chef shaping nigiri by hand, fresh salmon slice draped over rice, close-up of skilled fingers, clean wooden counter, soft daylight, artisanal", zh: "寿司师傅手工捏制握寿司，新鲜三文鱼覆盖米饭，灵巧手指特写，干净木质吧台，柔和日光，匠心", tags: ["美食制作", "寿司", "手工", "特写", "匠心"] },
  { t: "拉面热气", en: "Steaming bowl of tonkotsu ramen, chopsticks lifting noodles, rich broth swirling, soft-boiled egg cut, steam catching light, overhead shot, appetizing", zh: "热气腾腾豚骨拉面，筷子挑起面条，浓郁汤底翻滚，溏心蛋切开，蒸汽捕捉光线，俯拍，令人垂涎", tags: ["美食制作", "拉面", "热气", "俯拍", "美食"] },
  { t: "巧克力融化", en: "Molten chocolate pouring over dessert in slow motion, glossy cascading waves, strawberry dipping, macro, rich brown tones, indulgent, food cinematography", zh: "融化的巧克力慢动作浇淋甜点，光亮的瀑布状流淌，草莓蘸入，微距，浓郁棕色调，放纵感，美食摄影", tags: ["美食制作", "巧克力", "慢动作", "微距", "甜点"] },
  { t: "披萨出炉", en: "Wood-fired pizza pulled from brick oven, bubbling mozzarella, charred crust, basil leaves, smoke rising, close-up, traditional Italian, warm glow", zh: "柴火披萨从砖窑取出，马苏里拉芝士冒泡，焦脆饼边，罗勒叶，烟雾升腾，特写，传统意式，温暖光辉", tags: ["美食制作", "披萨", "出炉", "特写", "意式"] },
  { t: "蛋糕装饰", en: "Pastry chef piping buttercream rosettes onto layered cake, smooth frosting, fresh berries, macro detail, soft pastel lighting, elegant dessert", zh: "糕点师在多层蛋糕上挤奶油玫瑰花纹，顺滑糖霜，新鲜浆果，微距细节，柔和粉彩布光，优雅甜点", tags: ["美食制作", "蛋糕", "装饰", "微距", "优雅"] },
  { t: "牛排煎烤", en: "Ribeye steak searing in cast iron pan, butter basting with rosemary, sizzling juices, smoke, close-up, dramatic dark background, mouthwatering", zh: "铸铁锅煎肉眼牛排，迷迭香黄油淋浇，滋滋肉汁，烟雾升腾，特写，戏剧性深色背景，令人垂涎", tags: ["美食制作", "牛排", "煎烤", "特写", "美食"] },
  { t: "拉茶过程", en: "Indian chai tea being poured between two brass pots in long arc, slow motion, golden stream, steam, street vendor backdrop, cultural, dynamic", zh: "印度奶茶在两只铜壶间拉出长弧，慢动作，金色茶流，蒸汽升腾，街头摊贩背景，文化感，动感十足", tags: ["美食制作", "拉茶", "慢动作", "街头", "文化"] },

  /* ===== 动画短片 ===== */
  { t: "3D卡通小狐狸", en: "3D animated cute fox cub exploring enchanted forest, big expressive eyes, soft fur, glowing mushrooms, Pixar style, warm magical lighting, charming", zh: "3D动画可爱小狐狸探索魔法森林，灵动大眼，柔软皮毛，发光蘑菇，皮克斯风格，温暖魔法光感，迷人", tags: ["动画短片", "3D动画", "狐狸", "皮克斯", "魔法"] },
  { t: "黏土动画小屋", en: "Claymation cozy cottage in countryside, smoke from chimney, clay texture visible, handmade charm, stop motion, warm storybook lighting, nostalgic", zh: "黏土动画乡间温馨小屋，烟囱冒烟，可见黏土质感，手工魅力，定格动画，温暖绘本布光，怀旧", tags: ["动画短片", "黏土动画", "定格", "温馨", "怀旧"] },
  { t: "纸偶剪影故事", en: "Paper cutout silhouette animation, shadow puppet theater, intricate patterns, warm candlelight glow, traditional folklore tale, handcrafted, atmospheric", zh: "纸偶剪影动画，皮影戏舞台，繁复花纹，温暖烛光辉映，传统民间故事，手工感，氛围十足", tags: ["动画短片", "剪影", "皮影", "传统", "民间故事"] },
  { t: "像素风冒险", en: "16-bit pixel art adventure scene, hero walking through pixel forest, retro game aesthetic, vibrant palette, parallax scrolling, nostalgic 90s, chiptune vibe", zh: "16位像素风冒险场景，勇者穿越像素森林，复古游戏美学，鲜艳调色，视差滚动，90年代怀旧，芯片音乐氛围", tags: ["动画短片", "像素风", "复古", "游戏", "怀旧"] },
  { t: "水墨动画金鱼", en: "Chinese ink wash animation of goldfish swimming in pond, flowing brush strokes, ink dispersing in water, traditional sumi-e style, serene, poetic", zh: "水墨动画，金鱼游弋池塘，流动笔触，墨色在水中晕开，传统水墨风格，宁静诗意", tags: ["动画短片", "水墨", "金鱼", "传统", "诗意"] },
  { t: "低多边形恐龙", en: "Low-poly 3D dinosaur roaming prehistoric valley, geometric facets, stylized volcano, vibrant gradient sky, game cinematic style, playful, colorful", zh: "低多边形3D恐龙漫步史前山谷，几何切面，风格化火山，鲜艳渐变天空，游戏CG风格，趣味，多彩", tags: ["动画短片", "低多边形", "恐龙", "游戏CG", "趣味"] },
  { t: "手绘少女眨眼", en: "Hand-drawn anime girl with flowing hair, blinking and smiling, soft watercolor background, sakura petals drifting, Studio Ghibli style, gentle, dreamy", zh: "手绘动漫少女，发丝飘动，眨眼微笑，柔和水彩背景，樱花飘落，吉卜力风格，温柔梦幻", tags: ["动画短片", "手绘", "动漫", "吉卜力", "梦幻"] },
  { t: "机器人伙伴", en: "Small friendly robot companion exploring abandoned city, glowing blue eyes, dust particles in sunbeams, WALL-E style, emotional, cinematic lighting", zh: "小型友好机器人伙伴探索废弃城市，蓝色发光眼睛，光束中尘埃微粒，瓦力风格，情感丰富，电影布光", tags: ["动画短片", "机器人", "科幻", "情感", "电影感"] },

  /* ===== 抽象艺术 ===== */
  { t: "流体颜料混合", en: "Macro of colorful fluid paint mixing, swirling marbled patterns, gold and teal ink dispersing in water, slow motion, mesmerizing, abstract art", zh: "微距彩色流体颜料混合，大理石纹路盘旋，金与青墨水在水中晕散，慢动作，令人着迷，抽象艺术", tags: ["抽象艺术", "流体", "颜料", "慢动作", "微距"] },
  { t: "几何形态变换", en: "Abstract geometric shapes morphing seamlessly, cubes spheres triangles rotating, gradient background, motion graphics, minimal, satisfying, 4K", zh: "抽象几何形态无缝变换，立方体球体三角旋转，渐变背景，动态图形，极简，治愈感，4K", tags: ["抽象艺术", "几何", "变换", "动态图形", "极简"] },
  { t: "光线粒子舞", en: "Thousands of luminous particles dancing to music, forming and dissolving shapes, dark background, neon glow, audio-reactive, mesmerizing", zh: "数千光粒子随音乐起舞，聚散成形，深色背景，霓虹辉光，声波反应，令人着迷", tags: ["抽象艺术", "粒子", "光线", "音乐", "霓虹"] },
  { t: "液态金属", en: "Liquid chrome metal morphing and flowing, reflective surface distorting environment, slow motion, hyper-realistic, dark studio, futuristic", zh: "液态铬金属流动变形，反光表面扭曲环境，慢动作，超写实，深色影棚，未来感", tags: ["抽象艺术", "液态金属", "反射", "慢动作", "未来感"] },
  { t: "万花筒", en: "Symmetrical kaleidoscope pattern evolving, vibrant mandala of colors and shapes, infinite reflection, hypnotic, psychedelic, 4K", zh: "对称万花筒图案演化，色彩与形状的鲜艳曼陀罗，无尽反射，催眠，迷幻，4K", tags: ["抽象艺术", "万花筒", "对称", "迷幻", "色彩"] },
  { t: "声波可视化", en: "Audio waveform visualized as glowing 3D landscape, mountains rising and falling with bass, particle bursts on beats, dark cinematic, immersive", zh: "声波可视化为发光3D地形，山峦随低音起伏，节拍处粒子爆裂，深色电影感，沉浸式", tags: ["抽象艺术", "声波", "可视化", "3D", "沉浸式"] },
  { t: "分形递归", en: "Infinite zoom into Mandelbrot fractal, recursive patterns spiraling, iridescent colors, mathematical beauty, hypnotic, ultra detailed", zh: "无限缩放进入曼德博分形，递归图案螺旋，虹彩色彩，数学之美，催眠，超精细", tags: ["抽象艺术", "分形", "递归", "数学", "色彩"] },
  { t: "烟雾人形", en: "Human figure made of swirling smoke dancing, dissolving and reforming, dark background, backlit, ethereal, slow motion, mysterious", zh: "烟雾凝成的人形起舞，消散又重聚，深色背景，逆光，空灵，慢动作，神秘", tags: ["抽象艺术", "烟雾", "人形", "慢动作", "神秘"] },

  /* ===== 时尚走秀 ===== */
  { t: "高定礼服T台", en: "Model in haute couture gown walking runway, fabric flowing dramatically, spotlights, audience silhouettes, slow motion, fashion show, glamorous", zh: "模特身着高定礼服走秀，面料戏剧性飘动，聚光灯，观众剪影，慢动作，时装秀，华丽", tags: ["时尚走秀", "高定", "T台", "慢动作", "华丽"] },
  { t: "街头潮牌", en: "Streetwear model posing in urban graffiti alley, oversized hoodie, neon backdrop, dynamic camera orbit, hip-hop vibe, edgy, youth culture", zh: "街头潮牌模特于涂鸦巷弄摆拍，宽松连帽衫，霓虹背景，动态环绕镜头，嘻哈氛围，前卫，青年文化", tags: ["时尚走秀", "潮牌", "街头", "嘻哈", "青年"] },
  { t: "复古旗袍", en: "Woman in elegant qipao walking through 1930s Shanghai alley, cheongsam details, warm lantern light, vintage film look, slow tracking, nostalgic", zh: "身着优雅旗袍的女子走过1930年代上海弄堂，旗袍细节，温暖灯笼光，复古胶片质感，缓慢跟拍，怀旧", tags: ["时尚走秀", "旗袍", "复古", "上海", "怀旧"] },
  { t: "未来主义金属装", en: "Futuristic model in chrome metallic outfit, reflective surfaces, neon-lit cyberpunk set, slow motion walk, sci-fi fashion, avant-garde", zh: "未来主义模特身着铬金属质感套装，反光表面，霓虹赛博朋克布景，慢动作行走，科幻时尚，前卫", tags: ["时尚走秀", "未来主义", "金属", "赛博朋克", "前卫"] },
  { t: "婚纱飘逸", en: "Bride in flowing white wedding dress on clifftop at sunset, veil catching wind, slow motion, golden light, romantic, cinematic, dreamy", zh: "日落悬崖上新娘身着飘逸白色婚纱，头纱随风飘扬，慢动作，金色光线，浪漫，电影感，梦幻", tags: ["时尚走秀", "婚纱", "飘逸", "慢动作", "浪漫"] },
  { t: "运动装健身", en: "Athlete in sleek activewear doing dynamic workout, sweat glistening, slow motion, studio with dramatic lighting, energy, sportswear commercial", zh: "运动员身着流畅运动装动态训练，汗水闪烁，慢动作，戏剧性布光影棚，活力，运动装广告", tags: ["时尚走秀", "运动装", "健身", "慢动作", "广告"] },
  { t: "皮草大衣风雪", en: "Model in luxurious fur coat walking through blizzard, snow swirling, dramatic winter landscape, slow motion, high fashion editorial, moody", zh: "模特身着奢华皮草大衣行走暴风雪中，雪花飞舞，戏剧性冬日景观，慢动作，高端时尚大片，氛围感", tags: ["时尚走秀", "皮草", "风雪", "慢动作", "大片"] },
  { t: "民族服饰", en: "Model in vibrant traditional ethnic costume dancing in festival, colorful embroidery, golden hour, cultural celebration, slow motion, joyful", zh: "模特身着鲜艳传统民族服饰在节庆中起舞，彩色刺绣，金色时刻，文化庆典，慢动作，欢快", tags: ["时尚走秀", "民族", "服饰", "节庆", "文化"] },

  /* ===== 运动镜头 ===== */
  { t: "篮球扣篮慢镜", en: "Basketball player slam dunking in slow motion, sweat flying, jersey rippling, crowd blur background, dramatic arena lighting, epic sports moment", zh: "篮球运动员慢动作扣篮，汗水飞溅，球衣翻飞，观众模糊背景，戏剧性场馆灯光，史诗运动瞬间", tags: ["运动镜头", "篮球", "扣篮", "慢动作", "史诗"] },
  { t: "冲浪巨浪", en: "Surfer riding massive barrel wave, water tunnel curling, spray, slow motion, drone follow, turquoise ocean, adrenaline, cinematic", zh: "冲浪者驾驭巨大管浪，水洞卷曲，水花飞溅，慢动作，无人机跟随，碧绿海洋，肾上腺素，电影感", tags: ["运动镜头", "冲浪", "巨浪", "慢动作", "航拍"] },
  { t: "滑雪飞跃", en: "Skier launching off cliff into powder snow, slow motion, snow spraying, mountain backdrop, blue sky, drone tracking, extreme sports, thrilling", zh: "滑雪者从悬崖飞入粉雪，慢动作，雪雾喷溅，群山背景，蓝天，无人机跟拍，极限运动，惊险", tags: ["运动镜头", "滑雪", "飞跃", "慢动作", "极限"] },
  { t: "拳击出拳", en: "Boxer throwing powerful hook, sweat and spit flying, slow motion, ring spotlight, motion blur, intense, dramatic sports cinematography", zh: "拳手挥出强力勾拳，汗水与唾沫飞溅，慢动作，拳台聚光，运动模糊，紧张激烈，戏剧性运动摄影", tags: ["运动镜头", "拳击", "出拳", "慢动作", "激烈"] },
  { t: "足球射门", en: "Soccer player striking ball in slow motion, mud flying, jersey spinning, stadium lights, rain, dramatic low angle, epic sports shot", zh: "足球运动员慢动作射门，泥水飞溅，球衣旋转，体育场灯光，雨夜，戏剧性低角度，史诗运动镜头", tags: ["运动镜头", "足球", "射门", "慢动作", "雨夜"] },
  { t: "跑酷城市", en: "Traceur leaping between rooftops in urban environment, POV and tracking shots, motion blur, sunset, dynamic, adrenaline, parkour", zh: "跑酷者在城市屋顶间跳跃，第一人称与跟拍镜头，运动模糊，日落，动感十足，肾上腺素，跑酷", tags: ["运动镜头", "跑酷", "城市", "跟拍", "动感"] },
  { t: "攀岩悬崖", en: "Climber scaling dramatic overhanging cliff, chalk dust, close-up of gripping hands, vast valley below, drone orbit, epic, vertigo", zh: "攀岩者攀登戏剧性悬崖，镁粉飞扬，握点双手特写，下方浩瀚山谷，无人机环绕，史诗感，眩晕", tags: ["运动镜头", "攀岩", "悬崖", "特写", "航拍"] },
  { t: "自行车冲刺", en: "Cyclist sprinting in Tour de France, blur of peloton, slow motion, mountain pass, sweat, dramatic, sports documentary, 4K", zh: "环法自行车赛冲刺车手，主车群模糊，慢动作，山口赛道，汗水，戏剧性，运动纪录片，4K", tags: ["运动镜头", "自行车", "冲刺", "慢动作", "纪录片"] },

  /* ===== 电影场景 ===== */
  { t: "太空飞船", en: "Cinematic spaceship drifting past gas giant planet, hull details, engine glow, stars, lens flare, sci-fi epic, sweeping camera, 4K", zh: "电影感太空飞船掠过气态巨行星，船体细节，引擎辉光，繁星，镜头光晕，科幻史诗，扫掠镜头，4K", tags: ["电影场景", "太空", "飞船", "科幻", "史诗"] },
  { t: "西部决斗", en: "Spaghetti western duel at high noon, two cowboys facing off on dusty street, tumbleweed rolling, close-ups of squinting eyes, Morricone mood, cinematic", zh: "正午西部决斗，两名牛仔在扬尘街道对峙，风滚草滚动，眯眼特写，莫里康内氛围，电影感", tags: ["电影场景", "西部", "决斗", "正午", "电影感"] },
  { t: "末日废墟", en: "Lone survivor walking through post-apocalyptic city ruins, overgrown skyscrapers, dust, golden light beams, melancholic, cinematic wide shot", zh: "孤独幸存者走过末日城市废墟，藤蔓覆盖摩天楼，尘埃，金色光束，忧郁，电影级广角", tags: ["电影场景", "末日", "废墟", "孤独", "电影感"] },
  { t: "古代战场", en: "Epic ancient battle, thousands of soldiers clashing, dust clouds, banners, slow motion cavalry charge, dramatic sky, cinematic war scene", zh: "史诗古代战役，万千士兵交锋，尘土飞扬，旌旗猎猎，慢动作骑兵冲锋，戏剧性天空，电影战争场面", tags: ["电影场景", "古代", "战场", "慢动作", "史诗"] },
  { t: "侦探雨夜", en: "Noir detective in trench coat and fedora under streetlamp in pouring rain, cigarette glow, shadows, moody, 1940s cinematic, black and white", zh: "黑色电影侦探穿风衣戴软呢帽立于倾盆大雨街灯下，烟头微光，阴影，氛围感，1940年代电影感，黑白", tags: ["电影场景", "侦探", "雨夜", "黑色电影", "氛围"] },
  { t: "浪漫雨中拥吻", en: "Couple kissing passionately in pouring rain under umbrella, slow motion, city lights bokeh, romantic, cinematic, emotional, warm tones", zh: "情侣在倾盆大雨中撑伞激情拥吻，慢动作，城市灯光散景，浪漫，电影感，情感充沛，暖色调", tags: ["电影场景", "浪漫", "拥吻", "雨夜", "慢动作"] },
  { t: "追车戏", en: "High-speed car chase through narrow European streets, motion blur, sparks, near-miss collisions, low angle, adrenaline, action movie, cinematic", zh: "欧洲窄街高速追车，运动模糊，火花四溅，险象环生，低角度，肾上腺素，动作电影，电影感", tags: ["电影场景", "追车", "动作", "低角度", "紧张"] },
  { t: "魔法施法", en: "Wizard casting spell, glowing magic energy from hands, particles swirling, dark fantasy setting, dramatic backlight, epic, VFX heavy", zh: "巫师施法，双手迸发发光魔法能量，粒子旋绕，黑暗奇幻场景，戏剧性逆光，史诗感，重特效", tags: ["电影场景", "魔法", "施法", "奇幻", "特效"] },

  /* ===== 航拍 ===== */
  { t: "翻越山脊", en: "Drone flying low over mountain ridge, dramatic peaks, low clouds, golden sunrise, sweeping motion, epic landscape, cinematic, 4K", zh: "无人机低飞翻越山脊，戏剧性山峰，低云，金色日出，扫掠运动，史诗风光，电影感，4K", tags: ["航拍", "山脊", "日出", "风光", "电影感"] },
  { t: "海岸线巡视", en: "Aerial tracking along dramatic coastline, turquoise water meeting cliffs, waves crashing, lighthouse, sunset, cinematic, 4K", zh: "沿戏剧性海岸线航拍跟飞，碧绿海水撞击悬崖，巨浪拍岸，灯塔，日落，电影感，4K", tags: ["航拍", "海岸", "悬崖", "日落", "跟飞"] },
  { t: "城市俯瞰夜景", en: "Aerial orbit over glittering city at night, grid of lights, traffic arteries, river reflection, drone, cinematic, vibrant, 4K", zh: "夜间璀璨城市航拍环绕，灯光网格，交通动脉，河流倒影，无人机，电影感，色彩斑斓，4K", tags: ["航拍", "城市", "夜景", "环绕", "灯光"] },
  { t: "梯田盘旋", en: "Drone spiraling over terraced rice fields in Yunnan, layered patterns, water reflections, morning mist, lush green, cinematic, serene", zh: "无人机盘旋于云南梯田之上，层叠纹理，水面倒影，晨雾，翠绿，电影感，宁静", tags: ["航拍", "梯田", "盘旋", "晨雾", "宁静"] },
  { t: "沙漠公路", en: "Aerial following lone car on endless desert highway, heat shimmer, dunes, long shadows at sunset, cinematic, lonely, 4K", zh: "航拍跟随孤车行驶无尽沙漠公路，热浪蒸腾，沙丘，日落长影，电影感，孤独，4K", tags: ["航拍", "沙漠", "公路", "日落", "孤独"] },
  { t: "森林河流", en: "Drone gliding over dense forest following winding river, mist, sunbeams, autumn colors, cinematic nature, peaceful, 4K", zh: "无人机滑过茂密森林跟随蜿蜒河流，薄雾，阳光光束，秋色，电影级自然，宁静，4K", tags: ["航拍", "森林", "河流", "秋色", "宁静"] },
  { t: "火山口", en: "Aerial descent into active volcano crater, glowing lava lake, sulfur smoke, rugged rock, dramatic, documentary, 4K", zh: "航拍下降进入活火山口，炽热熔岩湖，硫磺烟雾，嶙峋岩石，戏剧性，纪录片，4K", tags: ["航拍", "火山", "熔岩", "纪录片", "戏剧性"] },
  { t: "冰原北极", en: "Aerial over vast arctic ice field, icebergs frozen in sea, polar bear walking, polar light, white expanse, documentary, majestic", zh: "辽阔北极冰原航拍，冰山冻结海中，北极熊行走，极地光线，白色苍茫，纪录片，壮丽", tags: ["航拍", "北极", "冰原", "北极熊", "纪录片"] },

  /* ===== 水下 ===== */
  { t: "鲸鱼伴游", en: "Underwater shot of humpback whale swimming beside freediver, sunlight rays through water, bubbles, slow motion, majestic, documentary, 4K", zh: "水下座头鲸伴自由潜水者游弋，阳光穿透水面，气泡升腾，慢动作，壮丽，纪录片，4K", tags: ["水下", "鲸鱼", "伴游", "慢动作", "纪录片"] },
  { t: "珊瑚礁鱼群", en: "Vibrant coral reef teeming with tropical fish, schools swirling, sunlight dappling, macro and wide shots, colorful, documentary, 4K", zh: "生机勃勃的珊瑚礁，热带鱼群盘旋，阳光斑驳，微距与广角镜头，色彩斑斓，纪录片，4K", tags: ["水下", "珊瑚", "鱼群", "色彩", "纪录片"] },
  { t: "水母发光", en: "Bioluminescent jellyfish drifting in dark ocean, glowing tentacles, slow motion, black background, ethereal, macro, mesmerizing", zh: "生物发光水母漂浮黑暗海洋，发光触须，慢动作，黑色背景，空灵，微距，令人着迷", tags: ["水下", "水母", "发光", "慢动作", "空灵"] },
  { t: "沉船探秘", en: "Diver exploring sunken shipwreck encrusted with coral, schools of fish, light beams piercing through, mysterious, documentary, cinematic", zh: "潜水者探索覆满珊瑚的沉船，鱼群穿梭，光束穿透，神秘，纪录片，电影感", tags: ["水下", "沉船", "探秘", "神秘", "电影感"] },
  { t: "海底洞穴", en: "Underwater cave exploration, stalactites, glowing blue water, freediver with torch, mysterious, cinematic, documentary, 4K", zh: "水下洞穴探险，钟乳石，幽蓝发光水体，自由潜水者持手电，神秘，电影感，纪录片，4K", tags: ["水下", "洞穴", "探险", "神秘", "纪录片"] },
  { t: "自由潜水者", en: "Freediver descending into deep blue, weightless, sunlight fading, slow motion, serene, cinematic, one breath, documentary", zh: "自由潜水者下潜深蓝，失重感，阳光渐褪，慢动作，宁静，电影感，一气潜水，纪录片", tags: ["水下", "自由潜水", "下潜", "慢动作", "宁静"] },
  { t: "海龟游弋", en: "Sea turtle gliding over coral reef, sunlight rays, slow motion, peaceful, documentary, tracking shot, 4K", zh: "海龟滑翔于珊瑚礁之上，阳光光束，慢动作，宁静，纪录片，跟拍，4K", tags: ["水下", "海龟", "游弋", "慢动作", "纪录片"] },
  { t: "鲨鱼群", en: "School of hammerhead sharks swimming in formation, deep blue, sunlight from above, slow motion, majestic, documentary, cinematic", zh: "锤头鲨群编队游弋，深蓝海域，上方阳光，慢动作，壮丽，纪录片，电影感", tags: ["水下", "鲨鱼", "编队", "慢动作", "纪录片"] },

  /* ===== 慢动作 ===== */
  { t: "水滴溅起", en: "Macro slow motion of water drop hitting pool, crown splash, ripples, backlit, high-speed, hyper-detailed, abstract, 4K", zh: "微距慢动作水滴撞击水面，皇冠水花，涟漪扩散，逆光，高速，超精细，抽象，4K", tags: ["慢动作", "水滴", "微距", "高速", "抽象"] },
  { t: "气球爆炸", en: "Water balloon bursting in slow motion, water holding shape mid-air, splash, colorful background, high-speed, playful, 4K", zh: "慢动作水气球爆炸，水团半空维持形状，水花飞溅，彩色背景，高速，趣味，4K", tags: ["慢动作", "气球", "爆炸", "高速", "趣味"] },
  { t: "酒杯碎裂", en: "Wine glass shattering in ultra slow motion, fragments flying, red wine splashing, backlit, high-speed, dramatic, 4K", zh: "超慢动作酒杯碎裂，碎片飞溅，红酒泼洒，逆光，高速，戏剧性，4K", tags: ["慢动作", "酒杯", "碎裂", "高速", "戏剧性"] },
  { t: "火柴点燃", en: "Macro slow motion of match igniting, spark, smoke curling, flame growing, dark background, high-speed, detailed, 4K", zh: "微距慢动作火柴点燃，火星，烟雾缭绕，火焰渐长，深色背景，高速，精细，4K", tags: ["慢动作", "火柴", "点燃", "微距", "高速"] },
  { t: "雨滴落花", en: "Slow motion raindrop landing on flower petal, water bouncing, petal trembling, soft light, macro, delicate, poetic, 4K", zh: "慢动作雨滴落在花瓣上，水珠弹起，花瓣轻颤，柔和光线，微距，细腻，诗意，4K", tags: ["慢动作", "雨滴", "花瓣", "微距", "诗意"] },
  { t: "鸟类起飞", en: "Slow motion bird taking off from water, droplets flying, wings spreading, reflection, golden light, high-speed, graceful, 4K", zh: "慢动作鸟从水面起飞，水珠飞溅，翅膀展开，倒影，金色光线，高速，优雅，4K", tags: ["慢动作", "鸟类", "起飞", "高速", "优雅"] },
  { t: "牛奶皇冠", en: "Macro slow motion milk drop forming crown splash, white on black, high-speed, hyper-detailed, abstract, 4K", zh: "微距慢动作牛奶滴落形成皇冠水花，黑底白液，高速，超精细，抽象，4K", tags: ["慢动作", "牛奶", "皇冠", "微距", "抽象"] },
  { t: "烟花绽放", en: "Fireworks blooming in night sky in slow motion, sparks cascading, vibrant colors, reflections, epic, cinematic, 4K", zh: "慢动作烟花在夜空绽放，火星倾泻，鲜艳色彩，倒影，史诗，电影感，4K", tags: ["慢动作", "烟花", "绽放", "夜景", "电影感"] },

  /* ===== 季节变换 ===== */
  { t: "春樱到夏绿", en: "Time-lapse transition from spring cherry blossoms to summer green foliage, same tree, morphing colors, soft light, peaceful, 4K", zh: "延时过渡，从春季樱花到夏季绿叶，同一棵树，色彩渐变，柔和光线，宁静，4K", tags: ["季节变换", "春", "夏", "延时", "渐变"] },
  { t: "秋叶飘落", en: "Slow motion autumn maple leaves falling from tree, golden backlight, drifting, ground covered in red and orange, poetic, 4K", zh: "慢动作秋季枫叶从树上飘落，金色逆光，飘摇，地面铺满红橙，诗意，4K", tags: ["季节变换", "秋", "落叶", "慢动作", "诗意"] },
  { t: "冬雪覆盖", en: "Time-lapse of snow gradually covering quiet village rooftops, smoke from chimneys, dusk light, cozy, peaceful, 4K", zh: "延时摄影，大雪逐渐覆盖宁静村庄屋顶，烟囱炊烟，黄昏光线，温馨，宁静，4K", tags: ["季节变换", "冬", "雪", "延时", "宁静"] },
  { t: "一年四季同一棵树", en: "Seamless time-lapse of single tree through all four seasons, spring bloom to summer green to autumn red to bare winter snow, cyclical, epic", zh: "无缝延时，同一棵树经历四季，春花夏绿秋红冬雪，循环往复，史诗", tags: ["季节变换", "四季", "延时", "循环", "史诗"] },
  { t: "花开延时", en: "Macro time-lapse of rose blooming, petals unfurling, dew drops, soft light, vibrant red, hyper-detailed, 4K", zh: "微距延时，玫瑰绽放，花瓣舒展，露珠，柔和光线，鲜艳红色，超精细，4K", tags: ["季节变换", "花开", "延时", "微距", "精细"] },
  { t: "冰雪消融", en: "Time-lapse of ice and snow melting into flowing stream in spring forest, water droplets, green shoots emerging, renewal, hopeful, 4K", zh: "延时摄影，春季森林冰雪融化成溪流，水珠滴落，嫩芽萌发，新生，充满希望，4K", tags: ["季节变换", "融雪", "春季", "延时", "新生"] },
  { t: "麦田金黄", en: "Cinematic golden wheat field swaying in wind at sunset, time-lapse clouds, sun rays, harvest, warm, peaceful, 4K", zh: "电影感金黄麦田日落时随风摇曳，延时云层，阳光光束，丰收，温暖，宁静，4K", tags: ["季节变换", "麦田", "金黄", "延时", "丰收"] },
  { t: "雷雨转晴", en: "Time-lapse of thunderstorm clearing into sunny sky over valley, dark clouds parting, sun rays breaking through, rainbow, dramatic, hopeful, 4K", zh: "延时摄影，山谷雷雨转晴，乌云散开，阳光破云而出，彩虹横空，戏剧性，充满希望，4K", tags: ["季节变换", "雷雨", "转晴", "延时", "彩虹"] },
];

export const videoSeeds: SeedPrompt[] = RAW.map((r, i): SeedPrompt => {
  const m = MODELS[i % MODELS.length];
  const bucket = i % 10;
  const source: SeedPrompt["source"] =
    bucket < 5 ? "crawled" : bucket < 8 ? "submitted" : "official";
  const sourceUrl =
    source === "submitted"
      ? SUBMITTED_URLS[i % SUBMITTED_URLS.length]
      : source === "official"
        ? OFFICIAL_URLS[i % OFFICIAL_URLS.length]
        : undefined;
  const viewCount = 1200 + ((i * 7321) % 45000);
  const entry: SeedPrompt = {
    id: `vid_${String(i + 1).padStart(3, "0")}`,
    title: r.t,
    content: r.en,
    contentEn: r.en,
    contentZh: r.zh,
    type: "video",
    model: m.model,
    vendor: m.vendor,
    params: m.params,
    tags: r.tags,
    language: "en",
    source,
    videoUrl: VIDEO_URLS[i % VIDEO_URLS.length],
    hue: (i * 37) % 360,
    pattern: PATTERNS[i % PATTERNS.length],
    viewCount,
    copyCount: Math.round(viewCount * (0.12 + (i % 5) * 0.02)),
    ratingAvg: RATINGS[i % RATINGS.length],
    ratingCount: 18 + ((i * 97) % 480),
    isFeatured: i % 4 === 0,
    status: "published",
    authorName: AUTHORS[i % AUTHORS.length],
    visibility: "public",
    createdDaysAgo: (i % 90) + 1,
  };
  if (sourceUrl) entry.sourceUrl = sourceUrl;
  return entry;
});
