import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "FORWARD" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return <p>Hello</p>;
}
