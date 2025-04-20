from sentence_transformers import SentenceTransformer
from ..core.database import get_question_with_details, get_db

model = SentenceTransformer('all-mpnet-base-v2')

def convert_question_to_text(question_response: dict) -> str:
    
    question = question_response['Question']
    option = question_response['Options']
    content_areas = question_response['ContentAreas']
    
    prompt = question['Prompt']
    
    # This is for a way to format our options for context in a A, B, C, D format (chr 65 is a + 1 is each letter after)
    option_lines = [
        f"{chr(65 + i)}. {opt['OptionDescription']}" for i, opt in enumerate(option)
    ]
    
    difficulty = question.get('QuestionDifficulty', 'Unknown')
    content_names = [ca["ContentName"] for ca in content_areas]
    # If multiple content areas combine them into a single string
    content_area_line = ', '.join(content_names) if content_names else "Uncatergorized"
    
    context_lines = [
        f"Difficulty: {difficulty}",
        f"Content Areas: {content_area_line}",
        ""
    ]
    
    text = "\n".join(context_lines + [prompt] + option_lines)
    
    return text
    
if __name__ == "__main__":
    
    db = next(get_db())
    response = get_question_with_details(10, db)
    text = convert_question_to_text(response)
    print(text)
    
    embedding = model.encode(text).tolist()
    
    print(embedding)