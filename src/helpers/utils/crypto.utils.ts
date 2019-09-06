import crypto from 'crypto';

const RAND_KEY: string = '7b039413c125fa35dd792f4966eb7379';

const RAND_IV: string = 'a1b9f3f591c5f30e';

class CryptoUtils {

  private algorithm = 'aes-128-cbc';

  private key = Buffer.from(RAND_KEY, 'hex');

  public encrypt(value: string) {
    const cipher = crypto.createCipheriv(this.algorithm, this.key, RAND_IV);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  public decrypt(hash: string) {
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, RAND_IV);
    let decrypted = decipher.update(hash, 'hex', 'utf8');
    decrypted += decipher.final();
    return decrypted;
  }
}

export default CryptoUtils;