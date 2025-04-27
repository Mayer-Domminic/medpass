from ..schemas.pydantic_base_models import exam_schemas
from app.models import ContentArea, Option, Question, QuestionClassification, QuestionOption
from ..core.database import get_db
from sqlalchemy import func
from ..services.rag_service import generate_question_embedding

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
            
            # Check if the question already exists
            existing = db.query(Question).filter(
                Question.questionid == question_data.QuestionID
            ).first()
            
            if not existing:
                db_question = Question(
                    questionid = question_data.QuestionID,
                    examid = question_data.ExamID,
                    prompt = question_data.Prompt,
                    questionDifficulty = question_data.QuestionDifficulty,
                    imageUrl = question_data.ImageUrl,
                    imageDependent = question_data.ImageDependent,
                    imageDescription = question_data.ImageDescription,
                    gradeclassificationid = question_data.GradeClassificationID if hasattr(question_data, 'GradeClassificationID') else None
                )
                db.add(db_question)
            else:
                # Update the existing question
                existing.examid = question_data.ExamID
                existing.prompt = question_data.Prompt
                existing.questionDifficulty = question_data.QuestionDifficulty
                existing.imageUrl = question_data.ImageUrl
                existing.imageDependent = question_data.ImageDependent
                existing.imageDescription = question_data.ImageDescription
                existing.gradeclassificationid = question_data.GradeClassificationID if hasattr(question_data, 'GradeClassificationID') else None
                
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

