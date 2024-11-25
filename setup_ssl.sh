#!/bin/bash

# Configuration
EMAIL="domminicmayer@gmail.com"
DOMAIN="api.domm.dev"

echo "Starting SSL and Nginx setup..."

# Install required packages
echo "Installing required packages..."
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# Create web root directory
sudo mkdir -p /var/www/html

# Backup existing Nginx config if it exists
if [ -f /etc/nginx/sites-available/$DOMAIN ]; then
    sudo cp /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-available/$DOMAIN.backup
fi

# Copy new Nginx configuration
sudo cp api.domm.dev.conf /etc/nginx/sites-available/$DOMAIN

# Create symbolic link if it doesn't exist
if [ ! -L /etc/nginx/sites-enabled/$DOMAIN ]; then
    sudo ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
fi

# Remove default Nginx config
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Reload Nginx to apply changes
sudo systemctl reload nginx

# Register with Let's Encrypt and get certificate
echo "Setting up SSL certificate..."
sudo certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive -v

# Final Nginx restart
sudo systemctl restart nginx

echo "Setup complete! Testing final configuration..."
curl -k https://$DOMAIN

echo "You can now test your SSL configuration at https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"