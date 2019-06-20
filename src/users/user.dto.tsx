import uuidv1 from 'uuid/v1';
import { IsString, IsEmail } from 'class-validator';

export default class CreateUserDTO {

    @IsString()
    public id: string;

    @IsString()
    public name: string;

    @IsEmail()
    public email: string;

    @IsString()
    public password: string;

    constructor (name:string, email: string, password: string) {
        this.id = uuidv1();
        this.email = email;
        this.name = name;
        this.password = password;
    }

}