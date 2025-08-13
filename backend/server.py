from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from typing import List

app = FastAPI()

# Add CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite and Create React App default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure the input directory exists (matching your ML script's expected input path)
INPUT_DIR = "input"
os.makedirs(INPUT_DIR, exist_ok=True)

@app.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    """
    Upload multiple image files to the input directory for ML processing.
    """
    try:
        uploaded_files = []
        for file in files:
            # Check if file is an image
            if not file.content_type or not file.content_type.startswith('image/'):
                raise HTTPException(status_code=400, detail=f"File {file.filename} is not an image")
            
            # Save file to input directory
            file_path = os.path.join(INPUT_DIR, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            uploaded_files.append(file.filename)
        
        return {
            "message": f"Successfully uploaded {len(uploaded_files)} files", 
            "files": uploaded_files,
            "status": "success"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    """
    Health check endpoint.
    """
    return {"message": "Image Processing API is running"}

@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    """
    return {"status": "healthy", "input_dir_exists": os.path.exists(INPUT_DIR)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)