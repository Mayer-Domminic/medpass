module.exports = {
  apps: [
    {
      name: 'medpass-frontend',
      cwd: './medpass',
      script: 'pnpm',
      args: 'dev',
      watch: false,  // weird perma restart issues
      kill_timeout: 3000,
      wait_ready: true,
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      }
    },
    {
      name: 'medpass-backend',
      cwd: './backend',
      script: './venv/bin/python',
      args: '-m gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000',
      watch: false,
      kill_timeout: 3000,
      env: {
        NODE_ENV: 'development',
        PYTHONUNBUFFERED: 'true'
      }
    }
  ]
}