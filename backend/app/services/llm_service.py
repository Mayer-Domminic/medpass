import httpx
import yaml
import os
from typing import List, Dict, Any, Optional
import json

class LLMService:
    def __init__(self):
        # Get the project root directory
        print(f"Current directory: {os.getcwd()}")
        print(f"Script location: {os.path.dirname(os.path.abspath(__file__))}")
        project_root = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), ".."))
        
        # Load config from the llm directory
        config_path = os.path.join(project_root, "llm", "config.yaml")
        
        try:
            with open(config_path, "r") as f:
                self.config = yaml.safe_load(f)
        except FileNotFoundError:
            print(f"Config file not found at: {config_path}")
            # Fallback to default configuration
            self.config = {
                "provider": "ollama",
                "ollama": {
                    "base_url": "http://localhost:11434",
                    "model": "llama3:8b",
                    "context_window": 16384,
                    "temperature": 0.7
                }
            }
        
        self.provider = self.config.get("provider", "ollama")
        
        # Load system prompt
        system_prompt_path = os.path.join(project_root, "llm", 
                                        self.config.get("system_prompt_template", "templates/default.txt"))
        
        try:
            with open(system_prompt_path, "r") as f:
                self.system_prompt = f.read().strip()
        except FileNotFoundError:
            print(f"System prompt file not found at: {system_prompt_path}")
            # Fallback to default system prompt
            self.system_prompt = "You are an AI assistant for MedPass. Answer questions accurately and concisely."
    
    async def generate_response(self, prompt: str, context: Optional[List[Dict[str, str]]] = None) -> str:
        """Generate a response from the LLM"""
        if context is None:
            context = []
            
        if self.provider == "ollama":
            return await self._generate_ollama(prompt, context)
        elif self.provider == "gemini":
            return await self._generate_gemini(prompt, context)
        else:
            return f"Error: Unknown provider '{self.provider}'"
    
    async def _generate_ollama(self, prompt: str, context: List[Dict[str, str]]) -> str:
        """Generate response using Ollama"""
        ollama_config = self.config.get("ollama", {})
        base_url = ollama_config.get("base_url", "http://localhost:11434")
        model = ollama_config.get("model", "llama3:8b")
        context_window = ollama_config.get("context_window", 16384)
        temperature = ollama_config.get("temperature", 0.7)
        
        # Prepare messages
        messages = [{"role": "system", "content": self.system_prompt}]
        
        # Add conversation context
        for msg in context:
            messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })
        
        # Add current prompt
        messages.append({"role": "user", "content": prompt})
        
        # Call Ollama API
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{base_url}/api/chat",
                    json={
                        "model": model,
                        "messages": messages,
                        "stream": False,
                        "options": {
                            "num_ctx": context_window,
                            "temperature": temperature
                        }
                    },
                    timeout=120.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result["message"]["content"]
                else:
                    return f"Error: {response.status_code}, {response.text}"
        except Exception as e:
            return f"Error: {str(e)}"
    
    async def _generate_gemini(self, prompt: str, context: List[Dict[str, str]]) -> str:
        """Generate response using Gemini API"""
        gemini_config = self.config.get("gemini", {})
        api_key = gemini_config.get("api_key", "")
        model = gemini_config.get("model", "gemini-1.5-pro")
        temperature = gemini_config.get("temperature", 0.7)
        max_tokens = gemini_config.get("max_tokens", 8192)
        
        if not api_key:
            return "Error: Gemini API key not configured"
        
        # Format messages for Gemini API
        messages = [{"role": "system", "parts": [{"text": self.system_prompt}]}]
        
        # Add conversation context
        for msg in context:
            role = "user" if msg.get("role") == "user" else "model"
            messages.append({
                "role": role, 
                "parts": [{"text": msg.get("content", "")}]
            })
        
        # Add current prompt
        messages.append({"role": "user", "parts": [{"text": prompt}]})
        
        # Call Gemini API
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"https://generativelanguage.googleapis.com/v1/models/{model}:generateContent",
                    params={"key": api_key},
                    json={
                        "contents": messages,
                        "generationConfig": {
                            "temperature": temperature,
                            "maxOutputTokens": max_tokens,
                            "topP": gemini_config.get("top_p", 0.9)
                        }
                    },
                    timeout=120.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result["candidates"][0]["content"]["parts"][0]["text"]
                else:
                    return f"Error: {response.status_code}, {response.text}"
        except Exception as e:
            return f"Error: {str(e)}"