def ingest_grade_classifications(grade_classification_data):
    try:
        db = next(get_db())
        for data in grade_classification_data:
            # Check if the grade classification already exists
            existing = db.query(GradeClassification).filter(
                GradeClassification.gradeclassificationid == data["GradeClassificationID"]
            ).first()
            
            if not existing:
                db_grade_classification = GradeClassification(
                    gradeclassificationid = data["GradeClassificationID"],
                    classofferingid = data["ClassOfferingID"],
                    classificationname = data["ClassificationName"],
                    unittype = data["UnitType"]
                )
                db.add(db_grade_classification)
            else:
                # Update the existing grade classification
                existing.classofferingid = data["ClassOfferingID"]
                existing.classificationname = data["ClassificationName"]
                existing.unittype = data["UnitType"]
                
        db.commit()
        print("Grade classification data ingested successfully.")
    except Exception as e:
        print(f"Error ingesting grade classification data: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def link_questions_to_classifications(links_data):
    try:
        db = next(get_db())
        for link in links_data:
            question = db.query(Question).filter(Question.questionid == link["QuestionID"]).first()
            if question:
                question.gradeclassificationid = link["GradeClassificationID"]
            else:
                print(f"Warning: Question {link['QuestionID']} not found")
        db.commit()
        print("Questions linked to grade classifications successfully.")
    except Exception as e:
        print(f"Error linking questions to grade classifications: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def get_or_create_grade_classification(db, classification_name, class_offering_id, unit_type="Assessment"):
    """Find a grade classification by name or create it if it doesn't exist"""
    
    # Try to find the classification first
    existing = db.query(GradeClassification).filter(
        GradeClassification.classificationname == classification_name,
        GradeClassification.classofferingid == class_offering_id
    ).first()
    
    if existing:
        return existing.gradeclassificationid
    
    # Get the next available ID
    max_id = db.query(func.max(GradeClassification.gradeclassificationid)).scalar()
    next_id = 1 if max_id is None else max_id + 1
    
    # Create a new classification
    new_classification = GradeClassification(
        gradeclassificationid = next_id,
        classofferingid = class_offering_id,
        classificationname = classification_name,
        unittype = unit_type
    )
    
    db.add(new_classification)
    db.flush()
    
    return new_classification.gradeclassificationid


if __name__ == "__main__":
    
    # Hard coded sample data for question testing (Will not be used in actual program)
    
    grade_classification_data = [
        {"GradeClassificationID": 1, "ClassOfferingID": 1, "ClassificationName": "ANAT", "UnitType": "Assessment"},
        {"GradeClassificationID": 2, "ClassOfferingID": 1, "ClassificationName": "Anemia", "UnitType": "Assessment"},
        {"GradeClassificationID": 3, "ClassOfferingID": 1, "ClassificationName": "BIOCHEM", "UnitType": "Assessment"},
        {"GradeClassificationID": 4, "ClassOfferingID": 1, "ClassificationName": "BODY and HLTH SYS", "UnitType": "Assessment"},
        {"GradeClassificationID": 5, "ClassOfferingID": 1, "ClassificationName": "CASE", "UnitType": "Assessment"},
        {"GradeClassificationID": 6, "ClassOfferingID": 1, "ClassificationName": "CELL BIO", "UnitType": "Assessment"},
        {"GradeClassificationID": 7, "ClassOfferingID": 1, "ClassificationName": "CELLS and TISS", "UnitType": "Assessment"},
        {"GradeClassificationID": 8, "ClassOfferingID": 1, "ClassificationName": "DEV", "UnitType": "Assessment"},
        {"GradeClassificationID": 9, "ClassOfferingID": 1, "ClassificationName": "Diagnosis", "UnitType": "Assessment"},
        {"GradeClassificationID": 10, "ClassOfferingID": 1, "ClassificationName": "Diversity", "UnitType": "Assessment"},
        {"GradeClassificationID": 11, "ClassOfferingID": 1, "ClassificationName": "ETHICS", "UnitType": "Assessment"},
        {"GradeClassificationID": 12, "ClassOfferingID": 1, "ClassificationName": "GEN", "UnitType": "Assessment"},
        {"GradeClassificationID": 13, "ClassOfferingID": 1, "ClassificationName": "HB", "UnitType": "Assessment"},
        {"GradeClassificationID": 14, "ClassOfferingID": 1, "ClassificationName": "HEME", "UnitType": "Assessment"},
        {"GradeClassificationID": 15, "ClassOfferingID": 1, "ClassificationName": "HISTO", "UnitType": "Assessment"},
        {"GradeClassificationID": 16, "ClassOfferingID": 1, "ClassificationName": "MOL BIOL", "UnitType": "Assessment"},
        {"GradeClassificationID": 17, "ClassOfferingID": 1, "ClassificationName": "MOLEC and COMP", "UnitType": "Assessment"},
        {"GradeClassificationID": 18, "ClassOfferingID": 1, "ClassificationName": "Nerve", "UnitType": "Assessment"},
        {"GradeClassificationID": 19, "ClassOfferingID": 1, "ClassificationName": "NUTR", "UnitType": "Assessment"},
        {"GradeClassificationID": 20, "ClassOfferingID": 1, "ClassificationName": "PATH", "UnitType": "Assessment"},
        {"GradeClassificationID": 21, "ClassOfferingID": 1, "ClassificationName": "PHARM", "UnitType": "Assessment"},
        {"GradeClassificationID": 22, "ClassOfferingID": 1, "ClassificationName": "Toolkit", "UnitType": "Assessment"},
        {"GradeClassificationID": 23, "ClassOfferingID": 2, "ClassificationName": "ANAT", "UnitType": "Assessment"},
        {"GradeClassificationID": 24, "ClassOfferingID": 2, "ClassificationName": "BIOCHEM", "UnitType": "Assessment"},
        {"GradeClassificationID": 25, "ClassOfferingID": 2, "ClassificationName": "Biostats", "UnitType": "Assessment"},
        {"GradeClassificationID": 26, "ClassOfferingID": 2, "ClassificationName": "CARDIO", "UnitType": "Assessment"},
        {"GradeClassificationID": 27, "ClassOfferingID": 2, "ClassificationName": "CASE", "UnitType": "Assessment"},
        {"GradeClassificationID": 28, "ClassOfferingID": 2, "ClassificationName": "ETHICS", "UnitType": "Assessment"},
        {"GradeClassificationID": 29, "ClassOfferingID": 2, "ClassificationName": "HISTO", "UnitType": "Assessment"},
        {"GradeClassificationID": 30, "ClassOfferingID": 2, "ClassificationName": "NUTR", "UnitType": "Assessment"},
        {"GradeClassificationID": 31, "ClassOfferingID": 2, "ClassificationName": "PHARM", "UnitType": "Assessment"},
        {"GradeClassificationID": 32, "ClassOfferingID": 2, "ClassificationName": "PHYSIO", "UnitType": "Assessment"},
        {"GradeClassificationID": 33, "ClassOfferingID": 2, "ClassificationName": "RADIOLOGY", "UnitType": "Assessment"},
        {"GradeClassificationID": 34, "ClassOfferingID": 2, "ClassificationName": "Renal", "UnitType": "Assessment"},
        {"GradeClassificationID": 35, "ClassOfferingID": 3, "ClassificationName": "IMMUNO", "UnitType": "Assessment"},
        {"GradeClassificationID": 36, "ClassOfferingID": 3, "ClassificationName": "MICRO", "UnitType": "Assessment"},
        {"GradeClassificationID": 37, "ClassOfferingID": 3, "ClassificationName": "Virology", "UnitType": "Assessment"},
        {"GradeClassificationID": 38, "ClassOfferingID": 4, "ClassificationName": "HEME", "UnitType": "Assessment"},
        {"GradeClassificationID": 39, "ClassOfferingID": 4, "ClassificationName": "NUTR", "UnitType": "Assessment"},
        {"GradeClassificationID": 40, "ClassOfferingID": 4, "ClassificationName": "PATH", "UnitType": "Assessment"},
    ]
    
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
    
    # 5 is the test Exam ID - now with GradeClassificationID mapping to the real data above
    question_data = [
        {
            "QuestionID": 10,
            "ExamID": 5,
            "Prompt": "Which physiological response is associated with sympathetic nervous system activation?",
            "QuestionDifficulty": "Medium",
            "ImageUrl": None,
            "ImageDependent": False,
            "ImageDescription": None,
            "GradeClassificationID": 26  
        },
        {
            "QuestionID": 11,
            "ExamID": 5,
            "Prompt": "Which cellular organelle is primarily responsible for energy production in the cell?",
            "QuestionDifficulty": "Easy",
            "ImageUrl": None,
            "ImageDependent": False,
            "ImageDescription": None,
            "GradeClassificationID": 6  
        },
        {
            "QuestionID": 12,
            "ExamID": 5,
            "Prompt": "Which medication class is most appropriate for a patient with heart failure with reduced ejection fraction?",
            "QuestionDifficulty": "Hard",
            "ImageUrl": None,
            "ImageDependent": False,
            "ImageDescription": None,
            "GradeClassificationID": 21  
        },
        {
            "QuestionID": 13,
            "ExamID": 5,
            "Prompt": "A patient refuses a life-saving blood transfusion due to religious beliefs. Which ethical principle is most relevant in this scenario?",
            "QuestionDifficulty": "Medium",
            "ImageUrl": None,
            "ImageDependent": False,
            "ImageDescription": None,
            "GradeClassificationID": 11 
        }
    ]
    
    # Maintaining backward compatibility with content areas during transition
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
    

    additional_questions = [
        {
            "QuestionID": 14,
            "ExamID": 5,
            "Prompt": "Which immunological component is most important in type I hypersensitivity reactions?",
            "QuestionDifficulty": "Medium",
            "ImageUrl": None,
            "ImageDependent": False,
            "ImageDescription": None,
            "GradeClassificationID": 35  
        },
        {
            "QuestionID": 15,
            "ExamID": 5,
            "Prompt": "Which renal structure is responsible for selective filtration of the blood?",
            "QuestionDifficulty": "Medium",
            "ImageUrl": None,
            "ImageDependent": False,
            "ImageDescription": None,
            "GradeClassificationID": 34 
        },
        {
            "QuestionID": 16,
            "ExamID": 5,
            "Prompt": "Which microorganism is most commonly associated with community-acquired pneumonia?",
            "QuestionDifficulty": "Medium",
            "ImageUrl": None,
            "ImageDependent": False,
            "ImageDescription": None,
            "GradeClassificationID": 36  
        },
        {
            "QuestionID": 17,
            "ExamID": 5,
            "Prompt": "Which nutritional deficiency is most commonly associated with megaloblastic anemia?",
            "QuestionDifficulty": "Medium",
            "ImageUrl": None,
            "ImageDependent": False,
            "ImageDescription": None,
            "GradeClassificationID": 30 
        },
    ]
    
    # Combine original and additional questions
    question_data.extend(additional_questions)
    
    # Additional options for new questions
    additional_options = [
        {"OptionID": 17, "OptionDescription": "IgE antibodies"},
        {"OptionID": 18, "OptionDescription": "T helper cells"},
        {"OptionID": 19, "OptionDescription": "Complement system"},
        {"OptionID": 20, "OptionDescription": "Neutrophils"},
        {"OptionID": 21, "OptionDescription": "Glomerulus"},
        {"OptionID": 22, "OptionDescription": "Loop of Henle"},
        {"OptionID": 23, "OptionDescription": "Collecting duct"},
        {"OptionID": 24, "OptionDescription": "Proximal convoluted tubule"},
        {"OptionID": 25, "OptionDescription": "Streptococcus pneumoniae"},
        {"OptionID": 26, "OptionDescription": "Mycoplasma pneumoniae"},
        {"OptionID": 27, "OptionDescription": "Klebsiella pneumoniae"},
        {"OptionID": 28, "OptionDescription": "Haemophilus influenzae"},
        {"OptionID": 29, "OptionDescription": "Vitamin B12 deficiency"},
        {"OptionID": 30, "OptionDescription": "Iron deficiency"},
        {"OptionID": 31, "OptionDescription": "Vitamin C deficiency"},
        {"OptionID": 32, "OptionDescription": "Vitamin D deficiency"}
    ]
    
    # Add new options to option data
    option_data.extend(additional_options)
    
    # Question options for new questions
    additional_question_options = [
        {"QuestionOptionID": 17, "QuestionID": 14, "OptionID": 17, "CorrectAnswer": True, 
         "Explanation": "IgE antibodies bind to mast cells and trigger the release of histamine in type I hypersensitivity."},
        {"QuestionOptionID": 18, "QuestionID": 14, "OptionID": 18, "CorrectAnswer": False, 
         "Explanation": "T helper cells are more involved in type IV hypersensitivity reactions."},
        {"QuestionOptionID": 19, "QuestionID": 14, "OptionID": 19, "CorrectAnswer": False, 
         "Explanation": "The complement system is more involved in type II and III hypersensitivity reactions."},
        {"QuestionOptionID": 20, "QuestionID": 14, "OptionID": 20, "CorrectAnswer": False, 
         "Explanation": "Neutrophils are important in acute inflammation but not type I hypersensitivity."},
        
        {"QuestionOptionID": 21, "QuestionID": 15, "OptionID": 21, "CorrectAnswer": True, 
         "Explanation": "The glomerulus is the site of blood filtration in the nephron."},
        {"QuestionOptionID": 22, "QuestionID": 15, "OptionID": 22, "CorrectAnswer": False, 
         "Explanation": "The loop of Henle is involved in concentrating urine, not filtration."},
        {"QuestionOptionID": 23, "QuestionID": 15, "OptionID": 23, "CorrectAnswer": False, 
         "Explanation": "The collecting duct is involved in final water reabsorption, not filtration."},
        {"QuestionOptionID": 24, "QuestionID": 15, "OptionID": 24, "CorrectAnswer": False, 
         "Explanation": "The proximal convoluted tubule is involved in reabsorption of filtrate, not initial filtration."},
        
        {"QuestionOptionID": 25, "QuestionID": 16, "OptionID": 25, "CorrectAnswer": True, 
         "Explanation": "Streptococcus pneumoniae is the most common cause of community-acquired pneumonia."},
        {"QuestionOptionID": 26, "QuestionID": 16, "OptionID": 26, "CorrectAnswer": False, 
         "Explanation": "Mycoplasma pneumoniae is a common cause, especially in younger patients, but not the most common overall."},
        {"QuestionOptionID": 27, "QuestionID": 16, "OptionID": 27, "CorrectAnswer": False, 
         "Explanation": "Klebsiella pneumoniae is more commonly associated with hospital-acquired pneumonia."},
        {"QuestionOptionID": 28, "QuestionID": 16, "OptionID": 28, "CorrectAnswer": False, 
         "Explanation": "Haemophilus influenzae is less common since the introduction of the Hib vaccine."},
        
        {"QuestionOptionID": 29, "QuestionID": 17, "OptionID": 29, "CorrectAnswer": True, 
         "Explanation": "Vitamin B12 deficiency leads to impaired DNA synthesis, resulting in megaloblastic anemia."},
        {"QuestionOptionID": 30, "QuestionID": 17, "OptionID": 30, "CorrectAnswer": False, 
         "Explanation": "Iron deficiency typically causes microcytic anemia, not megaloblastic anemia."},
        {"QuestionOptionID": 31, "QuestionID": 17, "OptionID": 31, "CorrectAnswer": False, 
         "Explanation": "Vitamin C deficiency causes scurvy, not megaloblastic anemia."},
        {"QuestionOptionID": 32, "QuestionID": 17, "OptionID": 32, "CorrectAnswer": False, 
         "Explanation": "Vitamin D deficiency affects calcium metabolism and bone health, not erythropoiesis."}
    ]
    
    question_option_data.extend(additional_question_options)
    
    # Additional content area classifications for new questions
    additional_classification_data = [
        {"QuestionClassID": 5, "QuestionID": 14, "ContentAreaID": 2},  
        {"QuestionClassID": 6, "QuestionID": 15, "ContentAreaID": 1},  
        {"QuestionClassID": 7, "QuestionID": 16, "ContentAreaID": 3},  
        {"QuestionClassID": 8, "QuestionID": 17, "ContentAreaID": 4}   
    ]
    
    # Add new classifications to question_classification_data
    question_classification_data.extend(additional_classification_data)
    
    try:
        
        ingest_grade_classifications(grade_classification_data)
        ingest_content_area(content_area_data)
        ingest_options(option_data)   
        ingest_questions(question_data)     
        ingest_question_classification(question_classification_data)      
        ingest_question_options(question_option_data)
        
        try:
            db = next(get_db())
            # Generate embeddings for all questions
            for i in range(10, 18):  # Updated range to include new questions
                generate_question_embedding(i, db)
        finally:
            db.close()
        
        print("Question Related Sample Data Ingestion Successful")
    except Exception as e:
        print(f"An error occurred during ingestion: {e}")
        raise