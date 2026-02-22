import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";

export default function Login() {
    const handleSuccess = async (credentialResponse) => {
        const accessToken = credentialResponse.access_token;

        try {
            const res = await axios.post(
                "http://localhost:8000/api/google/verify-token",
                {
                    access_token: accessToken,
                }
            );

            console.log("Backend response:", res.data);
            alert("Google Connected!");
        } catch (err) {
            console.error(err);
            alert("Login failed");
        }
    };

    return (
        <div>
            <h2>Login with Google</h2>
            <GoogleLogin
                onSuccess={handleSuccess}
                onError={() => console.log("Login Failed")}
            />
        </div>
    );
}