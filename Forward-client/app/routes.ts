import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
    layout("./layout.tsx",[
        index("routes/home.tsx"),
        route("login", "routes/login.tsx"),
        route("register", "routes/register.tsx"),
        layout("protected.tsx", [
            route("dashboard", "routes/dashboard.tsx"),
            route("account", "routes/account.tsx")
        ]),
    ]),
    
] satisfies RouteConfig;
