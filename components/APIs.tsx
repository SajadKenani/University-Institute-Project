import { useCallback } from "react";
import { POST } from "./auth/Request";

export const SignInProcess = useCallback(async () => {
    const response = await POST("api/sign-in-student")
}, [])