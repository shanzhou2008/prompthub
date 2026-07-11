const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

const prompts = JSON.parse(fs.readFileSync(path.join(__dirname, 'api/data/prompts.json'), 'utf8'));

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function parseQuery(reqUrl) {
  const parsed = url.parse(reqUrl, true);
  return { pathname: parsed.pathname, query: parsed.query };
}

// API 路由
function handleAPI(req, res, pathname, query) {
  // 统计
  if (pathname === '/api/prompts/stats') {
    const total = prompts.length;
    const image = prompts.filter(p => p.type === 'image').length;
    const video = prompts.filter(p => p.type === 'video').length;
    const task = prompts.filter(p => p.type === 'task').length;
    return sendJSON(res, 200, { success: true, data: { total, image, video, task } });
  }

  // 列表
  if (pathname === '/api/prompts/list') {
    const { q, type, model, tag, sort = 'latest', page = 1, pageSize = 12 } = query;
    let result = [...prompts];

    if (type) result = result.filter(p => p.type === type);
    if (model) result = result.filter(p => p.model === model);
    if (tag) result = result.filter(p => p.tags && p.tags.includes(tag));
    if (q) {
      const lower = String(q).toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(lower) ||
        p.content.toLowerCase().includes(lower) ||
        (p.contentZh && p.contentZh.includes(q))
      );
    }

    if (sort === 'trending') result.sort((a, b) => b.copyCount - a.copyCount);
    else if (sort === 'rating') result.sort((a, b) => b.ratingAvg - a.ratingAvg);
    else result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = result.length;
    const p = parseInt(page);
    const ps = parseInt(pageSize);
    const start = (p - 1) * ps;
    const data = result.slice(start, start + ps);

    return sendJSON(res, 200, {
      success: true,
      data: { data, total, page: p, pageSize: ps, hasMore: start + data.length < total }
    });
  }

  // 每日精选
  if (pathname === '/api/prompts/daily') {
    const featured = prompts.filter(p => p.isFeatured).slice(0, 8);
    if (featured.length >= 4) return sendJSON(res, 200, { success: true, data: featured });
    const random = [...prompts].sort(() => Math.random() - 0.5).slice(0, 8);
    return sendJSON(res, 200, { success: true, data: random });
  }

  // 热门
  if (pathname === '/api/prompts/trending') {
    const trending = [...prompts].sort((a, b) => b.copyCount - a.copyCount).slice(0, 20);
    return sendJSON(res, 200, { success: true, data: trending });
  }

  // 最新
  if (pathname === '/api/prompts/latest') {
    const latest = [...prompts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 20);
    return sendJSON(res, 200, { success: true, data: latest });
  }

  // 筛选项
  if (pathname === '/api/prompts/filters') {
    const models = {};
    const tags = {};
    for (const p of prompts) {
      if (p.model) models[p.model] = (models[p.model] || 0) + 1;
      if (p.tags) for (const t of p.tags) tags[t] = (tags[t] || 0) + 1;
    }
    return sendJSON(res, 200, {
      success: true,
      data: {
        models: Object.entries(models).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        tags: Object.entries(tags).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 50)
      }
    });
  }

  // 图片代理
  if (pathname === '/api/img') {
    const id = query.id;
    const prompt = prompts.find(p => p.id === id);
    if (!prompt) return sendJSON(res, 404, { error: 'Not found' });

    let imgUrl = prompt.imageLgUrl || prompt.imageUrl;
    if (!imgUrl) return sendJSON(res, 404, { error: 'No image' });

    const size = query.size;
    if (size === 'card' && imgUrl.includes('pexels.com')) {
      imgUrl = imgUrl.replace('h=350', 'h=200');
    }

    fetch(imgUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      .then(response => {
        if (!response.ok) throw new Error('Fetch failed');
        return response.arrayBuffer();
      })
      .then(buffer => {
        res.writeHead(200, {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=86400'
        });
        res.end(Buffer.from(buffer));
      })
      .catch(() => sendJSON(res, 502, { error: 'Proxy error' }));
    return;
  }

  // 详情（必须在最后，因为 :id 会匹配其他路径）
  const detailMatch = pathname.match(/^\/api\/prompts\/([^/]+)$/);
  if (detailMatch) {
    const id = detailMatch[1];
    const prompt = prompts.find(p => p.id === id);
    if (!prompt) return sendJSON(res, 404, { success: false, error: 'Not found' });
    return sendJSON(res, 200, { success: true, data: prompt });
  }

  // 相关推荐
  const relatedMatch = pathname.match(/^\/api\/prompts\/([^/]+)\/related$/);
  if (relatedMatch) {
    const id = relatedMatch[1];
    const prompt = prompts.find(p => p.id === id);
    if (!prompt) return sendJSON(res, 200, { success: true, data: [] });
    const related = prompts
      .filter(p => p.id !== id && p.type === prompt.type)
      .sort(() => Math.random() - 0.5)
      .slice(0, 6);
    return sendJSON(res, 200, { success: true, data: related });
  }

  // 评论
  const commentsMatch = pathname.match(/^\/api\/prompts\/([^/]+)\/comments$/);
  if (commentsMatch) {
    return sendJSON(res, 200, { success: true, data: [] });
  }

  // 复制记录（POST）
  const copyMatch = pathname.match(/^\/api\/prompts\/([^/]+)\/copy$/);
  if (copyMatch && req.method === 'POST') {
    const id = copyMatch[1];
    const prompt = prompts.find(p => p.id === id);
    if (prompt) {
      prompt.copyCount = (prompt.copyCount || 0) + 1;
      return sendJSON(res, 200, { success: true, data: { copyCount: prompt.copyCount } });
    }
    return sendJSON(res, 404, { success: false, error: 'Not found' });
  }

  // 收藏相关
  if (pathname === '/api/favorites/ids') {
    return sendJSON(res, 200, { success: true, data: [] });
  }

  if (pathname === '/api/favorites') {
    if (req.method === 'POST') {
      return sendJSON(res, 200, { success: true, data: { favorited: true } });
    }
    return sendJSON(res, 200, { success: true, data: [] });
  }

  if (pathname === '/api/favorites/collections') {
    return sendJSON(res, 200, { success: true, data: [] });
  }

  // 用户相关
  if (pathname === '/api/auth/me') {
    return sendJSON(res, 200, { success: true, data: null });
  }

  if (pathname === '/api/auth/login') {
    return sendJSON(res, 200, { success: true, data: { token: 'demo-token', user: { id: 'demo', username: 'demo' } } });
  }

  if (pathname === '/api/projects') {
    return sendJSON(res, 200, { success: true, data: [] });
  }

  if (pathname === '/api/user/prompts') {
    return sendJSON(res, 200, { success: true, data: [] });
  }

  if (pathname === '/api/user/history') {
    return sendJSON(res, 200, { success: true, data: [] });
  }

  if (pathname === '/api/submissions') {
    return sendJSON(res, 200, { success: true, data: { id: 'demo', status: 'pending' } });
  }

  if (pathname === '/api/subscriptions') {
    return sendJSON(res, 200, { success: true, data: null });
  }

  return sendJSON(res, 404, { success: false, error: 'Not found' });
}

// 静态文件
function serveStatic(res, filePath) {
  const distPath = path.join(__dirname, 'dist');
  const fullPath = path.normalize(path.join(distPath, filePath));
  
  if (!fullPath.startsWith(distPath)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
      return;
    }
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  const ext = path.extname(fullPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const content = fs.readFileSync(fullPath);
  res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600' });
  res.end(content);
}

const server = http.createServer((req, res) => {
  const { pathname, query } = parseQuery(req.url);

  // API 请求
  if (pathname.startsWith('/api/')) {
    handleAPI(req, res, pathname, query);
    return;
  }

  // 静态文件
  serveStatic(res, pathname);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Total prompts: ${prompts.length}`);
});
