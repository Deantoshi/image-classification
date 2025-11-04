from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import sys
import os

# Add parent directory to path to import user_analysis_service
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from user_analysis_service import add_analysis, get_user_analyses

router = APIRouter()


class AddAnalysisRequest(BaseModel):
    image_name: str
    object_id_in_image: int
    area_px2: float
    top_left_x: int
    top_left_y: int
    bottom_right_x: int
    bottom_right_y: int
    center: str
    width_px: float
    length_px: float
    volume_px3: float
    solidity: float
    strict_solidity: float
    lw_ratio: float
    area_in2: float
    weight_oz: float
    grade: str
    user_id: int


class GetUserAnalysesRequest(BaseModel):
    user_id: int


class AnalysisRecord(BaseModel):
    object_id: int
    image_name: str
    object_id_in_image: int
    area_px2: float
    top_left_x: int
    top_left_y: int
    bottom_right_x: int
    bottom_right_y: int
    center: str
    width_px: float
    length_px: float
    volume_px3: float
    solidity: float
    strict_solidity: float
    lw_ratio: float
    area_in2: float
    weight_oz: float
    grade: str
    user_id: int


@router.post("/add-analysis")
async def add_analysis_endpoint(request: AddAnalysisRequest):
    """
    Add a new analysis record to the user_analysis table.
    """
    try:
        analysis_id = add_analysis(
            image_name=request.image_name,
            object_id_in_image=request.object_id_in_image,
            area_px2=request.area_px2,
            top_left_x=request.top_left_x,
            top_left_y=request.top_left_y,
            bottom_right_x=request.bottom_right_x,
            bottom_right_y=request.bottom_right_y,
            center=request.center,
            width_px=request.width_px,
            length_px=request.length_px,
            volume_px3=request.volume_px3,
            solidity=request.solidity,
            strict_solidity=request.strict_solidity,
            lw_ratio=request.lw_ratio,
            area_in2=request.area_in2,
            weight_oz=request.weight_oz,
            grade=request.grade,
            user_id=request.user_id
        )

        return {
            "object_id": analysis_id,
            "message": "Analysis record added successfully",
            "status": "success"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add analysis: {str(e)}")


@router.post("/get-user-analyses")
async def get_user_analyses_endpoint(request: GetUserAnalysesRequest):
    """
    Get all analysis records for a specific user.
    """
    try:
        analyses = get_user_analyses(request.user_id)

        # Convert tuple results to dictionaries
        analysis_list = []
        for analysis in analyses:
            analysis_list.append({
                "object_id": analysis[0],
                "image_name": analysis[1],
                "object_id_in_image": analysis[2],
                "area_px2": analysis[3],
                "top_left_x": analysis[4],
                "top_left_y": analysis[5],
                "bottom_right_x": analysis[6],
                "bottom_right_y": analysis[7],
                "center": analysis[8],
                "width_px": analysis[9],
                "length_px": analysis[10],
                "volume_px3": analysis[11],
                "solidity": analysis[12],
                "strict_solidity": analysis[13],
                "lw_ratio": analysis[14],
                "area_in2": analysis[15],
                "weight_oz": analysis[16],
                "grade": analysis[17],
                "user_id": analysis[18]
            })

        return {
            "user_id": request.user_id,
            "analyses": analysis_list,
            "count": len(analysis_list),
            "status": "success"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user analyses: {str(e)}")
