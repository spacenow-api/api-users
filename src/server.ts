import App from './App';
import UserController from './controllers/users/user.controller';
import AuthenticationController from './controllers/authentication/authentication.controller';
 
const app = new App([
    new UserController(),
    new AuthenticationController()
  ],
  3001,
  '0.0.0.0'
);
 
app.listen();