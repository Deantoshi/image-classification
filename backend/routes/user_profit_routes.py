from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.user_profit_service import save_profit_data, get_profit_data


router = APIRouter()


class ProfitDataRequest(BaseModel):
    user_id: int
    scenario: int
    total_profit: float
    total_revenue: float
    total_penalty: float
    marketable_proportion: float
    not_marketable_proportion: float
    total_classifications: int
    total_marketable_classifications: int
    total_not_marketable_classifications: int
    total_marketable_revenue: float
    total_not_marketable_revenue: float


@router.post("/save-profit")
async def save_profit_endpoint(request: ProfitDataRequest):
    """
    Save or update user profit data for a specific scenario.
    Automatically prevents duplicates based on user_id and scenario.
    """
    try:
        if request.scenario not in [1, 2]:
            raise HTTPException(status_code=400, detail="Scenario must be 1 or 2")

        profit_data = {
            'total_profit': request.total_profit,
            'total_revenue': request.total_revenue,
            'total_penalty': request.total_penalty,
            'marketable_proportion': request.marketable_proportion,
            'not_marketable_proportion': request.not_marketable_proportion,
            'total_classifications': request.total_classifications,
            'total_marketable_classifications': request.total_marketable_classifications,
            'total_not_marketable_classifications': request.total_not_marketable_classifications,
            'total_marketable_revenue': request.total_marketable_revenue,
            'total_not_marketable_revenue': request.total_not_marketable_revenue
        }

        result = save_profit_data(request.user_id, request.scenario, profit_data)

        return {
            "success": result['success'],
            "profit_id": result['profit_id'],
            "status": "success"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save profit data: {str(e)}")


@router.get("/get-profit/{user_id}")
async def get_profit_endpoint(user_id: int, scenario: int = None):
    """
    Get user profit data by user ID and optionally scenario.
    If scenario is provided, returns single record. Otherwise returns all scenarios for the user.
    """
    try:
        result = get_profit_data(user_id, scenario)

        if scenario is not None and result is None:
            raise HTTPException(status_code=404, detail="Profit data not found")

        return {
            "profit_data": result,
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get profit data: {str(e)}")
