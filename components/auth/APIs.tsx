import { useCallback } from "react";
import { GET, POST } from "./Request"; // Assuming you also have GET method
import AsyncStorage from "@react-native-async-storage/async-storage";

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

interface StudentInfo {
  id: string;
  name: string;
  email: string;
  class: string;
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
      AsyncStorage.setItem("userToken", response.token);
      AsyncStorage.setItem("userID", response.value);
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
      const userID = await AsyncStorage.getItem("userID");
      try {
        // Replace with your actual API endpoint
        const response = await GET(`api/fetch-all-announcements/${userID}`); // or POST if needed
        console.log("Announcements fetched:", response.data);
        setAnnouncements(response.data);
        return response.data || response || [];
      } catch (err) {
        console.error("Announcements fetch error:", err);
        throw err; // Re-throw so the caller can handle the error
      }
    }, []);

  const HandleLecturesFetching = useCallback(
    async (setLectures: React.Dispatch<React.SetStateAction<AnnouncementItem[]>>) => {
      try {
        const response = await GET("api/fetch-all-videos")
        setLectures(response.data)
        console.log("Lectures fetched:", response.data);
      } catch (error) {
        console.error("Lectures fetch error:", error);
        throw error;
      }

    }, [])

  const HandleLovingAnnouncement = useCallback(async (announcement_id: number) => {
    const studentID = await AsyncStorage.getItem("userID");
    try {
      POST(`api/love-announcement/${announcement_id}/${studentID}`, {})
    } catch (error) { console.log("Loving announcement error:", error); }
  }, [])

  const HandleStudentInfoFetching = useCallback(
    async (setStudentInfo: React.Dispatch<React.SetStateAction<AnnouncementItem[]>>) => {
      const userID = await AsyncStorage.getItem("userID");
      try {
        const response = await GET(`api/fetch-specified-student/${userID}`)
        setStudentInfo(response.data)
        console.log("Student info fetched:", response);
      } catch (error) { console.error("Student info fetch error:", error); }

    }, [])

  const HandleSubjectsFetching = useCallback(
    async (setSubjects: React.Dispatch<React.SetStateAction<AnnouncementItem[]>>) => {
      const userID = await AsyncStorage.getItem("userID")
      try {
        const response = await POST("api/fetch-subjects", { "id": Number(userID) })
        console.log(response.data)
        setSubjects(response.data)
      } catch (error) { console.log(userID) }
  }, [])

  

  return {
    HandleSignIn,
    HandleAccouncementsFetching,
    HandleLecturesFetching,
    HandleLovingAnnouncement,
    HandleStudentInfoFetching,
    HandleSubjectsFetching
  };
};

export default useFetchHandlers;