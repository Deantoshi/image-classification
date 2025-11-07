const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:8000';

export interface AnalysisRecord {
  object_id: number;
  image_name: string;
  object_id_in_image: number;
  area_px2: number;
  top_left_x: number;
  top_left_y: number;
  bottom_right_x: number;
  bottom_right_y: number;
  center: string;
  width_px: number;
  length_px: number;
  volume_px3: number;
  solidity: number;
  strict_solidity: number;
  lw_ratio: number;
  area_in2: number;
  weight_oz: number;
  grade: string;
  user_id: number;
}

export interface AddAnalysisRequest {
  image_name: string;
  object_id_in_image: number;
  area_px2: number;
  top_left_x: number;
  top_left_y: number;
  bottom_right_x: number;
  bottom_right_y: number;
  center: string;
  width_px: number;
  length_px: number;
  volume_px3: number;
  solidity: number;
  strict_solidity: number;
  lw_ratio: number;
  area_in2: number;
  weight_oz: number;
  grade: string;
  user_id: number;
}

export interface AddAnalysisResponse {
  object_id: number;
  message: string;
  status: string;
}

export interface GetUserAnalysesRequest {
  user_id: number;
}

export interface GetUserAnalysesResponse {
  user_id: number;
  analyses: AnalysisRecord[];
  count: number;
  status: string;
}

export interface GetAllUserAnalysesResponse {
  analyses: AnalysisRecord[];
  count: number;
  status: string;
}

/**
 * Add a new analysis record to the database.
 * Associates analysis data with a user ID.
 */
export const addAnalysis = async (
  analysisData: AddAnalysisRequest
): Promise<AddAnalysisResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/add-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analysisData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data: AddAnalysisResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling add-analysis:', error);
    throw error;
  }
};

/**
 * Get all analysis records associated with a specific user.
 * Returns a list of all analysis data for the given user_id.
 */
export const getUserAnalyses = async (user_id: number): Promise<GetUserAnalysesResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/get-user-analyses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data: GetUserAnalysesResponse = await response.json();
    // Add 1 to object_id_in_image to match 1-based indexing in classified images
    data.analyses = data.analyses.map(analysis => ({
      ...analysis,
      object_id_in_image: analysis.object_id_in_image + 1
    }));
    return data;
  } catch (error) {
    console.error('Error calling get-user-analyses:', error);
    throw error;
  }
};

/**
 * Get all analysis records from the database.
 * Returns a list of all analysis data for all users.
 */
export const getAllUserAnalyses = async (): Promise<GetAllUserAnalysesResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/get-all-user-analyses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data: GetAllUserAnalysesResponse = await response.json();
    // Add 1 to object_id_in_image to match 1-based indexing in classified images
    data.analyses = data.analyses.map(analysis => ({
      ...analysis,
      object_id_in_image: analysis.object_id_in_image + 1
    }));
    return data;
  } catch (error) {
    console.error('Error calling get-all-user-analyses:', error);
    throw error;
  }
};
