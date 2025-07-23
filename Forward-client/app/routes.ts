import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/home.tsx"),
    route("login", "routes/login.tsx"),
    route("register", "routes/register.tsx"),
    layout("routes/protected/protected.tsx", [
      route("dashboard", "routes/protected/dashboard.tsx"),
      route("account", "routes/protected/account.tsx"),
      route("lesson/:lessonId", "routes/protected/lesson.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
