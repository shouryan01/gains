import { createRoute, redirect } from "@tanstack/react-router";
import { rootRoute } from "./__root";
export const workoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/workout",
  beforeLoad: () => {
    throw redirect({ to: "/train", replace: true });
  },
});
