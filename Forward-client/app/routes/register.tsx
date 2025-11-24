import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/features/account/hooks";
import { toast } from "sonner";
import { Link } from "react-router";
import { apiFetch } from "@/utils/utils";
import { Checkbox } from "@radix-ui/react-checkbox";

export default function Login() {
  const [error, setError] = useState(null);
  const [facilityEntered, setFacilityEntered] = useState(false);
  const login = useAuth().login;

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    

    const formData = new FormData(e.target);
    const bm = (formData.get("birth_month")??"00") as string;
    const by = (formData.get("birth_year")?.slice(2,5)??"XX") as string;
    const username = (formData.get("first_name")?.toString().replaceAll("'","").toLowerCase().slice(0,2)??"")
                    +(formData.get("last_name")?.toString().replaceAll("'","").toLowerCase().slice(0,2)??"")
                    +bm[0] + by[0] + bm[1] + by[1];
    const consent = formData.get("consent") === "on" ? true : false;
    const data = {

      username,
      display_name: username,
      password: formData.get("password"),
      password_confirm: formData.get("password2"),
      facility: (formData.get("facility") as string).toLowerCase(),
      consent: consent,

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
      const response = await apiFetch("/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok) {
        const flatten = (errObj: any): string => {
          if (!errObj) return "Registration failed. Please try again.";
          if (typeof errObj === "string") return errObj;
          if (Array.isArray(errObj)) return errObj.join("\n");
          if (typeof errObj === "object") {
            // DRF field errors: {field: [msg1, msg2], non_field_errors: [...]}
            return Object.entries(errObj)
              .map(([field, msgs]) => {
                const joined =
                  Array.isArray(msgs) ? msgs.join(", ") : String(msgs);
                return field === "non_field_errors"
                  ? joined
                  : `${field}: ${joined}`;
              })
              .join("\n");
          }
          return "Registration failed. Please try again.";
        };

        const message = result?.detail ? flatten(result.detail) : flatten(result);
        toast.error(message);
        throw new Error(message);
       }
      login({...result.data.user});

      // Redirect to the dashboard on success
      window.location.href = consent ? "/survey" : "/dashboard";
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
              <label htmlFor="first_name">
                First Name <span className="text-error">*</span>
              </label>
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
              <label htmlFor="last_name">
                Last Name <span className="text-error">*</span>
              </label>
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
              <label htmlFor="birth-month">
                Birth Month <span className="text-error">*</span>
              </label>
              <select
                required
                id="birth-month"
                name="birth_month"
                className="bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-xl border px-3 py-2 text-base"
              >
                <option value="" disabled selected>
                  Select Birth Month
                </option>
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
              <label htmlFor="birth-year">
                Birth Year <span className="text-error">*</span>
              </label>
              <select
                required
                id="birth-year"
                name="birth_year"
                className="bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-xl border px-3 py-2 text-base"
              >
                <option value="" disabled selected>
                  Select Birth Year
                </option>
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
            <label htmlFor="password">
              Password <span className="text-error">*</span>
            </label>
            <PasswordInput
              name="password"
              id="password"
              placeholder="Password"
              className="input"
              disabled={false}
            />
          </div>
          <div>
            <label htmlFor="password">
              Confirm Password <span className="text-error">*</span>
            </label>
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
            <label htmlFor="facility">Facility ID</label>
            <Input
              type="text"
              name="facility"
              id="facility"
              onChange={(e) => setFacilityEntered(e.target.value.length > 0)}
              placeholder="Facility ID"
              className="input min-w-[25vw]"
            />
          </div>
          {facilityEntered && (
            <div className="flex w-[1px] min-w-full gap-2">
              <input
                type="checkbox"
                id="consent"
                name="consent"
                defaultChecked={false}
                className="!border-secondary-foreground accent-accent checked:before:bg-accent shrink-0 !bg-transparent"
              />
              <div className="min-w-0 flex-1 cursor-pointer">
                <label
                  htmlFor="consent"
                  className="cursor-pointer text-sm leading-none font-medium"
                >
                  Agree to participate in FORWARD research program.
                  <p className="text-muted-foreground mt-1 text-sm text-wrap break-words">
                    You agree to the collection of anonymized data concerning
                    how you use this platform.
                  </p>
                </label>
              </div>
            </div>
          )}
          <Button
            aria-label="Create Account"
            type="submit"
            className="button bg-primary text-primary-foreground outline-primary-border w-full outline-1 active:brightness-110"
            variant={"default"}
          >
            Create Account
          </Button>
          {error && (
            <p className="text-error-border text-center w-[1px] min-w-full">{error}</p>
          )}
        </form>
        <p className="text-muted-foreground text-center">
          Already have an account? <br />
          <Link
            prefetch="intent"
            to="/login"
            className="text-blue-500 underline"
          >
            Log In
          </Link>{" "}
          instead
        </p>
      </div>
    </div>
  );
}