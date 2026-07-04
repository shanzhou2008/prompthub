const localtunnel = require('localtunnel');

(async () => {
  try {
    const tunnel = await localtunnel({ port: 5173 });
    console.log('\n========================================');
    console.log('  手机访问地址:', tunnel.url);
    console.log('========================================\n');

    tunnel.on('close', () => {
      console.log('隧道已关闭');
    });

    tunnel.on('error', (err) => {
      console.error('隧道错误:', err.message);
    });

    // 保持进程运行
    setInterval(() => {}, 1000);
  } catch (err) {
    console.error('启动失败:', err.message);
    process.exit(1);
  }
})();
