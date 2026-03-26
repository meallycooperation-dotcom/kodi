const BASE_URL = 'https://example.supabase.co/rest/v1';

export const apiRequest = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${BASE_URL}${path}`, options);
  if (!response.ok) {
    throw new Error('API request failed');
  }

  return response.json();
};

export default apiRequest;
