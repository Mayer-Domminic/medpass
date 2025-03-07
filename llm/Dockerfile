FROM ollama/ollama:latest

# Create directory structure
WORKDIR /llm
COPY . /llm

# Make setup script executable
RUN chmod +x /llm/setup_model.sh

# Start Ollama first, then run setup script
CMD ollama serve