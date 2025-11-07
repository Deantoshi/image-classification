const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:8000';

export interface AddImageMatchRequest {
  image_name: string;
  user_id: number;
}

export interface AddImageMatchResponse {
  image_id: number;
  image_name: string;
  user_id: number;
  status: string;
}

export interface GetUserImagesRequest {
  user_id: number;
}

export interface ImageMatch {
  image_id: number;
  image_name: string;
  user_id: number;
}

export interface GetUserImagesResponse {
  user_id: number;
  images: ImageMatch[];
  count: number;
  status: string;
}

/**
 * Add a new image match to the database.
 * Associates an image name with a user ID.
 */
export const addImageMatch = async (
  image_name: string,
  user_id: number
): Promise<AddImageMatchResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/add-image-match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_name, user_id }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data: AddImageMatchResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling add-image-match:', error);
    throw error;
  }
};

/**
 * Get all images associated with a specific user.
 * Returns a list of all image_ids and image_names for the given user_id.
 */
export const getUserImages = async (user_id: number): Promise<GetUserImagesResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/get-user-images`, {
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

    const data: GetUserImagesResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling get-user-images:', error);
    throw error;
  }
};
