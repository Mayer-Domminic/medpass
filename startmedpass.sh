#!/bin/bash

cd ./medpass
echo "Starting medpass-frontend..."
pm2 start --name medpass-frontend --interpreter bash -- "pnpm dev" --watch
cd ../backend
echo "Starting medpass-backend..." 
pm2 start \ --name medpass-backend \ --interpreter $(pwd)/venv/bin/python \ --watch \ -- gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app
echo "Saving PM2 process list..."
pm2 save
echo "PM2 status:"
pm2 status