import { Link, useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useState } from "react";
import { useAuth } from "@/features/account/hooks";
import { toast } from "sonner";
import { apiFetch } from "@/utils/utils";

export default function Login() {
  const [error, setError] = useState(null);
  const login = useAuth().login;
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";

  const handleSubmit = async (e: any) => {
    e.preventDefault(); // Prevent the default form submission behavior
    const formData = new FormData(e.target);
    const data = {
      username: formData.get("username"),
      password: formData.get("password"),
    };

    try {
      /* TODO: change api domain*/
      const response = await apiFetch("/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok) {
        toast.error("Hmm... something went wrong");
        throw new Error(result.detail || "Login error.");
      }

      login({...result.data.user})

      // Redirect to the route user attempted to access prior to logging in
      // removed it; made it so the user when logging in is always redirected to dashboard this is because with the use of guest i need to redirect 
      // away from a route the guest was in and cause a refresh 
      // navigate(from, { replace: true });
      toast.success("Successfully Logged In!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex w-screen grow items-center justify-center">
      <div className="bg-foreground outline-foreground-border text-secondary-foreground flex w-fit flex-col items-center rounded-3xl p-6 outline-1">
        <h1 className="text-xl font-medium">Login to an existing account</h1>
        <form onSubmit={handleSubmit} className="my-6 flex flex-col gap-6">
          <div>
            <label htmlFor="username">Username</label>
            <Input
              aria-label="Input username"
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
            aria-label="Login"
            type="submit"
            className="button bg-primary text-primary-foreground outline-primary-border w-full outline-1 active:brightness-125"
            variant={"default"}
          >
            Login
          </Button>
          {error && (
            <p className="text-error-border w-full text-center">{error}</p>
          )}
        </form>
        <p className="text-muted-foreground text-center">
          Don't have an account? <br />
          <Link prefetch="intent" to="/register" className="text-blue-500 underline">
            Sign Up
          </Link>{" "}
          instead
        </p>
      </div>
    </div>
  );
}
