import { PORT } from "./config";

import App from "./App";

import AuthenticationController from "./controllers/authentication/authentication.controller";
import HealthController from "./controllers/health/health.controller";
import UserLegacyController from "./controllers/users/userLegacy.controller";
import PaymentController from "./controllers/payment/payment.controller";

const app = new App(
  [
    new AuthenticationController(),
    new HealthController(),
    new UserLegacyController(),
    new PaymentController()
  ],
  PORT,
  "0.0.0.0"
);

app.listen();
