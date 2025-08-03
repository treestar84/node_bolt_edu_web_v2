module.exports = {
  apps: [
    {
      name: 'api',
      script: 'server/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '~/.pm2/logs/api-error.log',
      out_file: '~/.pm2/logs/api-out.log',
      log_file: '~/.pm2/logs/api-combined.log',
      merge_logs: true
    },
    {
      name: 'front',
      script: 'npm',
      args: 'run preview',
      env: {
        NODE_ENV: 'production',
        PORT: 4173
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: '~/.pm2/logs/front-error.log',
      out_file: '~/.pm2/logs/front-out.log',
      log_file: '~/.pm2/logs/front-combined.log',
      merge_logs: true
    }
  ]
};