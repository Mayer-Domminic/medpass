from ..core.database import get_question_with_details, get_db, get_question, get_content_areas, get_latest_student_review_performance_data, get_student_statistics
from ..services.rag_service import ingest_document, search_documents, search_chat_contexts, ingest_document_from_s3
from ..services.gemini_service import get_chat_history, get_entire_chat, chat_model
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
    #query = "What are the parts of a penis?"
    #rag_result = search_documents(query)
    #print(rag_result)
    
    
    def split_list(lst, batch_size):
        for i in range(0, len(lst), batch_size):
            yield lst[i:i + batch_size]
    
    #print(rag_result)
    '''
    print(f"Bron Question: {query}\n")

    for batch in split_list(rag_result, batch_size=2):
        print("\n=== Bron RAG Service ===\n")
        for result in batch:
            print(f"Document ID: {result['documentchunkid']}")
            print(f"Title: {result['title']}")
            print(f"Similarity: {result['similarity']:.3f}")
            print(f"Content Preview:\n{result['content'][:1000]}...\n")
    '''
    db = next(get_db())
    #conversation = get_chat_history(db, 11)
    
    #chat1 = get_entire_chat(db, 1)
    
    #print(chat1)
    
    '''
    chat_result = search_chat_contexts(db, 11, "What are some study strategies?")
    
    for batch in split_list(chat_result, batch_size=2):
        print("\n=== Bron CHAT RAG Service ===\n")
        for result in batch:
            print(f"Document ID: {result['contextid']}")
            print(f"Title: {result['title']}")
            print(f"Similarity: {result['similarity']:.3f}")
            print(f"Content Preview:\n{result['content'][:1000]}...\n")
    '''
    
    '''
    messages = [{"role": "user", "content": "What is a clinical rotation?"}]
    
    rag_query = "What is a clinical rotation?"
    
    model_message = chat_model(messages=messages, rag_query=rag_query, conversation_id=1)
    
    print(model_message)
    '''
    

    #performance_data = get_latest_student_review_performance_data(db, 5, 298)
    
    #print(performance_data)

    #statistics = get_student_statistics(db, 298)
    #print(statistics)
    
    id = ingest_document_from_s3(db, "medpassunr", "notes/mpuser/Test.pdf", 11)
    print(id)