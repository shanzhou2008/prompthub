import type { Prompt } from "../types";

type SeedPrompt = Omit<
  Prompt,
  "createdAt" | "updatedAt" | "userId" | "projectId"
> & { createdDaysAgo: number };

const PATTERNS = ["mesh", "orbs", "rings", "waves", "grid", "aurora"] as const;
const AUTHORS = ["curator", "aria", "kenji", "luna", "max"] as const;

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
  "https://snackprompt.com",
  "https://www.reddit.com/r/PromptEngineering",
];

const OFFICIAL_URLS = [
  "https://openai.com/sora",
  "https://kling.kuaishou.com",
  "https://jimeng.jianying.com",
  "https://hailuoai.video",
  "https://docs.midjourney.com",
];

const MODEL_CONFIGS: Record<
  string,
  { model: string; vendor: string; params: Record<string, string | number> }
> = {
  "midjourney": { model: "midjourney", vendor: "Midjourney", params: { aspect: "16:9", version: "v6", stylize: 300 } },
  "flux": { model: "flux", vendor: "Black Forest Labs", params: { guidance: 3.5, steps: 28 } },
  "stable-diffusion": { model: "stable-diffusion", vendor: "Stability AI", params: { steps: 30, cfg: 7, sampler: "DPM++ 2M Karras" } },
  "dall-e-3": { model: "dall-e-3", vendor: "OpenAI", params: { quality: "hd", style: "vivid" } },
  "sora": { model: "sora", vendor: "OpenAI", params: { duration: "10s", resolution: "4k" } },
  "kling": { model: "kling", vendor: "Kuaishou", params: { duration: "8s", resolution: "4k" } },
  "jimeng": { model: "jimeng", vendor: "ByteDance", params: { duration: "8s" } },
  "hailuo": { model: "hailuo", vendor: "MiniMax", params: { duration: "6s", resolution: "1080p" } },
  "gpt-4": { model: "gpt-4", vendor: "OpenAI", params: { temperature: 0.6, max_tokens: 4096 } },
  "claude-3.5": { model: "claude-3.5", vendor: "Anthropic", params: { temperature: 0.7, max_tokens: 6144 } },
  "gemini": { model: "gemini", vendor: "Google", params: { temperature: 0.5, max_tokens: 4096 } },
};

interface Raw {
  id: string;
  title: string;
  en: string;
  zh: string;
  type: "image" | "video" | "task";
  model: string;
  tags: string[];
}

