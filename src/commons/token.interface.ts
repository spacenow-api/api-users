interface TokenData {
  token: string;
  expiresIn: number;
}

interface DataStoredInToken {
  id: string;
  role: string;
}

export { TokenData as default, DataStoredInToken };
