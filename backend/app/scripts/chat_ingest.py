from ..schemas.pydantic_base_models import chat_schemas
from app.models import ChatConversation, ChatMessageContext, ChatContext, ChatMessage
from ..core.database import get_db
from ..services.rag_service import generate_chatcontext_embedding_SCRIPT, generate_chatmessage_embedding_SCRIPT
import datetime
from decimal import Decimal

def ingest_chat_conversations(chat_conversation):
    
    try:
        db = next(get_db())
        for data in chat_conversation:
            convo_data = chat_schemas.ChatConversation(**data)
            db_convo = ChatConversation(
                userid=convo_data.UserID,
                title=convo_data.Title,
                createdat=convo_data.CreatedAt,
                updatedat=convo_data.UpdatedAt,
                isactive=convo_data.IsActive,
                totaltokensinput=convo_data.TotalTokensInput,
                totaltokensoutput=convo_data.TotalTokensOutput,
                totalcost=convo_data.TotalCost
            )
            db.add(db_convo)
        db.commit()
        print("Sample Chat Conversation ingested successfully")
    except Exception as e:
        db.rollback()
        print(f"Error ingesting Chat Conversation Content: {e}")
        raise
    finally:
        db.close()
        
def ingest_chat_contexts(chat_context):
    
    try:
        db = next(get_db())
        for data in chat_context:
            context_data = chat_schemas.ChatContext(**data)

            db_context = ChatContext(
                conversationid=context_data.ConversationID,
                title=context_data.Title,
                content=context_data.Content,
                createdat=context_data.CreatedAt,
                updatedat=context_data.UpdatedAt,
                isactive=context_data.IsActive,
                importancescore=context_data.ImportanceScore,
                createdby=context_data.CreatedBy,
                chatmetadata=context_data.Metadata
            )
            db.add(db_context)
        db.commit()
        print("Sample Chat Context ingested successfully")
    except Exception as e:
        db.rollback()
        print(f"Error ingesting Chat Context: {e}")
        raise
    finally:
        db.close()

def ingest_chat_messages(chat_message_data):
    
    try:
        db = next(get_db())
        for data in chat_message_data:
            message_data = chat_schemas.ChatMessage(**data)

            db_msg = ChatMessage(
                conversationid=message_data.ConversationID,
                sendertype=message_data.SenderType,
                content=message_data.Content,
                timestamp=message_data.Timestamp,
                tokensinput=message_data.TokensInput,
                tokensoutput=message_data.TokensOutput,
                messagecost=message_data.MessageCost,
                messagemetadata=message_data.Metadata
            )
            db.add(db_msg)
        db.commit()
        print("Sample Chat Message ingested successfully using Pydantic schema.")
    except Exception as e:
        db.rollback()
        print(f"Error ingesting ChatMessage: {e}")
        raise
    finally:
        db.close()

def ingest_chat_message_context(message_context):
    
    try:
        db = next(get_db())
        for data in message_context:
            context_data = chat_schemas.ChatMessageContext(**data)
            db_context = ChatMessageContext(
                messageid=context_data.MessageID,
                contextid=context_data.ContextID,
                relevancescore=context_data.RelevanceScore,
                wasused=context_data.WasUsed
            )
            db.add(db_context)
        db.commit()
        print("Sample Chat Message Context ingested successfully")
    except Exception as e:
        db.rollback()
        print(f"Error ingesting Message Context: {e}")
        raise
    finally:
        db.close()
        
