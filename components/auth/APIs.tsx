import { useCallback } from "react";
import { GET, POST } from "./Request"; // Assuming you also have GET method

// Type definitions
interface LoginInfo {
  email: string;
  password: string;
}

interface LoginHandlerParams {
  loginInfo: LoginInfo;
  setIsLoading: (loading: boolean) => void;
}

interface AnnouncementItem {
  id: string;
  title: string;
  image?: string;
  content?: string;
  createdAt?: string;
}

const useFetchHandlers = () => {
  const HandleSignIn = useCallback(async ({ 
    loginInfo, 
    setIsLoading 
  }: LoginHandlerParams) => {
    console.log("Login info:", loginInfo);
    try {
      setIsLoading(true);
      const response = await POST("api/sign-in-student", loginInfo);
      console.log("Sign-in success:", response);
      return response; // Return the response so it can be used by the caller
    } catch (err) {
      console.error("Sign-in error:", err);
      throw err; // Re-throw the error so the caller can handle it
    } finally {
      setIsLoading(false);
    }
  }, []);

  const HandleAccouncementsFetching = useCallback(
    async (setAnnouncements: React.Dispatch<React.SetStateAction<AnnouncementItem[]>>) => {
    try {
      // Replace with your actual API endpoint
      const response = await GET("api/fetch-all-announcements"); // or POST if needed
      console.log("Announcements fetched:", response.data);
      setAnnouncements(response.data);
      
      // Assuming the API returns an array of announcements
      // You might need to adjust this based on your API response structure
      return response.data || response || [];
    } catch (err) {
      console.error("Announcements fetch error:", err);
      throw err; // Re-throw so the caller can handle the error
    }
  }, []);

  return { 
    HandleSignIn, 
    HandleAccouncementsFetching 
  };
};

export default useFetchHandlers;