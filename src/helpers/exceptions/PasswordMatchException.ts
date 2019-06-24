import HttpException from "./HttpException";
 
class PasswordMatchException extends HttpException {
  constructor() {
    super(400, `Password does not match`);
  }
}
 
export default PasswordMatchException;