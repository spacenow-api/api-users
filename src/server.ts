import { PORT } from './config';

import App from './App';

import UserController from './controllers/users/user.controller';
import UserLegancyController from './controllers/users/userLegancy.controller';
import AuthenticationController from './controllers/authentication/authentication.controller';

const app = new App(
  [
    new UserController(),
    new UserLegancyController(),
    new AuthenticationController()
  ],
  PORT,
  '0.0.0.0'
);

app.listen();
