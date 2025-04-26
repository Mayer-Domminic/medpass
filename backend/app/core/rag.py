from sqlalchemy import create_engine, inspect, MetaData, text
from sqlalchemy.orm import sessionmaker
from typing import Optional, List
from app.models import Student, LoginInfo
from .config import settings
from .base import Base
import math
from app.models import (
    Faculty,
    Document,
    DocumentChunk,
)
from app.schemas.reportschema import StudentReport, ExamReport, GradeReport, DomainReport
from app.schemas.question import (QuestionResponse)
from app.schemas.pydantic_base_models import user_schemas

from ..core.database import get_db
from app.services.gemini_service import embed_texts

import pypdf
import docx
import os
from langchain.text_splitter import RecursiveCharacterTextSplitter

def extract_text_pdf(filepath: str) -> str:
    
    with open(filepath, "rb") as file:
        pdf_reader = pypdf.PdfReader(file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
    return text

def extract_text_docx(filepath: str) -> str:
    
    doc = docx.Document(filepath)
    text = ""
    for paragraph in doc.paragraphs:
        text += paragraph.text + "\n"
    return text

def extract_text(filepath: str) -> str:
    
    _, ext = os.path.splitext(filepath)
    if ext.lower() == ".pdf":
        return extract_text_pdf(filepath)
    elif ext in [".docx", ".doc"]:
        return extract_text_docx(filepath)
    else:
        raise ValueError(f"Unsupported file type: {ext}")
    
def split_text(text: str) -> List[str]:
    # Split the text into chunks of 1000 characters with a chunk overlap of 200 characters
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    chunks = text_splitter.split_text(text)
    return chunks

def generate_document_embeddings(chunks):
    # Generate embeddings for the chunks
    embeddings = embed_texts(chunks)
    return embeddings


def ingest_document(db, file_path):
    
    try:
        text = extract_text(file_path)
    except ValueError as e:
        print(f"Error extracting text: {e}")
        return
    except Exception as e:
        print(f"Unexpected error: {e}")
        return
    
    chunks = split_text(text)
    
    embeddings = generate_document_embeddings(chunks)
    
    filename = os.path.basename(file_path)
    
    db = next(get_db())
    try:
        doc = Document(
            title=filename,
            author="System",  
            facultyid=1,  
        )
        db.add(doc)
        db.flush()
        
        for i, (text_chunk, embedding) in enumerate(zip(chunks, embeddings)):
            chunk = DocumentChunk(
                documentid=doc.documentid,
                chunkindex=i,
                content=text_chunk,
                embedding=embedding
            )
            db.add(chunk)
        
        db.commit()
        
        print(f"Document {filename} ingested successfully with ID: {doc.documentid}")
        
        return doc.documentid
      
    except Exception as e:
        db.rollback()
        print(f"Error processing file: {file_path}, {e}")
        return None
    
    finally:
        db.close()
    