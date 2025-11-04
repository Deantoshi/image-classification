from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
import shutil
import subprocess
import sys
from typing import List
import mimetypes
from database import init_db
from routes.user_routes import router as user_router
from routes.image_routes import router as image_router
from routes.user_analysis_routes import router as user_analysis_router
from routes.admin_routes import router as admin_router

app = FastAPI()

# Initialize the database on startup
init_db()

# Add CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://34.134.92.145:5173",  # Add your VM's IP
        "http://34.134.92.145:3000"  # Add your VM's IP],  # Vite and Create React App default ports
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(user_router, prefix="/api", tags=["users"])
app.include_router(image_router, prefix="/api", tags=["images"])
app.include_router(user_analysis_router, prefix="/api", tags=["user-analysis"])
app.include_router(admin_router, prefix="/api", tags=["admin"])

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

@app.delete("/clear-all-input")
async def clear_all_files():
    """
    Delete all files in both input and output directories.
    """
    try:
        input_files_deleted = 0
        output_files_deleted = 0
        
        # Clear input directory
        if os.path.exists(INPUT_DIR):
            for filename in os.listdir(INPUT_DIR):
                file_path = os.path.join(INPUT_DIR, filename)
                if os.path.isfile(file_path):
                    os.remove(file_path)
                    input_files_deleted += 1
        
        # Clear output directory
        # if os.path.exists(OUTPUT_DIR):
        #     for filename in os.listdir(OUTPUT_DIR):
        #         file_path = os.path.join(OUTPUT_DIR, filename)
        #         if os.path.isfile(file_path):
        #             os.remove(file_path)
        #             output_files_deleted += 1
        
        return {
            "message": f"Successfully cleared all files. Deleted {input_files_deleted} input files and {output_files_deleted} output files.",
            "input_files_deleted": input_files_deleted,
            "output_files_deleted": output_files_deleted,
            "status": "success"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear files: {str(e)}")

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

@app.post("/classify")
async def classify_images():
    """
    Run the MaskrcnnGradAidAg.py ML script to process uploaded images.
    """
    try:
        # Check if input directory exists and has files
        if not os.path.exists(INPUT_DIR):
            raise HTTPException(status_code=400, detail="Input directory does not exist. Please upload images first.")
        
        input_files = [f for f in os.listdir(INPUT_DIR) if os.path.isfile(os.path.join(INPUT_DIR, f))]
        if not input_files:
            raise HTTPException(status_code=400, detail="No files found in input directory. Please upload images first.")
        
        # Check if the ML script exists
        ml_script_path = "MaskrcnnGradAidAg.py"
        if not os.path.exists(ml_script_path):
            raise HTTPException(status_code=500, detail=f"ML script '{ml_script_path}' not found in backend directory.")
        
        # Run the ML script
        try:
            result = subprocess.run(
                [sys.executable, ml_script_path],
                cwd=os.getcwd(),
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode == 0:
                # Check if output files were generated
                output_files = []
                if os.path.exists(OUTPUT_DIR):
                    output_files = [f for f in os.listdir(OUTPUT_DIR) if os.path.isfile(os.path.join(OUTPUT_DIR, f))]
                
                return {
                    "message": "Classification completed successfully",
                    "status": "success",
                    "output_files_generated": len(output_files),
                    "stdout": result.stdout,
                    "processed_files": input_files
                }
            else:
                return {
                    "message": "Classification completed with errors",
                    "status": "error",
                    "error_code": result.returncode,
                    "stdout": result.stdout,
                    "stderr": result.stderr
                }
                
        except subprocess.TimeoutExpired:
            raise HTTPException(status_code=408, detail="Classification process timed out after 5 minutes.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to run classification script: {str(e)}")
    
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