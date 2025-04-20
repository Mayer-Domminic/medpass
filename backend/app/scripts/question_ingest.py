from ..schemas.pydantic_base_models import exam_schemas
from app.models import ContentArea, Option, Question, QuestionClassification, QuestionOption
from ..core.database import get_db

def ingest_content_area(content_area_data):
    
    try: 
        db = next(get_db())
        for data in content_area_data:
            content_area_data = exam_schemas.ContentArea(**data)
            db_content_area = ContentArea(
                contentareaid = content_area_data.ContentAreaID,
                contentname = content_area_data.ContentName,
                description = content_area_data.Description,
                discipline = content_area_data.Discipline
            )
            db.add(db_content_area)
        db.commit()
        print("Content area data ingested successfully.")
    except Exception as e:
        print(f"Error ingesting content area data: {e}")
        db.rollback()
        raise
    finally:
        db.close()
        
def ingest_options(options_data):
    
    try:
        db = next(get_db())
        for data in options_data:
            option_data = exam_schemas.Option(**data)
            db_option = Option(
                optionid = option_data.OptionID,
                optiondescription = option_data.OptionDescription
            )
            db.add(db_option)
        db.commit()
        print("Options data ingested successfully.")
    except Exception as e:
        print(f"Error ingesting options data: {e}")
        db.rollback()
        raise
    finally:
        db.close()
        
def ingest_questions(questions_data):
    
    try:
        db = next(get_db())
        for data in questions_data:
            question_data = exam_schemas.Question(**data)
            db_question = Question(
                questionid = question_data.QuestionID,
                examid = question_data.ExamID,
                prompt = question_data.Prompt,
                questionDifficulty = question_data.QuestionDifficulty,
                imageUrl = question_data.ImageUrl,
                imageDependent = question_data.ImageDependent,
                imageDescription = question_data.ImageDescription
            )
            db.add(db_question)
        db.commit()
        print("Questions data ingested successfully.")
    except Exception as e:
        print(f"Error ingesting questions data: {e}")
        db.rollback()
        raise
    finally:
        db.close()
        
def ingest_question_classification(question_classification_data):
    
    try:
        db = next(get_db())
        for data in question_classification_data:
            question_classification_data = exam_schemas.QuestionClassification(**data)
            db_question_classification = QuestionClassification(
                questionclassid = question_classification_data.QuestionClassID,
                questionid = question_classification_data.QuestionID,
                contentareaid = question_classification_data.ContentAreaID
            )
            db.add(db_question_classification)
        db.commit()
        print("Question classification data ingested successfully.")
    except Exception as e:
        print(f"Error ingesting question classification data: {e}")
        db.rollback()
        raise
    finally:
        db.close()
        
