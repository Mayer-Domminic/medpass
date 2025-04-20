from sentence_transformers import SentenceTransformer
from ..core.database import get_question_with_details, get_db

model = SentenceTransformer('all-mpnet-base-v2')

def convert_question_to_text(question_response: dict) -> str:
    
    question = question_response['question']
    option = question_response['option']
    
if __name__ == "__main__":
    
    db = next(get_db())
    response = get_question_with_details(10, db)
    print(response)