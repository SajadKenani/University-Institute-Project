import { useCallback } from "react";
import { POST } from "./auth/Request";

const useFetchHandlers = ({ loginInfo, setIsLoading }: 
    { loginInfo: { email: string; password: string }, setIsLoading: any }) => {
  const HandleSignIn = useCallback(async () => {
    console.log("Login info:", loginInfo);
    try {
      setIsLoading(true)
      const response = await POST("api/sign-in-student", loginInfo);
      console.log("Sign-in success:", response);
      // Do something with response or pass it to `onLoginSuccess`
    } catch (err) {
      console.error("Sign-in error:", err);
    } finally {setIsLoading(false)}
  }, [loginInfo]);

  return { HandleSignIn };
};

export default useFetchHandlers;
