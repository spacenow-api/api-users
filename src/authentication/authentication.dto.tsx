import { IsString, IsEmail } from 'class-validator';

export default class CreateLoginDTO {

    @IsEmail()
    public email: string;

    @IsString()
    public password: string;

    constructor (email: string, password: string) {
        this.email = email
        this.password = password;
    }

}