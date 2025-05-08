import { HandleLogin } from "./Auth";
import { VITE_SERVER_URL } from "@env"
interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
}

const API_URL = VITE_SERVER_URL;
const TOKEN_KEY = '@storage_Key';

export const getToken = async (): Promise<string | null> => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error("Error fetching token from storage:", error);
    return null;
  }
};

const fetchFromApi = async (
  path: string, 
  { method, body }: RequestOptions, 
  isRetry = false
): Promise<any> => {
  try {
    let authToken = await getToken();

    if (!authToken) {
      await HandleLogin();
      authToken = await getToken();

      if (!authToken) {
        throw new Error("Unable to retrieve token after login.");
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    };

    const config: RequestInit = {
      method,
      headers,
    };

    // Only add body for non-GET requests if body exists
    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}/${path}`, config);

    if (response.status === 401) {
      // Token expired - handle refresh and retry
      if (isRetry) {
        throw new Error("Authentication failed after retry attempt");
      }
      // Clear token and re-login
      localStorage.removeItem(TOKEN_KEY);
      await HandleLogin();
      
      // Retry the original request with new token
      return fetchFromApi(path, { method, body }, true);
    } 
    
    if (!response.ok) {
      const errorDetails = await response.text();
      console.error(`API Error (${response.status}): ${errorDetails}`);
      throw new Error(`Error ${response.status}: ${errorDetails}`);
    } 

    if (response.headers.get('Content-Type')?.includes('application/json')) {
      return await response.json();
    }

    return await response.text() || null;
  } catch (error) {
    console.error(`Request failed (${method} ${path}):`, error);
    throw error;
  }
};

export const GET = async (path: string): Promise<any> => {
  return fetchFromApi(path, { method: 'GET' });
};

export const POST = async (path: string, content: any = {}): Promise<any> => {
  return fetchFromApi(path, { method: 'POST', body: content });
};

export const PUT = async (path: string, content: any = {}): Promise<any> => {
  return fetchFromApi(path, { method: 'PUT', body: content });
};

export const DELETE = async (path: string, content: any = null): Promise<any> => {
  const options: RequestOptions = { method: 'DELETE' };
  if (content !== null) {
    options.body = content;
  }
  return fetchFromApi(path, options);
};