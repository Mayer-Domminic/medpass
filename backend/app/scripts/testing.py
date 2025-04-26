from ..core.database import get_question_with_details, get_db, get_question, get_content_areas
from ..core.rag import ingest_document, search_documents
import os

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
    
    filepath = class_filePath = os.path.join(
        "app", "scripts", "data", "ragdata", "Abdomen Condensed Chapter Material.pdf"
    )
    
    filepath1 = class_filePath = os.path.join(
        "app", "scripts", "data", "ragdata", "Breast Condensed Chapter Material.docx"
    )
    
    #db = next(get_db())
    #docnumber0 = ingest_document(db, filepath)
    #docnumber1 = ingest_document(db, filepath1)
    #print(text2[1])
    query = "What are the parts of a penis?"
    rag_result = search_documents(query)
    #print(rag_result)
    
    def split_list(lst, batch_size):
        for i in range(0, len(lst), batch_size):
            yield lst[i:i + batch_size]
    
    #print(rag_result)
    print(f"Bron Question: {query}\n")

    for batch in split_list(rag_result, batch_size=2):
        print("\n=== Bron RAG Service ===\n")
        for result in batch:
            print(f"Document ID: {result['documentchunkid']}")
            print(f"Title: {result['title']}")
            print(f"Similarity: {result['similarity']:.3f}")
            print(f"Content Preview:\n{result['content'][:1000]}...\n")