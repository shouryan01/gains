import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { rootRoute } from "./routes/__root";
import { trainRoute } from "./routes/train";
import { progressRoute } from "./routes/progress";
import { homeRoute } from "./routes/index";
import { routinesRoute } from "./routes/routines";
import { workoutRoute } from "./routes/workout";
import { exercisesRoute } from "./routes/exercises";
import { nutritionRoute } from "./routes/nutrition";
import { analyticsRoute } from "./routes/analytics";
import { settingsRoute } from "./routes/settings";
import "./styles/app.css";
const router = createRouter({
  routeTree: rootRoute.addChildren([
    homeRoute,
    trainRoute,
    progressRoute,
    routinesRoute,
    workoutRoute,
    exercisesRoute,
    nutritionRoute,
    analyticsRoute,
    settingsRoute,
  ]),
  defaultPreload: "intent",
  scrollRestoration: true,
});
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
