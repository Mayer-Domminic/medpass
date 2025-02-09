#!/bin/bash

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Delete any existing processes
pm2 delete all

# Start both apps using the ecosystem config
pm2 start ecosystem.config.js

# Save the new PM2 process list
pm2 save

# Display status
pm2 status