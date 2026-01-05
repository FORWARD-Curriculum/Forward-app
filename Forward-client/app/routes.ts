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
    route("youth", "routes/youth.tsx"),
    route("faq", "routes/faq.tsx"),
    route("help", "routes/help.tsx"),
    route("supportersOfYouth", "routes/supportersOfYouth.tsx"),
    route("lesson/:lessonId", "routes/protected/lesson.tsx"),
    route("dashboard", "routes/protected/dashboard.tsx"),
    layout("routes/protected/protected.tsx", [
      // route("dashboard", "routes/protected/dashboard.tsx"),
      route("account", "routes/protected/account.tsx"),
      route("survey","routes/protected/survey.tsx"),
      // route("lesson/:lessonId", "routes/protected/lesson.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
