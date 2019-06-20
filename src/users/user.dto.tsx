import uuidv4 from 'uuid/v4';
import { IsString, IsEmail, IsBoolean } from 'class-validator';

export default class CreateUserDTO {

    @IsString()
    public id: string;

    @IsBoolean()
    public emailConfirmed: string;

    @IsEmail()
    public email: string;

    @IsString()
    public password: string;

    constructor (emailConfirmed:string, email: string, password: string) {
        this.id = uuidv4();
        this.email = email;
        this.emailConfirmed = emailConfirmed;
        this.password = password;
    }

}