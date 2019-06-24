interface TokenData {
  token: string;
  expiresIn: number;
}

interface DataStoredInToken {
  id: string;
}

export { TokenData as default, DataStoredInToken }
