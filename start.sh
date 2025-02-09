#!/bin/bash

code .
git pull

# Backend setup in new terminal
gnome-terminal --tab -- bash -c '
cd backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
'

# Frontend setup in new terminal
gnome-terminal --tab -- bash -c '
cd medpass
pnpm install
pnpm dev
'