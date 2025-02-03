module.exports = {
  apps: [
    {
      name: 'medpass-frontend',
      cwd: './medpass',
      script: 'pnpm',
      args: 'dev',
      watch: true,
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'medpass-backend',
      cwd: './backend',
      script: './venv/bin/python',
      args: '-m gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker',
      watch: true,
      env: {
        NODE_ENV: 'development',
        PYTHONUNBUFFERED: 'true'
      }
    }
  ]
}