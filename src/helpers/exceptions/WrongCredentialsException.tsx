import HttpException from "./HttpException";
 
class WrongCredentialsException extends HttpException {
  constructor() {
    super(404, `Wrong Credentials`);
  }
}
 
export default WrongCredentialsException;