const RAW: Raw[] = [
  /* ===== 一、AI 短剧制作 (drama_001 ~ drama_020, video) ===== */
  { id: "drama_001", title: "竖屏短剧开场钩子镜头", en: "Vertical 9:16 short-drama cold open hook: extreme close-up of a woman's teary eyes snapping open, rapid rack focus to a ringing phone showing an unknown number, shallow depth of field, moody low-key lighting, desaturated teal grade, handheld micro-shake, suspenseful, 4k cinematic", zh: "竖屏9:16短剧冷开场钩子镜头：女子含泪双眼猛然睁开的极特写，快速移焦至响铃手机显示未知号码，浅景深，低调情绪布光，去饱和青色调，手持微晃，悬疑氛围，4K电影感", type: "video", model: "sora", tags: ["短剧", "开场钩子", "竖屏", "悬疑"] },
  { id: "drama_002", title: "霸道总裁雨中相遇", en: "Vertical short-drama scene: domineering CEO in tailored black suit shielding a drenched office worker with his coat under heavy rain, neon city backdrop, slow-motion rain droplets, dramatic rim light, romantic tension, shallow depth of field, cinematic color grade, 8k", zh: "竖屏短剧场景：霸道总裁身着黑色定制西装，暴雨中用外套为淋透的职场女员工挡雨，霓虹城市背景，慢动作雨滴，戏剧性轮廓光，浪漫张力，浅景深，电影级调色，8K", type: "video", model: "kling", tags: ["短剧", "霸总", "雨中相遇", "浪漫"] },
  { id: "drama_003", title: "重生复仇开篇镜头", en: "Vertical short-drama rebirth-revenge opener: protagonist wakes gasping in a retro 1990s bedroom, calendar on wall reads 1998, golden morning light through curtain, dolly-in push, realization dawning on face, nostalgic film grain, cinematic 4k", zh: "竖屏短剧重生复仇开篇：主角在1990年代复古卧室中惊醒喘息，墙上日历显示1998年，金色晨光穿过窗帘，推轨镜头，顿悟神情浮现脸庞，怀旧胶片颗粒，电影级4K", type: "video", model: "jimeng", tags: ["短剧", "重生", "复仇", "怀旧"] },
  { id: "drama_004", title: "角色一致性多场景衔接", en: "Vertical short-drama with strict character consistency: same female lead in red coat walking through three connected scenes—rainy street, neon alley, candlelit room—seamless match-cut transitions, consistent face and outfit, cinematic lighting continuity, 4k", zh: "竖屏短剧严格角色一致性：同一红衣女主穿梭三个相连场景——雨夜街道、霓虹小巷、烛光房间——无缝匹配剪辑转场，面孔与服装一致，电影级布光连贯，4K", type: "video", model: "hailuo", tags: ["短剧", "角色一致性", "转场", "连贯"] },
  { id: "drama_005", title: "情感冲突特写节奏", en: "Vertical short-drama emotional clash montage: rapid alternating close-ups of two arguing lovers—trembling lips, clenched fists, welling tears—quickening cut rhythm, handheld intensity, warm-to-cool color shift, dramatic backlight, cinematic 4k", zh: "竖屏短剧情感冲突蒙太奇：争吵情侣的快速交替特写——颤抖的嘴唇、紧握的拳头、盈眶的泪水——加速剪辑节奏，手持强度，暖转冷色调，戏剧性逆光，电影级4K", type: "video", model: "sora", tags: ["短剧", "情感冲突", "特写", "蒙太奇"] },
  { id: "drama_006", title: "悬疑反转空镜过渡", en: "Vertical short-drama suspense reveal transition: slow push-in on an empty hallway, flickering fluorescent light, swinging door ajar, scattered photographs on floor, dust motes in light beam, eerie silence, desaturated grade, Hitchcock-style tension, 4k", zh: "竖屏短剧悬疑反转过渡：缓慢推进空荡走廊，闪烁荧光灯，半掩的摇晃门，地上散落照片，光束中尘埃微粒，诡异寂静，去饱和调色，希区柯克式张力，4K", type: "video", model: "kling", tags: ["短剧", "悬疑", "空镜", "反转"] },
  { id: "drama_007", title: "爆款短剧拆解示范镜头", en: "Vertical short-drama viral breakdown shot: split-screen showing protagonist before and after transformation—plain office worker to glamorous executive—dynamic whip-pan transition, golden hour glow, satisfying upgrade reveal, cinematic 4k", zh: "竖屏短剧爆款拆解镜头：分屏展示主角前后蜕变——朴素职场人到华丽高管——动态甩镜转场，金色时刻光辉，爽感升级揭幕，电影级4K", type: "video", model: "jimeng", tags: ["短剧", "爆款拆解", "蜕变", "分屏"] },
  { id: "drama_008", title: "逆袭打脸高潮镜头", en: "Vertical short-drama underdog payoff climax: protagonist in elegant gown descending grand staircase, stunned crowd reaction cuts, slow-motion fabric flow, chandelier sparkle, triumphant expression, dramatic orchestral mood lighting, cinematic 4k", zh: "竖屏短剧逆袭打脸高潮：主角身着优雅礼服走下宏伟楼梯，震惊人群反应切换，慢动作裙摆飘动，水晶吊灯闪烁，胜利神情，戏剧性管弦氛围布光，电影级4K", type: "video", model: "hailuo", tags: ["短剧", "逆袭", "打脸", "高潮"] },
  { id: "drama_009", title: "场景转换转场设计", en: "Vertical short-drama seamless scene transition: match-cut from coffee cup swirl to tornado of autumn leaves, then to spinning ceiling fan, continuous circular motion blur, color-shift grading, fluid cinematic flow, 4k", zh: "竖屏短剧无缝场景转换：从咖啡漩涡匹配剪辑到秋叶龙卷风，再到旋转吊扇，连续圆形运动模糊，色彩渐变调色，流畅电影感，4K", type: "video", model: "sora", tags: ["短剧", "转场", "匹配剪辑", "运镜"] },
  { id: "drama_010", title: "竖屏运镜情绪推进", en: "Vertical short-drama emotional push-in: continuous dolly toward protagonist standing alone on rooftop at dusk, city lights blooming behind, wind in hair, single tear falling, slow build from wide to extreme close-up, golden hour, cinematic 4k", zh: "竖屏短剧情绪推进镜头：黄昏屋顶独自站立主角的连续推轨，城市灯光在身后绽放，发丝飘动，一滴泪滑落，从全景缓慢推进至极特写，金色时刻，电影级4K", type: "video", model: "kling", tags: ["短剧", "运镜", "情绪", "推轨"] },
  { id: "drama_011", title: "重生回到过去觉醒", en: "Vertical short-drama rebirth awakening: protagonist opens eyes to find younger self in childhood bedroom, sunbeam through dusty window, old radio playing, sense of deja vu, soft nostalgic grade, slow orbit shot, cinematic 4k", zh: "竖屏短剧重生觉醒：主角睁眼发现回到童年卧室的年幼自己，阳光穿过积尘窗户，老式收音机播放，似曾相识感，柔和怀旧调色，缓慢环绕镜头，电影级4K", type: "video", model: "jimeng", tags: ["短剧", "重生", "觉醒", "怀旧"] },
  { id: "drama_012", title: "霸总办公室对峙", en: "Vertical short-drama CEO confrontation: domineering boss leaning over desk toward defiant female employee, low-angle power shot, vertical blinds casting shadow stripes, tense eye contact, dramatic chiaroscuro lighting, cinematic 4k", zh: "竖屏短剧霸总对峙：霸道老板俯身办公桌逼向倔强女员工，低角度权力镜头，垂直百叶窗投下条纹阴影，紧张眼神对峙，戏剧性明暗对比布光，电影级4K", type: "video", model: "hailuo", tags: ["短剧", "霸总", "对峙", "权力镜头"] },
  { id: "drama_013", title: "悬疑暗门推开镜头", en: "Vertical short-drama suspense door reveal: hand slowly pushing open creaking wooden door, single beam of flashlight cutting through darkness, dust particles, shadowy figure glimpse, POV handheld, eerie green-tinted grade, cinematic 4k", zh: "竖屏短剧悬疑暗门揭示：手缓缓推开吱呀木门，手电筒单束光切入黑暗，尘埃微粒，黑影一闪而过，第一人称手持，诡异青绿色调，电影级4K", type: "video", model: "sora", tags: ["短剧", "悬疑", "暗门", "第一人称"] },
  { id: "drama_014", title: "短剧分镜脚本示范镜头", en: "Vertical short-drama storyboard-style shot: overhead flat-lay of handwritten storyboard sketches animating to life—each panel morphing into a live scene—creative meta transition, paper texture, warm desk lamp light, cinematic 4k", zh: "竖屏短剧分镜脚本风格镜头：手绘分镜草图的俯拍平铺逐帧活化——每个分格变形为实拍场景——创意元转场，纸张质感，温暖台灯光，电影级4K", type: "video", model: "kling", tags: ["短剧", "分镜脚本", "元转场", "创意"] },
  { id: "drama_015", title: "情感冲突雨中撕扯", en: "Vertical short-drama rain-soaked emotional clash: couple arguing under single umbrella, rain hammering down, he grabs her wrist, she pulls away, motion-blurred rain streaks, blue-hour city backdrop, dramatic backlight, cinematic 4k", zh: "竖屏短剧雨中情感冲突：情侣在单伞下争吵，暴雨倾盆，他抓住她手腕，她挣脱，运动模糊雨丝，蓝调时刻城市背景，戏剧性逆光，电影级4K", type: "video", model: "jimeng", tags: ["短剧", "情感冲突", "雨景", "撕扯"] },
  { id: "drama_016", title: "反转真相揭露镜头", en: "Vertical short-drama twist reveal: protagonist slowly turning photograph to camera, revealing hidden second figure, extreme close-up of widening eyes, heartbeat-rhythm cut, shallow depth of field, cold blue grade, cinematic 4k", zh: "竖屏短剧反转揭露：主角缓缓将照片转向镜头，揭示隐藏的第二人影，睁大双眼的极特写，心跳节奏剪辑，浅景深，冷蓝调色，电影级4K", type: "video", model: "hailuo", tags: ["短剧", "反转", "真相", "特写"] },
  { id: "drama_017", title: "角色多机位一致性", en: "Vertical short-drama multi-angle character consistency: same male lead filmed from three angles—front, profile, behind—walking through market, consistent wardrobe and face, dynamic cutting between angles, cinematic 4k", zh: "竖屏短剧多机位角色一致性：同一男主从正面、侧面、背面三个角度穿行市场，服装与面孔一致，角度间动态剪辑，电影级4K", type: "video", model: "sora", tags: ["短剧", "多机位", "角色一致性", "市场"] },
  { id: "drama_018", title: "竖屏快切节奏蒙太奇", en: "Vertical short-drama fast-cut montage: rapid sub-second cuts of urban nightlife—neon signs, running footsteps, slamming doors, glancing eyes—escalating rhythm, motion blur, cyberpunk magenta-teal grade, cinematic 4k", zh: "竖屏短剧快切蒙太奇：城市夜生活的亚秒级快速切换——霓虹招牌、奔跑脚步、摔门、瞥视——节奏攀升，运动模糊，赛博朋克品红青色调，电影级4K", type: "video", model: "kling", tags: ["短剧", "快切", "蒙太奇", "赛博朋克"] },
  { id: "drama_019", title: "重生金手指觉醒", en: "Vertical short-drama rebirth power awakening: protagonist's palm glowing with golden runes, eyes flashing recognition of future knowledge, particle effects swirling, dark room lit by golden glow, epic slow-motion, cinematic 4k", zh: "竖屏短剧重生金手指觉醒：主角掌心浮现金色符文发光，眼中闪过未来知识认知，粒子特效旋绕，黑暗房间被金光照亮，史诗慢动作，电影级4K", type: "video", model: "jimeng", tags: ["短剧", "重生", "金手指", "特效"] },
  { id: "drama_020", title: "爆款结尾悬念钩子", en: "Vertical short-drama cliffhanger ending: slow push-in on protagonist's shocked expression as car headlights suddenly flood the frame, freeze-frame on gasp, cut to black, dramatic sting mood, cinematic low-key lighting, 4k", zh: "竖屏短剧爆款结尾悬念：缓慢推进主角震惊表情，车前灯骤然照亮画面，倒吸气定格，切黑，戏剧性弦乐氛围，电影级低调布光，4K", type: "video", model: "hailuo", tags: ["短剧", "结尾钩子", "悬念", "定格"] },

  /* ===== 二、电商带货 (eco_001 ~ eco_020, image/video 混合) ===== */
  { id: "eco_001", title: "电商产品主图生成", en: "E-commerce hero product shot of a minimalist skincare serum bottle on a polished marble pedestal, soft diffused studio lighting, subtle water droplets, clean white background, gentle reflection, premium beauty branding, ultra-detailed, 8k --ar 4:5 --v 6 --stylize 300", zh: "电商主图：极简护肤精华瓶置于抛光大理石底座，柔和漫射影棚布光，精致水珠，纯白背景，柔和倒影，高端美妆品牌质感，超精细，8K", type: "image", model: "midjourney", tags: ["电商", "主图", "美妆", "白底"] },
  { id: "eco_002", title: "纯白底商品图", en: "Pure white background product photography of wireless noise-cancelling headphones, floating at slight angle, crisp shadow beneath, even softbox lighting, sharp material detail, e-commerce catalog style, no props, centered composition", zh: "纯白底商品摄影：无线降噪耳机略带角度悬浮，下方利落投影，柔光箱均匀布光，材质细节锐利，电商目录风格，无道具，居中构图", type: "image", model: "flux", tags: ["电商", "白底图", "数码", "目录"] },
  { id: "eco_003", title: "场景化产品氛围图", en: "Lifestyle product scene: artisan ceramic coffee mug on rustic wooden table by sunlit window, open book, scattered coffee beans, warm morning light, cozy cafe atmosphere, shallow depth of field, lifestyle branding photography", zh: "生活方式产品场景：手工陶瓷咖啡杯置于阳光窗边的质朴木桌，翻开的书，散落咖啡豆，温暖晨光，惬意咖啡馆氛围，浅景深，生活方式品牌摄影", type: "image", model: "dall-e-3", tags: ["电商", "场景图", "咖啡", "氛围"] },
  { id: "eco_004", title: "模特穿搭展示图", en: "Fashion model wearing oversized cream knit sweater and wide-leg trousers, standing in minimalist beige studio, soft natural light, full-body editorial pose, neutral color palette, lookbook style, shot on 50mm, 8k --ar 4:5 --v 6 --stylize 300", zh: "时尚模特身着奶白宽松针织衫与阔腿裤，站立于极简米色影棚，柔和自然光，全身编辑姿势，中性色调，lookbook风格，50mm镜头，8K", type: "image", model: "midjourney", tags: ["电商", "穿搭", "模特", "lookbook"] },
  { id: "eco_005", title: "电商详情页设计图", en: "E-commerce product detail page layout design: split sections showing hiking backpack features—waterproof fabric close-up, compartment diagram, size chart, lifestyle use—clean grid layout, outdoorsy green and sand palette, UI mockup style", zh: "电商详情页布局设计：分区展示登山背包功能——防水面料特写、隔层示意图、尺码表、生活使用——简洁网格布局，户外绿与沙色调，UI样机风格", type: "image", model: "flux", tags: ["电商", "详情页", "UI", "户外"] },
  { id: "eco_006", title: "直播带货话术视频", en: "Vertical livestream commerce video: charismatic host holding a skincare bottle, energetic gesture, ring light glow, product showcase close-up, scrolling comment overlay aesthetic, vibrant warm lighting, engaging sales pitch mood, 4k", zh: "竖屏直播带货视频：充满魅力的主播手持护肤瓶，活力手势，环形灯光辉，产品展示特写，滚动评论覆盖美学，鲜艳暖光，带货话术氛围，4K", type: "video", model: "kling", tags: ["电商", "直播", "话术", "带货"] },
  { id: "eco_007", title: "产品卖点提炼海报", en: "Product feature highlight poster: smartwatch floating with callout labels pointing to heart-rate sensor, AMOLED display, battery icon, sleek dark gradient background, neon accent lines, tech marketing infographic style, crisp typography placeholders", zh: "产品卖点海报：智能手表悬浮，标注引线指向心率传感器、AMOLED屏、电池图标，流畅深色渐变背景，霓虹强调线，科技营销信息图风格，清晰字体占位", type: "image", model: "dall-e-3", tags: ["电商", "卖点海报", "信息图", "科技"] },
  { id: "eco_008", title: "短视频带货脚本视频", en: "Vertical short-video commerce script: unboxing reveal of wireless earbuds, quick-cut feature demos—tap pairing, waterproof splash, battery insert—dynamic handheld, bright pop-color background, energetic pacing, 4k", zh: "竖屏短视频带货脚本：无线耳机开箱揭幕，快切功能演示——触控配对、防水溅水、电池插入——动态手持，明亮跳色背景，活力节奏，4K", type: "video", model: "jimeng", tags: ["电商", "带货脚本", "开箱", "快切"] },
  { id: "eco_009", title: "促销节日海报", en: "Sale promotion poster: bold mega-sale typography placeholder, exploding confetti, gift boxes, discount percentage badges, vibrant red and gold palette, festive dynamic composition, e-commerce banner design, 8k --ar 16:9 --v 6 --stylize 300", zh: "促销海报：醒目大促字体占位，爆炸彩纸，礼盒，折扣百分比徽章，鲜艳红金配色，节日动感构图，电商banner设计，8K", type: "image", model: "midjourney", tags: ["电商", "促销海报", "节日", "banner"] },
  { id: "eco_010", title: "节日营销主题图", en: "Holiday marketing visual: Christmas-themed cosmetic gift set under frosted pine branches, warm bokeh string lights, red velvet ribbon, cozy snow-dusted backdrop, premium festive product photography, shallow depth of field", zh: "节日营销视觉：圣诞主题化妆品礼盒置于霜松枝下，温暖散景串灯，红色丝绒缎带，惬意雪覆背景，高端节日产品摄影，浅景深", type: "image", model: "flux", tags: ["电商", "节日营销", "圣诞", "礼盒"] },
  { id: "eco_011", title: "商品对比图", en: "Side-by-side product comparison split-screen: left side old-style bulky vacuum, right side sleek cordless model, clean white studio, comparison labels and checkmark icons, versus layout, e-commerce decision aid style", zh: "并排产品对比分屏：左侧老式笨重吸尘器，右侧流线无线款，纯白影棚，对比标签与勾选图标，VS布局，电商决策辅助风格", type: "image", model: "dall-e-3", tags: ["电商", "对比图", "决策", "VS"] },
  { id: "eco_012", title: "买家秀风格图", en: "Authentic buyer-review style photo: woman smiling in living room wearing new sundress, casual smartphone camera aesthetic, slightly imperfect framing, natural window light, cozy home setting, UGC lifestyle vibe --ar 4:5 --v 6 --stylize 300", zh: "真实买家秀风格：女子客厅穿新连衣裙微笑，随性手机拍摄美学，略不完美构图，自然窗光，温馨家居场景，UGC生活感", type: "image", model: "midjourney", tags: ["电商", "买家秀", "UGC", "生活感"] },
  { id: "eco_013", title: "种草图文封面", en: "Lifestyle seeding post cover: flat-lay of aesthetic desk setup—laptop, coffee, succulent, notebook—top-down view, soft daylight, neutral beige palette, Instagram-worthy minimal styling, lifestyle influencer aesthetic", zh: "种草图文封面：审美桌面平铺——笔记本、咖啡、多肉、记事本——俯拍，柔和日光，中性米色调，Instagram风极简造型，生活方式博主美学", type: "image", model: "flux", tags: ["电商", "种草", "平铺", "ins风"] },
  { id: "eco_014", title: "小红书爆款封面", en: "Xiaohongshu viral cover style: woman holding skincare product with surprised expression, bold Chinese title placeholder text space, soft pink gradient background, beauty guru aesthetic, vertical 3:4 ratio, lifestyle influencer vibe", zh: "小红书爆款封面风格：女子持护肤产品惊讶表情，醒目中文标题占位空间，柔和粉色渐变背景，美妆博主美学，竖屏3:4比例，生活方式博主氛围", type: "image", model: "dall-e-3", tags: ["电商", "小红书", "封面", "美妆"] },
  { id: "eco_015", title: "抖音带货视频脚本", en: "Vertical TikTok commerce script: influencer doing outfit transition—snap cut from pajamas to stylish streetwear—trending aesthetic, neon gradient background, dynamic jump cuts, energetic dance-pose finale, 4k", zh: "竖屏抖音带货脚本：博主穿搭换装——响指切换从睡衣到时尚街头潮服——潮流美学，霓虹渐变背景，动态跳切，活力舞蹈pose收尾，4K", type: "video", model: "kling", tags: ["电商", "抖音", "换装", "带货"] },
  { id: "eco_016", title: "产品演示视频", en: "Vertical product demo video: smartphone rotating 360 degrees on glossy white surface, app icons glowing on screen, smooth motion, clean studio lighting, tech commercial reveal style, 4k", zh: "竖屏产品演示视频：智能手机在光亮白色台面360度旋转，应用图标在屏发光，平滑运动，干净影棚布光，科技商业揭幕风格，4K", type: "video", model: "jimeng", tags: ["电商", "产品演示", "手机", "商业"] },
  { id: "eco_017", title: "开箱种草视频", en: "Vertical unboxing video: hands lifting lid of premium shoe box, tissue paper rustling, sneakers revealed in slow-motion, warm directional light, ASMR aesthetic, product reveal build-up, 4k", zh: "竖屏开箱视频：双手掀起高端鞋盒盖，包装纸沙沙作响，慢动作揭示球鞋，温暖定向光，ASMR美学，产品揭幕铺垫，4K", type: "video", model: "kling", tags: ["电商", "开箱", "种草", "ASMR"] },
  { id: "eco_018", title: "节日促销视频", en: "Vertical holiday promo video: festive gift boxes bursting open with confetti and product samples, golden sparkles, red and green palette, dynamic slow-motion, joyful commercial mood, 4k", zh: "竖屏节日促销视频：节日礼盒爆开迸出彩纸与产品小样，金色火花，红绿配色，动态慢动作，欢乐商业氛围，4K", type: "video", model: "jimeng", tags: ["电商", "节日", "促销", "礼盒"] },
  { id: "eco_019", title: "限时秒杀视频", en: "Vertical flash-sale video: countdown timer graphic overlay on pulsing product shot, bold red flash effects, energetic quick cuts, urgency-building motion graphics, e-commerce conversion style, 4k", zh: "竖屏秒杀视频：脉动产品镜头上叠加倒计时图形，醒目红色闪光特效，活力快切，紧迫感动态图形，电商转化风格，4K", type: "video", model: "kling", tags: ["电商", "秒杀", "倒计时", "转化"] },
  { id: "eco_020", title: "直播切片视频", en: "Vertical livestream highlight clip: host demonstrating kitchen gadget with enthusiastic gesture, product in action close-up, ring light reflection, comment overlay aesthetic, authentic stream vibe, 4k", zh: "竖屏直播切片：主播热情比划演示厨房小工具，产品使用特写，环形灯反射，评论覆盖美学，真实直播氛围，4K", type: "video", model: "jimeng", tags: ["电商", "直播切片", "厨房", "带货"] },

  /* ===== 三、爆款复刻 (viral_001 ~ viral_015, task) ===== */
  { id: "viral_001", title: "爆款文案拆解与复刻", en: "You are a viral copywriting analyst. Deconstruct the hit copy {{sourceCopy}}: extract hook type, emotional triggers, structure (PAS/AIDA), pacing, and CTA. Then produce 3 fresh variants for {{product}} preserving the winning mechanics, avoiding plagiarism. Explain why each should convert.", zh: "你是一名爆款文案分析师。请拆解爆款文案{{sourceCopy}}：提取钩子类型、情绪触发点、结构（PAS/AIDA）、节奏与行动号召。随后为{{product}}产出3条新变体，保留致胜机制、避免抄袭。解释每条为何能转化。", type: "task", model: "gpt-4", tags: ["爆款复刻", "文案拆解", "PAS", "AIDA"] },
  { id: "viral_002", title: "小红书爆款笔记公式", en: "Act as a Xiaohongshu growth strategist. Reverse-engineer the viral note formula: craft a {{topic}} note with emoji-rich title, hook-first opening, 3-point value body with subheadings, personal anecdote, soft CTA, and 15 hashtags. Specify cover image direction and posting time for {{audience}}.", zh: "你是一名小红书增长策略师。请逆向工程爆款笔记公式：创作一篇{{topic}}笔记，含emoji标题、钩子开场、3点价值正文带小标题、个人故事、软性行动号召与15个标签。指定封面图方向与面向{{audience}}的发布时间。", type: "task", model: "claude-3.5", tags: ["爆款复刻", "小红书", "笔记公式", "标签"] },
  { id: "viral_003", title: "抖音爆款视频脚本公式", en: "You are a Douyin short-video scriptwriter. Build a 30-second {{niche}} video script using the 3-second hook—conflict—escalation—payoff—CTA formula. Provide shot-by-shot direction, on-screen text, voiceover lines, BGM mood, and a scroll-stopping opening frame description. Target {{audience}}.", zh: "你是一名抖音短视频编剧。请用3秒钩子—冲突—升级—回报—行动号召公式构建30秒{{niche}}视频脚本。提供逐镜指导、屏幕字幕、配音台词、BGM氛围与让人停下滑动的开场画面描述。目标受众{{audience}}。", type: "task", model: "gemini", tags: ["爆款复刻", "抖音", "脚本公式", "钩子"] },
  { id: "viral_004", title: "公众号10w+文章拆解", en: "Act as a WeChat Official Account analyst. Deconstruct viral article {{article}}: identify headline formula, emotional arc, shareable insight and social currency. Produce an outline for a 10w+ article on {{topic}} with the same mechanics, section headings, and a hook paragraph draft.", zh: "你是一名公众号分析师。请拆解爆款文章{{article}}：识别标题公式、情绪曲线、可分享洞见与社会货币。用相同机制为{{topic}}产出10w+文章大纲，含章节标题与钩子段落草稿。", type: "task", model: "gpt-4", tags: ["爆款复刻", "公众号", "10w+", "拆解"] },
  { id: "viral_005", title: "B站爆款选题策划", en: "You are a Bilibili content strategist. Propose 5 viral topic ideas for channel {{channel}} in field {{field}}. For each: title with curiosity gap, thumbnail concept, 1-line synopsis, target emotion, and why it fits Bilibili. Rank by potential view multiplier and justify the top pick.", zh: "你是一名B站内容策略师。请为{{field}}领域的频道{{channel}}提出5个爆款选题。每个含：带好奇缺口的标题、封面概念、一行简介、目标情绪及为何契合B站。按潜在播放倍率排序并论证首选。", type: "task", model: "claude-3.5", tags: ["爆款复刻", "B站", "选题", "算法"] },
  { id: "viral_006", title: "短视频钩子设计", en: "Act as a short-video hook designer. Generate 10 scroll-stopping 3-second hooks for {{topic}} videos. Use techniques: counterintuitive claim, direct question, dramatic visual cue, bold promise, relatable pain. For each, write the opening line, on-screen text, and visual action. Flag clickbait risks.", zh: "你是一名短视频钩子设计师。请为{{topic}}视频生成10个让人停下滑动的3秒钩子。运用技巧：反直觉断言、直接提问、戏剧视觉提示、大胆承诺、可共情痛点。每个写出开场白、屏幕字幕与视觉动作。标注标题党风险。", type: "task", model: "gemini", tags: ["爆款复刻", "钩子", "短视频", "标题党"] },
  { id: "viral_007", title: "评论区互动话术", en: "You are a community engagement specialist. Draft 15 comment-section replies for post {{post}} that boost algorithmic visibility: mix of questions to spark debate, witty responses, value-adding follow-ups, and subtle CTAs. Vary tone for different commenter types. Avoid generic nice-post replies.", zh: "你是一名社区互动专家。请为帖子{{post}}起草15条提升算法可见度的评论区回复：混合引发辩论的提问、机智回应、增值补充与软性行动号召。针对不同评论者类型变化语气。避免泛泛的好评回复。", type: "task", model: "gpt-4", tags: ["爆款复刻", "评论区", "互动", "算法"] },
  { id: "viral_008", title: "标题党拆解与复用", en: "Act as a headline analyst. Break down clickbait title {{headline}}: identify the curiosity gap, emotional trigger, specificity trick, and implied promise. Then craft 5 honest-but-compelling titles for {{content}} that capture attention without misleading. Explain the click-rate vs trust trade-off.", zh: "你是一名标题分析师。请拆解标题党{{headline}}：识别好奇缺口、情绪触发、具体性技巧与暗示承诺。随后为{{content}}打造5条诚实却吸睛的标题，吸引但不误导。解释点击率与信任间的权衡。", type: "task", model: "claude-3.5", tags: ["爆款复刻", "标题党", "好奇缺口", "信任"] },
  { id: "viral_009", title: "情绪价值提炼", en: "You are an emotional-value strategist. For product {{product}}, identify 5 emotional value propositions beyond functional benefits (belonging, status, safety, growth). For each, write a one-line emotional hook and a 2-sentence story snippet for {{audience}}. Map each to a content format.", zh: "你是一名情绪价值策略师。请为产品{{product}}识别5个超越功能利益的情感价值主张（归属、地位、安全、成长）。每个写一行情绪钩子与2句能引发{{audience}}共鸣的故事片段。将每个映射到内容形式。", type: "task", model: "gemini", tags: ["爆款复刻", "情绪价值", "共鸣", "故事"] },
  { id: "viral_010", title: "网红人设打造", en: "Act as a personal-brand architect. Design a creator persona for {{creator}} on {{platform}}: core identity, signature catchphrase, visual style, content pillars (3), tone of voice, relatability hook, and differentiation. Provide a 30-day content calendar sketch that reinforces the persona.", zh: "你是一名个人品牌架构师。请为{{creator}}在{{platform}}设计创作者人设：核心身份、标志性口头禅、视觉风格、3大内容支柱、语气、可共情钩子与差异化。提供强化人设的30天内容日历草图。", type: "task", model: "gpt-4", tags: ["爆款复刻", "人设", "个人品牌", "内容支柱"] },
  { id: "viral_011", title: "流量密码分析", en: "You are a traffic-pattern analyst. Analyze why content {{content}} went viral: hook strength, emotional resonance, algorithm fit, timing, shareability, and creator authority. Score each factor 1 to 10. Then propose 3 replication angles for {{brand}} that ethically borrow the mechanics.", zh: "你是一名流量模式分析师。请分析内容{{content}}为何爆款：钩子强度、情绪共鸣、算法契合、时机、可分享性与创作者权威。每项1到10打分。随后为{{brand}}提出3个复制角度，合伦理地借用机制。", type: "task", model: "claude-3.5", tags: ["爆款复刻", "流量密码", "算法", "复制"] },
  { id: "viral_012", title: "爆款选题脑暴", en: "Act as a viral-topic brainstormer. Generate 20 cross-platform content ideas for {{niche}} using trend-jacking, contrarian takes, listicles, how-tos, and personal stories. For each: working title, target emotion, best-fit platform (Douyin/XHS/Bilibili/WeChat). Flag the top 3.", zh: "你是一名爆款选题脑暴师。请用蹭热点、反主流观点、清单、教程与个人故事为{{niche}}生成20个跨平台内容创意。每个给工作标题、目标情绪与最契合平台（抖音/小红书/B站/微信）。标注前3个。", type: "task", model: "gemini", tags: ["爆款复刻", "脑暴", "跨平台", "选题"] },
  { id: "viral_013", title: "爆款脚本结构拆解", en: "You are a viral script structuralist. Deconstruct hit script {{script}} into beats: cold open hook, problem framing, tension build, twist, climax, resolution, CTA. Time-stamp each beat for a 60-second video. Then produce a parallel-structure script for {{newTopic}} using the same beat timings.", zh: "你是一名爆款脚本结构师。请将爆款脚本{{script}}拆解为节拍：冷开场钩子、问题框定、张力构建、反转、高潮、解决、行动号召。为60秒视频逐节拍打时间戳。随后用相同节拍时序为{{newTopic}}产出平行结构脚本。", type: "task", model: "gpt-4", tags: ["爆款复刻", "脚本结构", "节拍", "拆解"] },
  { id: "viral_014", title: "私域转化话术", en: "Act as a private-domain conversion copywriter. Write a 5-message WeChat sequence for lead {{lead}} about {{product}}: value-first opener, social-proof follow-up, objection-handling, limited-offer nudge, and no-pressure close. Vary length, use line breaks for readability, and avoid hard-sell tone.", zh: "你是一名私域转化文案。请为潜在客户{{lead}}就{{product}}撰写5条微信序列：价值优先开场、社会证明跟进、异议处理、限时促单、无压力收尾。长度多变，用换行提升可读性，避免硬销语气。", type: "task", model: "claude-3.5", tags: ["爆款复刻", "私域", "转化", "话术"] },
  { id: "viral_015", title: "爆款数据复盘", en: "You are a content-performance analyst. Given metrics {{metrics}} for a viral campaign, diagnose what worked and what did not: hook retention, completion rate, share rate, comment sentiment. Propose 5 concrete optimizations for the next campaign on {{topic}}. Prioritize by expected impact and effort.", zh: "你是一名内容表现分析师。请基于爆款活动指标{{metrics}}诊断成败：钩子留存、完播率、分享率、评论情绪。为下个{{topic}}活动提出5条具体优化。按预期影响与投入排序。", type: "task", model: "gemini", tags: ["爆款复刻", "数据复盘", "完播率", "优化"] },

  /* ===== 四、三视图生成 (tri_001 ~ tri_010, image) ===== */
  { id: "tri_001", title: "IP角色三视图", en: "Character design sheet with three views: front view, side view, back view of a cute robot mascot with rounded body, LED eyes, antenna, consistent proportions across all angles, clean white background, professional concept art, flat lighting, 8k --ar 16:9 --v 6 --stylize 300", zh: "角色设计图三视图：圆身可爱机器人吉祥物的正面图、侧面图、背面图，各角度比例一致，纯白背景，专业概念艺术，平光布光，8K", type: "image", model: "midjourney", tags: ["三视图", "IP角色", "机器人", "概念艺术"] },
  { id: "tri_002", title: "产品三视图设计", en: "Industrial product design three views: front view, side view, back view of a minimalist electric kettle, consistent scale and alignment, technical line-art style with subtle shading, neutral gray background, product designer reference sheet", zh: "工业产品三视图：极简电热水壶的正面图、侧面图、背面图，比例与对齐一致，技术线稿风格带轻微阴影，中性灰背景，产品设计师参考表", type: "image", model: "flux", tags: ["三视图", "产品", "电水壶", "线稿"] },
  { id: "tri_003", title: "建筑三视图", en: "Architectural design three views: front elevation, side elevation, rear elevation of a modern minimalist villa with glass facade, clean technical drawing style, consistent proportions, white background with grid, blueprint aesthetic, professional presentation", zh: "建筑设计三视图：现代极简玻璃立面别墅的正立面、侧立面、背立面图，干净技术制图风格，比例一致，白底网格，蓝图美学，专业展示", type: "image", model: "stable-diffusion", tags: ["三视图", "建筑", "别墅", "蓝图"] },
  { id: "tri_004", title: "服装设计三视图", en: "Fashion design three views: front view, side view, back view of an elegant evening gown on featureless mannequin, consistent silhouette, fabric drape detail, flat studio lighting, white background, fashion designer portfolio style --ar 16:9 --v 6 --stylize 300", zh: "服装设计三视图：无特征人台上的优雅晚礼服正面图、侧面图、背面图，轮廓一致，面料垂坠细节，平光影棚布光，白底，服装设计师作品集风格", type: "image", model: "midjourney", tags: ["三视图", "服装", "晚礼服", "作品集"] },
  { id: "tri_005", title: "机械设计三视图", en: "Mechanical design three views: front view, side view, back view of a futuristic exoskeleton suit, technical orthographic projection, consistent mechanical details, engineering blueprint style, annotations implied, dark technical background, concept art", zh: "机械设计三视图：未来外骨骼套装的正面图、侧面图、背面图，技术正交投影，机械细节一致，工程蓝图风格，隐含标注，深色技术背景，概念艺术", type: "image", model: "flux", tags: ["三视图", "机械", "外骨骼", "正交投影"] },
  { id: "tri_006", title: "Q版角色三视图", en: "Chibi character design three views: front view, side view, back view of a cute wizard girl with oversized hat, big eyes, small body, consistent proportions, cel-shaded anime style, white background, character turnaround reference sheet", zh: "Q版角色设计三视图：戴超大帽子大眼小身的可爱魔法少女的正面图、侧面图、背面图，比例一致，赛璐璐动漫风格，白底，角色转身参考表", type: "image", model: "stable-diffusion", tags: ["三视图", "Q版", "魔法少女", "转身表"] },
  { id: "tri_007", title: "吉祥物三视图", en: "Mascot design three views: front view, side view, back view of a friendly panda mascot in sports jersey, consistent character proportions, vector-like clean shading, white background, brand mascot turnaround sheet, professional --ar 16:9 --v 6 --stylize 300", zh: "吉祥物设计三视图：穿运动球衣的友好熊猫吉祥物的正面图、侧面图、背面图，角色比例一致，矢量感干净阴影，白底，品牌吉祥物转身表，专业", type: "image", model: "midjourney", tags: ["三视图", "吉祥物", "熊猫", "品牌"] },
  { id: "tri_008", title: "道具三视图设计", en: "Prop design three views: front view, side view, back view of a fantasy ornate sword with glowing runes, consistent design across angles, game asset concept art, clean neutral background, detailed material rendering, prop artist reference", zh: "道具设计三视图：带发光符文的奇幻华丽长剑的正面图、侧面图、背面图，各角度设计一致，游戏资产概念艺术，干净中性背景，材质细节渲染，道具师参考", type: "image", model: "flux", tags: ["三视图", "道具", "长剑", "游戏资产"] },
  { id: "tri_009", title: "场景三视图", en: "Environment design three views: front view, side view, back view of a cozy fantasy treehouse interior, consistent spatial layout, matte painting style, warm atmospheric lighting, concept art reference sheet, detailed props", zh: "场景设计三视图：温馨奇幻树屋内部的正面图、侧面图、背面图，空间布局一致，数字绘景风格，温暖氛围光，概念艺术参考表，细节道具", type: "image", model: "stable-diffusion", tags: ["三视图", "场景", "树屋", "绘景"] },
  { id: "tri_010", title: "角色表情集三视图", en: "Character expression sheet: three views grid showing front view, side view, back view of same anime girl plus 6 expression variants—happy, angry, sad, surprised, shy, determined—consistent face design, cel-shaded, white background, animation model sheet --ar 16:9 --v 6 --stylize 300", zh: "角色表情表：同一动漫少女的正面图、侧面图、背面图三视图加6种表情变体——开心、生气、悲伤、惊讶、害羞、坚定——面部设计一致，赛璐璐风格，白底，动画模型表", type: "image", model: "midjourney", tags: ["三视图", "表情集", "动漫", "模型表"] },

  /* ===== 五、故事板/分镜设计 (story_001 ~ story_015, image/video 混合) ===== */
  { id: "story_001", title: "电影分镜板设计", en: "Cinematic storyboard panel sheet: 6-frame grid showing key shots of a chase scene—wide establishing, over-shoulder, low-angle run, POV, close-up sweat, aerial escape—sketch ink style with shot numbers and camera directions, professional film storyboard --ar 16:9 --v 6 --stylize 300", zh: "电影分镜板：6格网格展示追车场景关键镜头——广角建立镜、过肩、低角度奔跑、第一人称、汗水特写、航拍逃脱——素描墨线风格带镜头编号与运镜说明，专业电影分镜", type: "image", model: "midjourney", tags: ["分镜", "电影", "追车", "分镜板"] },
  { id: "story_002", title: "商业广告分镜", en: "Commercial storyboard sequence: 8-frame horizontal layout for a perfume ad—product glow, model portrait, floral B-roll, splash macro, lifestyle scene, logo reveal—clean vector-illustration style, frame numbers, duration notes, ad agency presentation", zh: "商业广告分镜序列：香水广告8格横向布局——产品辉光、模特肖像、花卉空镜、溅水微距、生活场景、Logo揭示——干净矢量插画风格，帧编号，时长备注，广告公司提案", type: "image", model: "flux", tags: ["分镜", "广告", "香水", "矢量"] },
  { id: "story_003", title: "MV音乐分镜", en: "Music video storyboard: 6-panel grid for an emotional ballad—singer silhouette, rain window, couple memory, dance climax, sunset walk, final smile—moody cinematic frames with lighting notes and beat-synced timestamps, professional MV pre-production sheet", zh: "MV分镜：情感抒情曲6格网格——歌手剪影、雨窗、情侣回忆、舞蹈高潮、日落漫步、最终微笑——氛围电影分镜带布光说明与节拍同步时间戳，专业MV前期制作表", type: "image", model: "stable-diffusion", tags: ["分镜", "MV", "抒情曲", "前期制作"] },
  { id: "story_004", title: "动画分镜板", en: "Animation storyboard sequence: 8-frame grid for a fantasy cartoon—hero enters forest, meets creature, conflict, magic cast, victory pose—hand-drawn sketch style with motion arrows and dialogue bubbles, studio animation pre-production layout", zh: "动画分镜序列：奇幻卡通8格网格——勇者进入森林、遇见生物、冲突、施法、胜利pose——手绘素描风格带动作箭头与对话气泡，工作室动画前期制作布局", type: "image", model: "dall-e-3", tags: ["分镜", "动画", "奇幻", "前期制作"] },
  { id: "story_005", title: "短片分镜设计", en: "Short film storyboard panel: 6-frame sequence of a dramatic dialogue scene—two-shot, singles alternating, insert hands, reaction close-up, walk-away wide—sketched with camera movement arrows and lens notes, indie filmmaking pre-production --ar 16:9 --v 6 --stylize 300", zh: "短片分镜板：戏剧对话场景6格序列——双人镜、单人镜交替、手部插入镜、反应特写、走开全景——素描带运镜箭头与镜头说明，独立电影前期制作", type: "image", model: "midjourney", tags: ["分镜", "短片", "对话", "独立电影"] },
  { id: "story_006", title: "商业广告故事板", en: "Brand commercial storyboard: 8-panel sequence for a sneaker ad—athlete tying laces, slow-motion sprint, urban leap, crowd cheer, product hero shot, logo—clean storyboard illustration with shot descriptions, ad agency deliverable style", zh: "品牌商业故事板：球鞋广告8格序列——运动员系鞋带、慢动作冲刺、城市跳跃、人群欢呼、产品英雄镜头、Logo——干净分镜插画带镜头描述，广告公司交付风格", type: "image", model: "flux", tags: ["分镜", "故事板", "球鞋", "广告"] },
  { id: "story_007", title: "产品演示分镜", en: "Product demo storyboard: 6-frame sequence showing smartphone unboxing—box reveal, lid lift, phone glow, feature close-ups, lifestyle use, logo—clean line-art style with on-screen text placeholders and transition notes, tech launch presentation", zh: "产品演示分镜：智能手机开箱6格序列——盒子揭幕、掀盖、手机辉光、功能特写、生活使用、Logo——干净线稿风格带屏幕字幕占位与转场说明，科技发布提案", type: "image", model: "stable-diffusion", tags: ["分镜", "产品演示", "开箱", "线稿"] },
  { id: "story_008", title: "婚礼视频分镜", en: "Wedding video storyboard: 8-panel sequence—bride prep, first look, ceremony vows, ring exchange, kiss, confetti exit, dance, sunset portrait—romantic soft frames with lighting and music cues, wedding cinematographer planning sheet --ar 16:9 --v 6 --stylize 300", zh: "婚礼视频分镜：8格序列——新娘准备、初见、誓言、交换戒指、亲吻、彩纸退场、舞蹈、日落肖像——浪漫柔和分镜带布光与音乐提示，婚礼电影摄影师规划表", type: "image", model: "midjourney", tags: ["分镜", "婚礼", "浪漫", "规划表"] },
  { id: "story_009", title: "纪录片分镜", en: "Documentary storyboard sequence: 6-frame layout for a nature doc—sweeping landscape, wildlife close-up, researcher interview, fieldwork B-roll, drone reveal, emotional climax—realistic sketch style with location and shot notes, documentary pre-production", zh: "纪录片分镜序列：自然纪录片6格布局——壮丽风光、野生动物特写、研究员访谈、田野空镜、无人机揭示、情感高潮——写实素描风格带地点与镜头说明，纪录片前期制作", type: "image", model: "flux", tags: ["分镜", "纪录片", "自然", "前期制作"] },
  { id: "story_010", title: "婚礼快剪分镜镜头", en: "Vertical wedding highlight reel single shot from the storyboard sequence: bride and groom slow-motion twirl under golden sunset, petals falling, lens flare, romantic warm grade, shallow depth of field, cinematic 4k", zh: "竖屏婚礼快剪单镜头取自分镜序列：新娘新郎金色日落下慢动作旋转，花瓣飘落，镜头光晕，浪漫暖调，浅景深，电影级4K", type: "video", model: "kling", tags: ["分镜", "婚礼快剪", "慢动作", "单镜头"] },
  { id: "story_011", title: "剧情短片单镜头", en: "Cinematic short-film single shot from the storyboard sequence: lone protagonist walking down rain-slicked neon alley, reflections shimmering, slow dolly-back reveal, moody blue-hour grade, atmospheric fog, suspenseful, 4k", zh: "电影级剧情短片单镜头取自分镜序列：孤独主角走过雨水浸湿的霓虹小巷，倒影闪烁，缓慢拉镜揭示，氛围蓝调时刻调色，雾气弥漫，悬疑，4K", type: "video", model: "jimeng", tags: ["分镜", "剧情短片", "霓虹", "单镜头"] },
  { id: "story_012", title: "逐帧动画分镜设计", en: "Frame-by-frame animation sequence sheet: 12 keyframes showing a character jumping across rooftops, consistent character design, motion arcs and timing charts, pencil-test sketch style, traditional 2D animation workflow reference", zh: "逐帧动画序列表：角色跳跃屋顶的12关键帧，角色设计一致，运动弧线与节奏图表，铅笔测试素描风格，传统2D动画工作流参考", type: "image", model: "stable-diffusion", tags: ["分镜", "逐帧动画", "关键帧", "2D动画"] },
  { id: "story_013", title: "产品演示单镜头", en: "Vertical product demo single shot from the storyboard sequence: smartphone slowly rotating on mirror surface, screen lighting up with app icons, smooth 360 motion, clean studio reflection, tech commercial aesthetic, 4k", zh: "竖屏产品演示单镜头取自分镜序列：智能手机在镜面缓慢旋转，屏幕亮起应用图标，平滑360运动，干净影棚反射，科技商业美学，4K", type: "video", model: "sora", tags: ["分镜", "产品演示", "旋转", "单镜头"] },
  { id: "story_014", title: "广告单镜头", en: "Cinematic commercial single shot from the storyboard sequence: perfume bottle with golden backlight, liquid swirling, petals drifting around, macro slow-motion, dramatic dark backdrop, luxury ad aesthetic, 4k", zh: "电影级广告单镜头取自分镜序列：香水瓶金色逆光，液体漩涡，花瓣环绕飘落，微距慢动作，戏剧性深色背景，奢华广告美学，4K", type: "video", model: "hailuo", tags: ["分镜", "广告", "香水", "单镜头"] },
  { id: "story_015", title: "MV单镜头", en: "Music video single shot from the storyboard sequence: singer silhouette against massive neon sunset, wind blowing hair, slow push-in, lens flare bloom, emotive color grade, cinematic 4k performance shot", zh: "MV单镜头取自分镜序列：歌手剪影映衬巨大霓虹日落，风吹发丝，缓慢推进，镜头光晕绽放，情绪调色，电影级4K表演镜头", type: "video", model: "kling", tags: ["分镜", "MV", "剪影", "单镜头"] },
];

