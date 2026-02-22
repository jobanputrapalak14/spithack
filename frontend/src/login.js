import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";

export default function Login() {

    const login = useGoogleLogin({
        flow: "auth-code",   // ⭐ VERY IMPORTANT (gives refresh token)

        scope: `
      openid
      email
      profile
      https://www.googleapis.com/auth/calendar
      https://www.googleapis.com/auth/gmail.readonly
    `,

        onSuccess: async (codeResponse) => {
            try {
                const res = await axios.post(
                    "http://localhost:8000/api/google/verify-token",
                    {
                        code: codeResponse.code,  // ⭐ send code not access_token
                    }
                );

                console.log("Backend response:", res.data);
                alert("Google Connected!");
            } catch (err) {
                console.error(err);
                alert("Login failed");
            }
        },

        onError: () => console.log("Login Failed"),
    });

    return (
        <div>
            <h2>Login with Google</h2>
            <button onClick={() => login()}>
                Login with Google
            </button>
        </div>
    );
}