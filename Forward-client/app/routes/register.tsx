import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { toast } from "sonner";
import { Link } from "react-router";

export default function Login() {
  const [error, setError] = useState(null);
  const [instructor, setInstructor] = useState(false);
  const login = useAuth().login;

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const username = (formData.get("first_name")?.toString().toLowerCase().slice(0,2)??"")
                    +(formData.get("last_name")?.toString().toLowerCase().slice(0,2)??"")
                    +(formData.get("birth_month")??"00")
                    +(formData.get("birth_year")?.slice(2,5)??"XX");
    const data = {

      username,
      display_name: username,
      password: formData.get("password"),
      password_confirm: formData.get("password2"),

    };

    const password = formData.get("password") as string;
    const confirmPassword = formData.get("password2") as string;

    if (password !== confirmPassword) {
      try {
        throw new Error("Passwords do not match.");
      } catch (err: any) {
        setError(err.message);
      }
      return;
    }

    try {
      /* TODO: change api domain*/
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok) {
        if (result.detail) {
          if (typeof result.detail === "object") {
            // Handle field-specific errors
            const errorMessages = Object.values(result.detail)
              .map((messages) => (messages as string[]).join("\n"))
              .join("\n");
            throw new Error(errorMessages);
          } else {
            // Handle simple string errors
            throw new Error(result.detail);
          }
        }
        // Handle invalid server responses / Server non-responses
        toast.error("Registration failed. Please try again.");
        throw new Error("Registration failed. Please try again.");
      }

      login({...result.data.user});

      // Redirect to the dashboard on success
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex w-screen items-center justify-center">
      <div className="bg-foreground text-secondary-foreground outline-foreground-border my-1 flex w-fit flex-col items-center rounded-3xl p-6 outline-1">
        <h1 className="text-xl font-medium">Create an account</h1>
        <form onSubmit={handleSubmit} className="my-6 flex flex-col gap-5">
          <div className="flex gap-2">
            <div>
              <label htmlFor="first_name">First Name <span className="text-error">*</span></label>
              <Input
                minLength={2}
                type="text"
                name="first_name"
                id="first_name"
                placeholder="ex: Jane"
                className="input"
                required
              />
            </div>
            <div>
              <label htmlFor="last_name">Last Name <span className="text-error">*</span></label>
              <Input
                minLength={2}
                type="text"
                name="last_name"
                id="last_name"
                placeholder="ex: Smith"
                className="input"
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex flex-1 flex-col">
              <label htmlFor="birth-month">Birth Month <span className="text-error">*</span></label>
              <select
                required
                id="birth-month"
                name="birth_month"
                className="bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-xl border px-3 py-2 text-base"
              >
                <option value="" disabled selected>Select Birth Month</option>
                <option value={"01"}>01 - January</option>
                <option value={"02"}>02 - February</option>
                <option value={"03"}>03 - March</option>
                <option value={"04"}>04 - April</option>
                <option value={"05"}>05 - May</option>
                <option value={"06"}>06 - June</option>
                <option value={"07"}>07 - July</option>
                <option value={"08"}>08 - August</option>
                <option value={"09"}>09 - September</option>
                <option value={"10"}>10 - October</option>
                <option value={"11"}>11 - November</option>
                <option value={"12"}>12 - December</option>
              </select>
            </div>
            <div className="flex flex-1 flex-col">
              <label htmlFor="birth-year">Birth Year <span className="text-error">*</span></label>
              <select
                required
                id="birth-year"
                name="birth_year"
                className="bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-xl border px-3 py-2 text-base"
              >
                <option value="" disabled selected>Select Birth Year</option>
                {Array.from(
                  { length: 100 },
                  (_, i) => new Date().getFullYear() - i,
                ).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="password">Password <span className="text-error">*</span></label>
            <PasswordInput
              name="password"
              id="password"
              placeholder="Password"
              className="input"
              disabled={false}
            />
          </div>
          <div>
            <label htmlFor="password">Confirm Password <span className="text-error">*</span></label>
            <PasswordInput
              name="password2"
              id="password2"
              placeholder="Password"
              className="input"
              disabled={false}
              required
            />
          </div>
          <div>
            <label htmlFor="institution">Institution ID</label>
            <Input
              type="text"
              name="institution"
              id="institution"
              placeholder="Institution ID"
              className="input min-w-[25vw]"
            />
          </div>
          {instructor && (
            <div>
              <label htmlFor="email">e-Mail</label>
              <Input
                type="email"
                name="email"
                id="email"
                placeholder="jane.smith@example.com"
                className="input min-w-[25vw]"
                required
              />
            </div>
          )}
          <div className="flex gap-2">
            {!instructor && (
              <Button
                aria-label="Switch to instructor onboarding"
                variant={"outline"}
                className="px-4"
                onClick={() => {
                  setInstructor(true);
                }}
              >
                I am an instructor
              </Button>
            )}
            <Button
              aria-label="Create Account"
              type="submit"
              className="button bg-primary text-primary-foreground outline-primary-border w-full outline-1 active:brightness-110"
              variant={"default"}
            >
              Create Account
            </Button>
          </div>
          {error && (
            <p className="text-error-border w-full text-center">{error}</p>
          )}
        </form>
        <p className="text-muted-foreground text-center">
          Already have an account? <br />
          <Link to="/login" className="text-blue-500 underline">
            Log In
          </Link>{" "}
          instead
        </p>
      </div>
    </div>
  );
}
//