if __name__ == "__main__":
    
    # 11 is sample user "mpuser"
    chat_conversation_data = [
        {
            "UserID": 11,
            "Title": "Step 1 Preparation Guidance",
            "CreatedAt": datetime.datetime.now() - datetime.timedelta(days=14),
            "UpdatedAt": datetime.datetime.now() - datetime.timedelta(days=14),
            "IsActive": True,
            "TotalTokensInput": 1250,
            "TotalTokensOutput": 2500,
            "TotalCost": Decimal("0.112500")
        },
        {
            "UserID": 11,
            "Title": "Clinical Rotation Questions",
            "CreatedAt": datetime.datetime.now() - datetime.timedelta(days=7),
            "UpdatedAt": datetime.datetime.now() - datetime.timedelta(days=7),
            "IsActive": True,
            "TotalTokensInput": 800,
            "TotalTokensOutput": 1700,
            "TotalCost": Decimal("0.075000")
        }
    ]

    ingest_chat_conversations(chat_conversation_data)

    # Quick band-aid database call to get conversation IDs (will be handled properly in the API call)
    db = next(get_db())
    conversation_ids = [
        row[0] for row in db.query(ChatConversation.conversationid)
        .order_by(ChatConversation.createdat.desc()).limit(2).all()
    ]
    db.close()

    chat_context_data = [
        {
            "ConversationID": conversation_ids[0],
            "Title": "Medical School Admission Requirements",
            "Content": "Most medical schools require completion of a bachelor's degree, specific prerequisite courses, MCAT scores, letters of recommendation, and interviews.",
            "CreatedAt": datetime.datetime.now() - datetime.timedelta(days=30),
            "UpdatedAt": datetime.datetime.now() - datetime.timedelta(days=15),
            "IsActive": True,
            "ImportanceScore": 0.85,
            "CreatedBy": 11,
            "Metadata": {
                "topic": "admissions",
                "tags": ["medical", "education", "requirements"]
            }
        },
        {
            "ConversationID": conversation_ids[0],
            "Title": "MCAT Study Strategies",
            "Content": "Effective MCAT study strategies include using practice exams, content review, flashcards, and structured study schedules over 3–6 months.",
            "CreatedAt": datetime.datetime.now() - datetime.timedelta(days=25),
            "UpdatedAt": datetime.datetime.now() - datetime.timedelta(days=10),
            "IsActive": True,
            "ImportanceScore": 0.9,
            "CreatedBy": 11,
            "Metadata": {
                "topic": "exam preparation",
                "tags": ["MCAT", "study", "strategy"]
            }
        },
        {
            "ConversationID": conversation_ids[1],
            "Title": "Clinical Rotation Tips",
            "Content": "During clinical rotations, arrive early, be prepared, ask relevant questions, and show initiative with patients when appropriate.",
            "CreatedAt": datetime.datetime.now() - datetime.timedelta(days=15),
            "UpdatedAt": datetime.datetime.now() - datetime.timedelta(days=5),
            "IsActive": True,
            "ImportanceScore": 0.8,
            "CreatedBy": 11,
            "Metadata": {
                "topic": "clinical education",
                "tags": ["rotations", "clinical", "advice"]
            }
        }
    ]

    ingest_chat_contexts(chat_context_data)

    chat_message_data = [
        {
            "ConversationID": conversation_ids[0],
            "SenderType": "user",
            "Content": "What's the best way to prepare for the Step 1?",
            "Timestamp": datetime.datetime.now() - datetime.timedelta(days=14, hours=2),
            "TokensInput": 150,
            "TokensOutput": 0,
            "MessageCost": Decimal("0.001500"),
            "Metadata": {"client": "web"}
        },
        {
            "ConversationID": conversation_ids[0],
            "SenderType": "bot",
            "Content": "The best way to prepare for the Step 1 is to create a comprehensive study plan over 3–6 months. Focus on content review using NBME materials, spaced repetition, and full-length tests.",
            "Timestamp": datetime.datetime.now() - datetime.timedelta(days=14, hours=1, minutes=58),
            "TokensInput": 0,
            "TokensOutput": 400,
            "MessageCost": Decimal("0.012000"),
            "Metadata": {"model": "claude-3-opus", "temperature": 0.7}
        },
        {
            "ConversationID": conversation_ids[1],
            "SenderType": "user",
            "Content": "What should I expect during my first clinical rotation?",
            "Timestamp": datetime.datetime.now() - datetime.timedelta(days=7, hours=3),
            "TokensInput": 120,
            "TokensOutput": 0,
            "MessageCost": Decimal("0.001200"),
            "Metadata": {"client": "mobile"}
        },
        {
            "ConversationID": conversation_ids[1],
            "SenderType": "bot",
            "Content": "Expect a lot of observation early on. You'll follow doctors, assist with minor tasks, and learn through rounds. Preparation and professionalism go a long way.",
            "Timestamp": datetime.datetime.now() - datetime.timedelta(days=7, hours=2, minutes=58),
            "TokensInput": 0,
            "TokensOutput": 600,
            "MessageCost": Decimal("0.018000"),
            "Metadata": {"model": "claude-3-opus", "temperature": 0.5}
        }
    ]

    ingest_chat_messages(chat_message_data)

    # Again a Quick band-aid database call to get message IDs (will be handled properly in the API call)
    db = next(get_db())
    bot_message_ids = [
        row[0] for row in db.query(ChatMessage.messageid)
        .filter(ChatMessage.sendertype == "bot")
        .order_by(ChatMessage.timestamp.desc()).limit(2).all()
    ]
    context_ids = [
        row[0] for row in db.query(ChatContext.contextid).all()
    ]
    db.close()

    chat_message_context_data = [
        {
            "MessageID": bot_message_ids[0],
            "ContextID": context_ids[2],
            "RelevanceScore": 0.92,
            "WasUsed": True
        },
        {
            "MessageID": bot_message_ids[1],
            "ContextID": context_ids[1],
            "RelevanceScore": 0.89,
            "WasUsed": True
        }
    ]
    
    ingest_chat_message_context(chat_message_context_data)
    
    try:
        db = next(get_db())
        for i in range(1, 4):
            generate_chatcontext_embedding_SCRIPT(i, db)
        for y in range(1, 5):
            generate_chatmessage_embedding_SCRIPT(y, db)
    finally:
        db.close()

    print("Sample Chat Data ingested successfully")
