const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:8000';

export interface GetOrCreateNameRequest {
  name: string;
}

export interface GetOrCreateNameResponse {
  id: number;
  name: string;
  is_new_name: number;
  status: string;
}

/**
 * Get or create a user by name.
 * If the name exists, returns the existing user with is_new_name = 0.
 * If the name doesn't exist, creates it and returns is_new_name = 1.
 */
export const getOrCreateName = async (name: string): Promise<GetOrCreateNameResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/get-or-create-name`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data: GetOrCreateNameResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling get-or-create-name:', error);
    throw error;
  }
};