def ingest_question_options(question_option_data):
    
    try:
        db = next(get_db())
        for data in question_option_data:
            question_option_data = exam_schemas.QuestionOptions(**data)
            db_question_option = QuestionOption(
                questionoptionid = question_option_data.QuestionOptionID,
                questionid = question_option_data.QuestionID,
                optionid = question_option_data.OptionID,
                correctanswer = question_option_data.CorrectAnswer,
                explanation = question_option_data.Explanation
            )
            db.add(db_question_option)
        db.commit()
        print("Question options data ingested successfully.")
    except Exception as e:
        print(f"Error ingesting question options data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    
    # Hard coded sample data for question testing (Will not be used in actual program)
    
    content_area_data = [
        {
            "ContentAreaID": 1,
            "ContentName": "Cardiovascular System",
            "Description": "Covers the heart, blood vessels, and circulatory system",
            "Discipline": "Physiology"
        },
        {
            "ContentAreaID": 2,
            "ContentName": "Cellular Biology",
            "Description": "Covers cell structure, function, and processes",
            "Discipline": "Biology"
        },
        {
            "ContentAreaID": 3,
            "ContentName": "Pharmacology",
            "Description": "Covers drug mechanisms, interactions, and clinical applications",
            "Discipline": "Pharmacy"
        },
        {
            "ContentAreaID": 4,
            "ContentName": "Medical Ethics",
            "Description": "Covers ethical principles in healthcare practice",
            "Discipline": "Ethics"
        }
    ]
    
    option_data = [
        {"OptionID": 1, "OptionDescription": "Increased heart rate"},
        {"OptionID": 2, "OptionDescription": "Decreased blood pressure"},
        {"OptionID": 3, "OptionDescription": "Vasoconstriction"},
        {"OptionID": 4, "OptionDescription": "Vasodilation"},
        {"OptionID": 5, "OptionDescription": "Cell membrane"},
        {"OptionID": 6, "OptionDescription": "Nucleus"},
        {"OptionID": 7, "OptionDescription": "Mitochondria"},
        {"OptionID": 8, "OptionDescription": "Endoplasmic reticulum"},
        {"OptionID": 9, "OptionDescription": "Beta-blockers"},
        {"OptionID": 10, "OptionDescription": "ACE inhibitors"},
        {"OptionID": 11, "OptionDescription": "Calcium channel blockers"},
        {"OptionID": 12, "OptionDescription": "Diuretics"},
        {"OptionID": 13, "OptionDescription": "Autonomy"},
        {"OptionID": 14, "OptionDescription": "Beneficence"},
        {"OptionID": 15, "OptionDescription": "Non-maleficence"},
        {"OptionID": 16, "OptionDescription": "Justice"}
    ]
    
    # 5 is the test Exam ID
    question_data = [
        {
            "QuestionID": 10,
            "ExamID": 5,
            "Prompt": "Which physiological response is associated with sympathetic nervous system activation?",
            "QuestionDifficulty": "Medium",
            "ImageUrl": None,
            "ImageDependent": False,
            "ImageDescription": None
        },
        {
            "QuestionID": 11,
            "ExamID": 5,
            "Prompt": "Which cellular organelle is primarily responsible for energy production in the cell?",
            "QuestionDifficulty": "Easy",
            "ImageUrl": None,
            "ImageDependent": False,
            "ImageDescription": None
        },
        {
            "QuestionID": 12,
            "ExamID": 5,
            "Prompt": "Which medication class is most appropriate for a patient with heart failure with reduced ejection fraction?",
            "QuestionDifficulty": "Hard",
            "ImageUrl": None,
            "ImageDependent": False,
            "ImageDescription": None
        },
        {
            "QuestionID": 13,
            "ExamID": 5,
            "Prompt": "A patient refuses a life-saving blood transfusion due to religious beliefs. Which ethical principle is most relevant in this scenario?",
            "QuestionDifficulty": "Medium",
            "ImageUrl": None,
            "ImageDependent": False,
            "ImageDescription": None
        }
    ]
    
    question_classification_data = [
        {"QuestionClassID": 1, "QuestionID": 10, "ContentAreaID": 1},
        {"QuestionClassID": 2, "QuestionID": 11, "ContentAreaID": 2},
        {"QuestionClassID": 3, "QuestionID": 12, "ContentAreaID": 3},
        {"QuestionClassID": 4, "QuestionID": 13, "ContentAreaID": 4}
    ]
    
    question_option_data = [
        {"QuestionOptionID": 1, "QuestionID": 10, "OptionID": 1, "CorrectAnswer": True, 
         "Explanation": "Sympathetic activation causes increased heart rate through beta-1 adrenergic receptor stimulation."},
        {"QuestionOptionID": 2, "QuestionID": 10, "OptionID": 2, "CorrectAnswer": False, 
         "Explanation": "Sympathetic activation typically increases blood pressure."},
        {"QuestionOptionID": 3, "QuestionID": 10, "OptionID": 3, "CorrectAnswer": True, 
         "Explanation": "Sympathetic activation causes vasoconstriction in most vascular beds."},
        {"QuestionOptionID": 4, "QuestionID": 10, "OptionID": 4, "CorrectAnswer": False, 
         "Explanation": "Parasympathetic activation typically causes vasodilation."},
        
        {"QuestionOptionID": 5, "QuestionID": 11, "OptionID": 5, "CorrectAnswer": False, 
         "Explanation": "The cell membrane is primarily for cell boundary and transport."},
        {"QuestionOptionID": 6, "QuestionID": 11, "OptionID": 6, "CorrectAnswer": False, 
         "Explanation": "The nucleus contains genetic material but is not primarily for energy production."},
        {"QuestionOptionID": 7, "QuestionID": 11, "OptionID": 7, "CorrectAnswer": True, 
         "Explanation": "Mitochondria are the powerhouse of the cell, producing ATP through cellular respiration."},
        {"QuestionOptionID": 8, "QuestionID": 11, "OptionID": 8, "CorrectAnswer": False, 
         "Explanation": "The endoplasmic reticulum is involved in protein synthesis and lipid metabolism."},
        
        {"QuestionOptionID": 9, "QuestionID": 12, "OptionID": 9, "CorrectAnswer": True, 
         "Explanation": "Beta-blockers reduce mortality in heart failure with reduced ejection fraction."},
        {"QuestionOptionID": 10, "QuestionID": 12, "OptionID": 10, "CorrectAnswer": True, 
         "Explanation": "ACE inhibitors reduce afterload and improve survival in heart failure."},
        {"QuestionOptionID": 11, "QuestionID": 12, "OptionID": 11, "CorrectAnswer": False, 
         "Explanation": "Calcium channel blockers may worsen heart failure with reduced ejection fraction."},
        {"QuestionOptionID": 12, "QuestionID": 12, "OptionID": 12, "CorrectAnswer": True, 
         "Explanation": "Diuretics help manage fluid overload in heart failure."},
        
        {"QuestionOptionID": 13, "QuestionID": 13, "OptionID": 13, "CorrectAnswer": True, 
         "Explanation": "Autonomy refers to the patient's right to make their own medical decisions."},
        {"QuestionOptionID": 14, "QuestionID": 13, "OptionID": 14, "CorrectAnswer": False, 
         "Explanation": "Beneficence refers to acting in the best interest of the patient."},
        {"QuestionOptionID": 15, "QuestionID": 13, "OptionID": 15, "CorrectAnswer": False, 
         "Explanation": "Non-maleficence refers to not causing harm to the patient."},
        {"QuestionOptionID": 16, "QuestionID": 13, "OptionID": 16, "CorrectAnswer": False, 
         "Explanation": "Justice refers to fair distribution of benefits and burdens."}
    ]
    
    try:
        ingest_content_area(content_area_data)
        ingest_options(option_data)   
        ingest_questions(question_data)     
        ingest_question_classification(question_classification_data)      
        ingest_question_options(question_option_data)
        
        print("Question Related Sample Data Ingestion Successful")
    except Exception as e:
        print(f"An error occurred during ingestion: {e}")
        raise