import { useCallback } from "react";
import { POST } from "./Request";

const useFetchHandlers = () => {
  const HandleSignIn = useCallback(async ({ loginInfo, setIsLoading }: 
    { loginInfo: { email: string; password: string }, setIsLoading: any }) => {
    console.log("Login info:", loginInfo);
    try {
      setIsLoading(true)
      const response = await POST("api/sign-in-student", loginInfo);
      console.log("Sign-in success:", response);
      // Do something with response or pass it to `onLoginSuccess`
    } catch (err) {
      console.error("Sign-in error:", err);
    } finally {setIsLoading(false)}
  }, []);

  const HandleAccouncementsFetching = (async () => {
    const response = await POST("api/fetch-announcements", {author_id: 3})
    console.log(response)

  })

  return { HandleSignIn,  HandleAccouncementsFetching };
};

export default useFetchHandlers;
