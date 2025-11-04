from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.user_service import get_or_create_name


router = APIRouter()


class NameRequest(BaseModel):
    name: str


@router.post("/get-or-create-name")
async def get_or_create_name_endpoint(request: NameRequest):
    """
    Get or create a user by name.

    If the name exists in the database, return the existing user.
    If the name doesn't exist, create a new user and return it.
    """
    try:
        if not request.name or not request.name.strip():
            raise HTTPException(status_code=400, detail="Name cannot be empty")

        result = get_or_create_name(request.name.strip())

        return {
            "id": result['id'],
            "name": result['name'],
            "is_new_name": result['is_new_name'],
            "status": "success"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get or create name: {str(e)}")
