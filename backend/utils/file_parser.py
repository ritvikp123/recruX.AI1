import io
import fitz  # PyMuPDF
import docx
from fastapi import UploadFile

async def extract_text_from_file(file: UploadFile) -> str:
    """
    Extracts text from a given UploadFile object (PDF or DOCX).
    """
    content = await file.read()
    filename = file.filename.lower()
    
    extracted_text = ""
    
    if filename.endswith(".pdf"):
        # Parse PDF using PyMuPDF
        pdf_stream = io.BytesIO(content)
        doc = fitz.open(stream=pdf_stream, filetype="pdf")
        for page in doc:
            extracted_text += page.get_text()
        doc.close()
        
    elif filename.endswith(".docx"):
        # Parse DOCX using python-docx
        docx_stream = io.BytesIO(content)
        doc = docx.Document(docx_stream)
        for para in doc.paragraphs:
            extracted_text += para.text + "\n"
            
    else:
        # For simplicity, assume plain text if not pdf/docx
        try:
            extracted_text = content.decode("utf-8")
        except Exception:
            raise ValueError("Unsupported file format or encoding.")
            
    return extracted_text.strip()
