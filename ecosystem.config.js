module.exports = {
  apps: [
    {
      name: 'trendly-web',
      cwd: './nextjs_space',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'trendly-starnet',
      cwd: './starnet',
      script: 'sidecar/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 8787
      }
    }
  ]
};
