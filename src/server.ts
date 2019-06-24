import App from './App';
import UserController from './users/user.controller';
import AuthenticationController from './authentication/authentication.controller';
 
const app = new App([
    new UserController(),
    new AuthenticationController()
  ],
  3001,
  '0.0.0.0'
);
 
app.listen();