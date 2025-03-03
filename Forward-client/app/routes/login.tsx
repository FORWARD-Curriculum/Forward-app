import { useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useState } from "react";
import { useAuth } from "@/lib/useAuth";
import type { User } from "@/lib/userSlice";
import { toast } from "sonner";

export default function Login() {
  const [error, setError] = useState(null);
  const login = useAuth().login;
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e: any) => {
    e.preventDefault(); // Prevent the default form submission behavior
    const formData = new FormData(e.target);
    const data = {
      username: formData.get("username"),
      password: formData.get("password"),
    };

    try {
      /* TODO: change api domain*/
      const response = await fetch("/api/sessions/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok) {
        toast.error("Hmm... something went wrong")
        throw new Error(result.detail||"Login error.");
      } 

      const user: User = {
        id: result.data.user.id,
        username: result.data.user.username,
        firstName: result.data.user.first_name,
        lastName: result.data.user.last_name,
      };

      login(user);

      // Redirect to the route user attempted to access prior to logging in
      navigate(from, { replace: true });
      toast.success("Successfully Logged In!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center w-screen grow">
      <div className="bg-white rounded-3xl w-fit p-6 flex flex-col items-center">
        <h1 className="text-xl font-medium">Login to an existing account</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 my-6">
          <div>
            <label htmlFor="username">Username</label>
            <Input
              type="text"
              name="username"
              id="username"
              placeholder="Username"
              className="input min-w-[25vw]"
              required
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <PasswordInput
              name="password"
              id="password"
              placeholder="Password"
              className="input"
              disabled={false}
            />
          </div>
          <Button
            type="submit"
            className="button w-full bg-cyan-500 text-white active:bg-cyan-600"
            variant={"outline"}
          >
            Login
          </Button>
          {error && <p className="text-red-500 w-full text-center">{error}</p>}
        </form>
        <p className="text-center text-gray-400">
          Don't have an account? <br />
          <a href="/register" className="text-blue-500 underline">
            Sign Up
          </a>{" "}
          instead
        </p>
      </div>
    </div>
  );
}