module.exports = {
    apps: [{
      name: 'medpass-frontend',
      script: 'pnpm',
      args: 'dev',
      watch: true,
      env: {
        NODE_ENV: 'development',
      }
    }]
  }