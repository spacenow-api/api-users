import { PORT } from "./config";

import App from "./App";

import AuthenticationController from "./controllers/authentication/authentication.controller";
import HealthController from "./controllers/health/health.controller";
import UserController from "./controllers/users/user.controller";
import UserLegancyController from "./controllers/users/userLegancy.controller";

const app = new App(
  [
    new AuthenticationController(),
    new HealthController(),
    new UserController(),
    new UserLegancyController()
  ],
  PORT,
  "0.0.0.0"
);

app.listen();
