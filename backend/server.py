from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
import shutil
from typing import List
import mimetypes

app = FastAPI()

# Add CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite and Create React App default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure the input and output directories exist
INPUT_DIR = "input"
OUTPUT_DIR = "output"
os.makedirs(INPUT_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

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

@app.get("/output/files")
async def list_output_files():
    """
    List all files in the output directory.
    """
    try:
        if not os.path.exists(OUTPUT_DIR):
            return {"files": [], "message": "Output directory does not exist"}
        
        files = []
        for filename in os.listdir(OUTPUT_DIR):
            file_path = os.path.join(OUTPUT_DIR, filename)
            if os.path.isfile(file_path):
                # Get file extension to determine type
                _, ext = os.path.splitext(filename)
                file_type = "image" if ext.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.bmp'] else "csv" if ext.lower() == '.csv' else "other"
                
                files.append({
                    "filename": filename,
                    "type": file_type,
                    "size": os.path.getsize(file_path)
                })
        
        return {
            "files": files,
            "count": len(files),
            "status": "success"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/output/file/{filename}")
async def get_output_file(filename: str):
    """
    Serve a specific file from the output directory.
    """
    try:
        file_path = os.path.join(OUTPUT_DIR, filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        if not os.path.isfile(file_path):
            raise HTTPException(status_code=400, detail="Path is not a file")
        
        # Determine media type
        media_type, _ = mimetypes.guess_type(file_path)
        if media_type is None:
            media_type = 'application/octet-stream'
        
        return FileResponse(
            path=file_path,
            media_type=media_type,
            filename=filename
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/output/csv/{filename}")
async def get_csv_content(filename: str):
    """
    Get CSV file content as JSON for frontend display.
    """
    try:
        if not filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="File is not a CSV")
        
        file_path = os.path.join(OUTPUT_DIR, filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="CSV file not found")
        
        # Read CSV content
        import csv
        rows = []
        with open(file_path, 'r', newline='', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            for row in reader:
                rows.append(row)
        
        if not rows:
            return {"headers": [], "data": [], "message": "CSV file is empty"}
        
        headers = rows[0] if rows else []
        data = rows[1:] if len(rows) > 1 else []
        
        return {
            "filename": filename,
            "headers": headers,
            "data": data,
            "row_count": len(data),
            "status": "success"
        }
    
    except HTTPException:
        raise
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
    return {
        "status": "healthy", 
        "input_dir_exists": os.path.exists(INPUT_DIR),
        "output_dir_exists": os.path.exists(OUTPUT_DIR)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)