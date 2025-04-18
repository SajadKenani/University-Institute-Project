export const HandleLogin = async () => {
  const username = import.meta.env.VITE_CLIENT_USERNAME
  const password = import.meta.env.VITE_CLIENT_PASSWORD
  const backendURL = import.meta.env.VITE_SERVER_URL
  console.log("loginging")
    try {
      const response = await fetch(`${backendURL}/login`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('@storage_Key', data.token); 
        console.log(localStorage.getItem('@storage_Key'))
      } else {
        console.error("Login failed:", response.status, await response.text());
      }
    } catch (error) {
      console.error("Error during login:", error);
    } finally {
      console.log("logined!")
    }
  };