import os
import random
import argparse
import json
import re
from google import genai
from google.genai import types
from core.config import settings


def read_file(file_path):
    """Read and encode file for upload."""
    with open(file_path, "rb") as file:
        file_data = file.read()
    
    # Get MIME type based on file extension
    file_extension = os.path.splitext(file_path)[1].lower()
    mime_types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.csv': 'text/csv',
        '.json': 'application/json',
        '.mp3': 'audio/mpeg',
        '.mp4': 'video/mp4',
    }
    mime_type = mime_types.get(file_extension, 'application/octet-stream')
    
    return {"mime_type": mime_type, "data": file_data}


def generate(system_prompt_path=None, user_message=None, file_paths=None, output_json_path=None):
    """Generate content using Gemini API.
    
    Args:
        system_prompt_path: Path to the system prompt text file (will be read as text)
        user_message: User message text
        file_paths: List of paths to files that will be sent directly to the API
        output_json_path: Path to save the output as JSON
    """
    # Select a random API key
    api_keys = [
        settings.JAKE_GEMINI_API_KEY,
        settings.RINO_GEMINI_API_KEY,
        settings.NOLAN_GEMINI_API_KEY,
        settings.DOM_GEMINI_API_KEY
    ]
    
    selected_api_key = random.choice(api_keys)
    
    # Initialize client
    client = genai.Client(
        api_key=selected_api_key,
    )

    model = "gemini-2.0-flash-lite"
    
    # Prepare contents
    contents = []
    
    # Read system prompt from TXT file if path is provided
    system_prompt_text = ""
    if system_prompt_path:
        try:
            with open(system_prompt_path, "r") as file:
                system_prompt_text = file.read()
        except Exception as e:
            print(f"Error reading system prompt file: {e}")
    
    # Prepare user message parts
    user_parts = []
    
    # Add system prompt and user message if provided
    combined_message = ""
    if system_prompt_text:
        combined_message += f"System instructions: {system_prompt_text}\n\n"
    if user_message:
        combined_message += user_message
    
    if combined_message:
        user_parts.append({"text": combined_message})
    
    # Add file uploads if provided
    if file_paths:
        for file_path in file_paths:
            file_info = read_file(file_path)
            user_parts.append({
                "inline_data": {
                    "mime_type": file_info["mime_type"],
                    "data": file_info["data"]
                }
            })
    
    # Add user content if there are any parts
    if user_parts:
        contents.append(
            types.Content(
                role="user",
                parts=user_parts
            )
        )
    
    # Configuration
    generate_content_config = types.GenerateContentConfig(
        temperature=1,
        top_p=0.95,
        top_k=40,
        max_output_tokens=8192,
        response_mime_type="text/plain",
    )

    # Counters for token usage
    total_input_tokens = 0
    total_output_tokens = 0
    
    # Collect response text
    response_text = ""
    
    # Stream the response
    response = client.models.generate_content(
        model=model,
        contents=contents,
        config=generate_content_config,
    )
    
    response_text = response.text
    print(response_text)

    # Output token usage
    if hasattr(response, 'usage_metadata'):
        if hasattr(response.usage_metadata, 'prompt_token_count'):
            total_input_tokens = response.usage_metadata.prompt_token_count
        if hasattr(response.usage_metadata, 'candidates_token_count'):
            total_output_tokens = response.usage_metadata.candidates_token_count
    
    response_text = extract_questions(response_text)
    
    print("\n\n--- Token Usage ---")
    print(f"Input tokens: {total_input_tokens}")
    print(f"Output tokens: {total_output_tokens}")
    print(f"Total tokens: {total_input_tokens + total_output_tokens}")
    print("------------------")
    
    # Save response to JSON file if output path is provided
    if output_json_path:
        try:
            # Clean up the response text - remove markdown formatting if present
            # This handles cases where the response includes ```json {data} ```
            cleaned_text = response_text
            with open(output_json_path, 'w') as f:
                json.dump(cleaned_text, f, indent=2)
        
            # Add token usage
            token_usage = {
                "input_tokens": total_input_tokens,
                "output_tokens": total_output_tokens,
                "total_tokens": total_input_tokens + total_output_tokens
            }
            
            # Write to file
            with open(output_json_path, 'a') as f:
                json.dump(token_usage, f, indent=2)
            
            print(f"Response saved to {output_json_path}")
        except Exception as e:
            print(f"Error saving response to JSON: {e}")

def extract_questions(json_text):
    """
    Extract questions from JSON data in text format.
    
    Args:
        json_text (str): Text containing JSON data
        
    Returns:
        list: List of question objects
    """
    # Clean the text if it contains markdown code block delimiters
    if "```json" in json_text:
        lines = json_text.strip().split("\n")
        # Remove the first and last lines (markdown delimiters)
        json_text = "\n".join(lines[1:-1])
    
    # Parse JSON string to Python objects
    data = json.loads(json_text)
    
    return data

      
if __name__ == "__main__":
    # Paths for system prompt and case study files
    system_prompt_path = "pdfs/system_prompt.txt"
    case_study_pdf_path = "pdfs/promptA.pdf"
    output_json_path = "output_response.json"
    
    # Read the initial prompt from the file
    initial_prompt_path = "pdfs/initial_prompt.txt"
    try:
        with open(initial_prompt_path, "r") as file:
            initial_prompt = file.read()
    except Exception as e:
        print(f"Error reading initial prompt file: {e}")
        initial_prompt = "Please extract the information from the attached medical case study."
    
    # Generate content
    print("Starting Gemini API call with token tracking...")
    generate(system_prompt_path, initial_prompt, [case_study_pdf_path], output_json_path)