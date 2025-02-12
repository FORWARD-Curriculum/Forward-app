import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useState } from "react";
import { useAuth } from "@/lib/useAuth";

export default function Login() {
    const [error, setError] = useState(null);
    const [instructor, setInstructor] = useState(false);

    const handleSubmit = async (e: any) => {
        const login = useAuth().login;
        e.preventDefault();



        const formData = new FormData(e.target);
        const data = {
            username: formData.get('username'),
            password: formData.get('password'),
            password_confirm: formData.get('password2'),
            email: formData.get('email'),
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            iid: formData.get('institution'),
        };

        const password = formData.get("password") as string;
        const confirmPassword = formData.get("password2") as string;

        if (password !== confirmPassword) {
            try { throw new Error("Passwords do not match."); } catch (err: any) {
                setError(err.message);
            }
            return;
        }

        try {
            /* TODO: change api domain*/
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Failed to login');
            }

            (response: {
                message: string;
                user: {
                    id: string;
                    username: string;
                    firstName: string;
                    lastName: string;
                };
            }) => {
                login(response.user);
            }

            // Redirect to the dashboard on success
            window.location.href = '/dashboard';
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="flex justify-center items-center w-screen">
            <div className="bg-white rounded-3xl w-fit p-6 flex flex-col items-center">
                <h1 className="text-xl font-medium">Create an account</h1>
                <form onSubmit={handleSubmit} className="flex flex-col gap-5 my-6">
                    <div className="flex gap-2">
                        <div>
                            <label htmlFor="first_name">First Name</label>
                            <Input
                                type="text"
                                name="first_name"
                                id="first_name"
                                placeholder="ex: Jane"
                                className="input"
                                required
                            /></div>
                        <div>
                            <label htmlFor="last_name">Last Name</label>
                            <Input
                                type="text"
                                name="last_name"
                                id="last_name"
                                placeholder="ex: Smith"
                                className="input"
                                required
                            /></div>
                    </div>
                    <div>
                        <label htmlFor="username">Username</label>
                        <Input
                            type="text"
                            name="username"
                            id="username"
                            placeholder="ex: jsmith"
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
                    <div>
                        <label htmlFor="password">Confirm Password</label>
                        <PasswordInput
                            name="password2"
                            id="password2"
                            placeholder="Password"
                            className="input"
                            disabled={false}
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
                            required
                        />
                    </div>
                    {instructor &&
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
                        </div>}
                    <div className="flex gap-2">
                        {!instructor &&
                            <Button variant={"outline"} className="px-4" onClick={() => { setInstructor(true) }}>
                                I am an instructor
                            </Button>}
                        <Button type="submit" className="button w-full bg-cyan-500 text-white" variant={"outline"}>
                            Create Account
                        </Button>
                    </div>
                    {error && <p className="text-red-500 w-full text-center">{error}</p>}
                </form>
                <p className="text-center text-gray-400">Already have an account? <br /><a href="/login">Log In</a> instead</p>
            </div>
        </div>
    );
};
//     