let videoIdx = 0;

export const extraSeeds: SeedPrompt[] = RAW.map((r, i): SeedPrompt => {
  const cfg = MODEL_CONFIGS[r.model];
  const isVideo = r.type === "video";
  const videoUrl = isVideo
    ? VIDEO_URLS[videoIdx++ % VIDEO_URLS.length]
    : undefined;

  const bucket = i % 10;
  const source: SeedPrompt["source"] =
    bucket < 5 ? "crawled" : bucket < 8 ? "submitted" : "official";
  const sourceUrl =
    source === "submitted"
      ? SUBMITTED_URLS[i % SUBMITTED_URLS.length]
      : source === "official"
        ? OFFICIAL_URLS[i % OFFICIAL_URLS.length]
        : undefined;

  const viewCount = 1000 + ((i * 1373) % 39000);
  const entry: SeedPrompt = {
    id: r.id,
    title: r.title,
    content: r.en,
    contentEn: r.en,
    contentZh: r.zh,
    type: r.type,
    model: cfg.model,
    vendor: cfg.vendor,
    params: cfg.params,
    tags: r.tags,
    language: "en",
    source,
    hue: (i * 37) % 360,
    pattern: PATTERNS[i % PATTERNS.length],
    viewCount,
    copyCount: 100 + ((i * 877) % 7901),
    ratingAvg: +(4.2 + ((i * 7) % 9) / 10).toFixed(1),
    ratingCount: 20 + ((i * 53) % 331),
    isFeatured: i % 4 === 0,
    status: "published",
    authorName: AUTHORS[i % AUTHORS.length],
    visibility: "public",
    createdDaysAgo: 1 + ((i * 3) % 60),
  };
  if (sourceUrl) entry.sourceUrl = sourceUrl;
  if (isVideo && videoUrl) entry.videoUrl = videoUrl;
  return entry;
});
