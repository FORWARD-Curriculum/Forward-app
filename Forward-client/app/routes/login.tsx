import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useState } from "react";

export default function Login() {
    const [error, setError] = useState(null);
    const handleSubmit = async (e: any) => {

        e.preventDefault(); // Prevent the default form submission behavior

        const formData = new FormData(e.target);
        const data = {
            username: formData.get('username'),
            password: formData.get('password'),
        };

        try {
            /* TODO: change api domain*/
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Failed to login');
            }

            // Redirect to the dashboard on success
            window.location.href = '/dashboard';
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
                /></div>
                <div><label htmlFor="password">Password</label>
                <PasswordInput
                    name="password"
                    id="password"
                    placeholder="Password"
                    className="input"
                    disabled={false}
                /></div>
                <Button type="submit" className="button w-full bg-cyan-500 text-white" variant={"outline"}>
                    Login
                </Button>
                {error && <p className="text-red-500 w-full text-center">{error}</p>}
            </form>
            <p className="text-center text-gray-400">Don't have an account? <br/><a href="/register">Sign Up</a> instead</p>
        </div>
        </div>
    );
};
//    const [instructor, setInstructor] = useState(false); {instructor?<Button onClick={()=>{setInstructor(true)}}>I am an instructor</Button>:<></>}