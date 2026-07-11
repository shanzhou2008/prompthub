// 让 iga CLI 走代理的包装脚本
const { setGlobalDispatcher, ProxyAgent } = require('undici');

const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
if (proxyUrl) {
  const agent = new ProxyAgent(proxyUrl);
  setGlobalDispatcher(agent);
}

require('/root/.nvm/versions/node/v24.15.0/lib/node_modules/@iga-pages/cli/dist/index.js');
