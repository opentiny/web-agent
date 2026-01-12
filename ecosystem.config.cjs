/**
 * PM2 生产环境配置文件
 * 使用方法:
 *   启动: pnpm pm2:start
 *   停止: pnpm pm2:stop
 *   重启: pnpm pm2:restart
 *   删除: pnpm pm2:delete
 *   日志: pnpm pm2:logs
 */
module.exports = {
  apps: [
    {
      name: 'web-agent',
      script: './dist/server.js',
      instances: 1, // 单实例模式
      exec_mode: 'fork', // fork 模式（单实例推荐）
      watch: false, // 生产环境不监听文件变化
      max_memory_restart: '1G', // 内存超过 1G 时自动重启
      env: {
        NODE_ENV: 'production',
      },
      // 日志配置
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      // 优雅重启配置
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
