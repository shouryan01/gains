import { createRoute, redirect } from "@tanstack/react-router";
import { rootRoute } from "./__root";
export const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/analytics",
  beforeLoad: () => {
    throw redirect({ to: "/progress", replace: true });
  },
});
