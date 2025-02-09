#!/bin/bash

code . -r && echo "cd backend && source venv/bin/activate ** cd .." | clip.exe
git pull
sudo service postgresql start

gnome-terminal --geometry=132x43 -- bash -c '
cd backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000; bash
'

gnome-terminal --geometry=132x43 -- bash -c '
cd medpass
pnpm install
pnpm dev; bash
'