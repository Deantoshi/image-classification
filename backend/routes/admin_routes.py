from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_connection
import os

router = APIRouter()

OUTPUT_DIR = "output"


class SQLQuery(BaseModel):
    query: str


@router.post("/admin/query")
async def execute_query(sql_query: SQLQuery):
    """
    Execute a SQL query on the database (SELECT queries only for safety).
    """
    try:
        query = sql_query.query.strip()

        # Basic security: only allow SELECT queries
        if not query.upper().startswith('SELECT'):
            raise HTTPException(
                status_code=400,
                detail="Only SELECT queries are allowed for safety reasons"
            )

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(query)

        # Get column names
        columns = [description[0] for description in cursor.description] if cursor.description else []

        # Fetch all results
        rows = cursor.fetchall()

        # Convert to list of dictionaries
        results = []
        for row in rows:
            results.append(dict(zip(columns, row)))

        conn.close()

        return {
            "status": "success",
            "columns": columns,
            "data": results,
            "row_count": len(results)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query execution failed: {str(e)}")


@router.get("/admin/tables")
async def get_tables():
    """
    Get list of all tables in the database.
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT name FROM sqlite_master
            WHERE type='table'
            ORDER BY name
        """)

        tables = [row[0] for row in cursor.fetchall()]
        conn.close()

        return {
            "status": "success",
            "tables": tables
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch tables: {str(e)}")


@router.get("/admin/table-schema/{table_name}")
async def get_table_schema(table_name: str):
    """
    Get the schema/structure of a specific table.
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Get table info
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()

        schema = []
        for col in columns:
            schema.append({
                "cid": col[0],
                "name": col[1],
                "type": col[2],
                "notnull": bool(col[3]),
                "default_value": col[4],
                "pk": bool(col[5])
            })

        conn.close()

        return {
            "status": "success",
            "table_name": table_name,
            "schema": schema
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch table schema: {str(e)}")


@router.get("/admin/images")
async def list_output_images():
    """
    List all images in the output directory with their metadata.
    """
    try:
        if not os.path.exists(OUTPUT_DIR):
            return {"status": "success", "images": [], "message": "Output directory does not exist"}

        images = []
        for filename in os.listdir(OUTPUT_DIR):
            file_path = os.path.join(OUTPUT_DIR, filename)
            if os.path.isfile(file_path):
                # Check if it's an image file
                _, ext = os.path.splitext(filename)
                if ext.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']:
                    images.append({
                        "filename": filename,
                        "size": os.path.getsize(file_path),
                        "url": f"/output/file/{filename}"
                    })

        return {
            "status": "success",
            "images": images,
            "count": len(images)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list images: {str(e)}")
