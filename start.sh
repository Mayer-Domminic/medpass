#!/bin/bash

# Function to open new terminal window
open_terminal() {
    local title=$1
    local command=$2
    gnome-terminal --title="$title" --geometry=132x43 -- bash -c "$command; bash"
}

# Start development services
if [ "$1" = "docker" ]; then
    # Docker-based development
    docker compose up --build
else
    # Traditional multi-console development
    code . -r
    
    # Start PostgreSQL if not running
    if ! pg_isready >/dev/null 2>&1; then
        sudo service postgresql start
    fi

    # Backend terminal
    open_terminal "Backend" "cd backend && source venv/bin/activate && pip install -r requirements.txt && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

    # Frontend terminal
    open_terminal "Frontend" "cd medpass && pnpm install && pnpm dev"
