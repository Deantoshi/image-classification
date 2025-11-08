from database import save_user_profit, get_user_profit


def save_profit_data(user_id, scenario, profit_data):
    """
    Save or update user profit data for a specific scenario.
    Automatically prevents duplicates using the unique constraint on (user_id, scenario).

    Args:
        user_id (int): The user ID
        scenario (int): The scenario (1 for bin, 2 for conveyor)
        profit_data (dict): Dictionary containing profit metrics

    Returns:
        dict: A dictionary containing:
            - success: True if saved successfully
            - profit_id: The ID of the saved profit record
    """
    try:
        profit_id = save_user_profit(user_id, scenario, profit_data)
        return {
            'success': True,
            'profit_id': profit_id
        }
    except Exception as e:
        raise Exception(f"Error saving profit data: {str(e)}")


def get_profit_data(user_id, scenario=None):
    """
    Get user profit data by user ID and optionally scenario.

    Args:
        user_id (int): The user ID
        scenario (int, optional): The scenario (1 or 2). If None, returns all scenarios.

    Returns:
        dict or list: Single profit record if scenario specified, list of records otherwise
    """
    try:
        profit = get_user_profit(user_id, scenario)

        if scenario is not None:
            # Return single record as dictionary
            if profit:
                return {
                    'id': profit[0],
                    'user_id': profit[1],
                    'scenario': profit[2],
                    'total_profit': profit[3],
                    'total_revenue': profit[4],
                    'total_penalty': profit[5],
                    'marketable_proportion': profit[6],
                    'not_marketable_proportion': profit[7],
                    'total_classifications': profit[8],
                    'total_marketable_classifications': profit[9],
                    'total_not_marketable_classifications': profit[10],
                    'total_marketable_revenue': profit[11],
                    'total_not_marketable_revenue': profit[12]
                }
            return None
        else:
            # Return list of records
            return [
                {
                    'id': row[0],
                    'user_id': row[1],
                    'scenario': row[2],
                    'total_profit': row[3],
                    'total_revenue': row[4],
                    'total_penalty': row[5],
                    'marketable_proportion': row[6],
                    'not_marketable_proportion': row[7],
                    'total_classifications': row[8],
                    'total_marketable_classifications': row[9],
                    'total_not_marketable_classifications': row[10],
                    'total_marketable_revenue': row[11],
                    'total_not_marketable_revenue': row[12]
                }
                for row in profit
            ]
    except Exception as e:
        raise Exception(f"Error getting profit data: {str(e)}")
