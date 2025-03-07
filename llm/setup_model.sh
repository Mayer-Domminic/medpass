#!/bin/bash

# Pull the model we need first
ollama pull llama3:8b

# Create our custom model (if needed)
ollama create medpass-llm -f /llm/models/medpass-llm.json

echo "Model setup complete!"