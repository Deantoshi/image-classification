from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.image_service import add_image_match, get_images_by_user


router = APIRouter()


class ImageMatchRequest(BaseModel):
    image_name: str
    user_id: int


class UserImagesRequest(BaseModel):
    user_id: int


@router.post("/add-image-match")
async def add_image_match_endpoint(request: ImageMatchRequest):
    """
    Add a new image match entry to the database.

    Associates an image name with a user ID.
    """
    try:
        if not request.image_name or not request.image_name.strip():
            raise HTTPException(status_code=400, detail="Image name cannot be empty")

        if request.user_id is None or request.user_id < 1:
            raise HTTPException(status_code=400, detail="Valid user_id is required")

        result = add_image_match(request.image_name.strip(), request.user_id)

        return {
            "image_id": result['image_id'],
            "image_name": result['image_name'],
            "user_id": result['user_id'],
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add image match: {str(e)}")


@router.post("/get-user-images")
async def get_user_images_endpoint(request: UserImagesRequest):
    """
    Get all images associated with a specific user.

    Returns a list of all image_ids and image_names for the given user_id.
    """
    try:
        if request.user_id is None or request.user_id < 1:
            raise HTTPException(status_code=400, detail="Valid user_id is required")

        images = get_images_by_user(request.user_id)

        return {
            "user_id": request.user_id,
            "images": images,
            "count": len(images),
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user images: {str(e)}")
