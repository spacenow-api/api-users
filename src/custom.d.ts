declare namespace Express {
  export interface Request {
    userIdDecoded?: string
  }
  export interface User {
    id?: string
    type?: string
  }
}