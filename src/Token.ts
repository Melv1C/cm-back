import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || '';
const TIME_VALID = 3600000;

class Token {
    user: string = '';
    email: string = '';
    password: string = '';
    active: boolean = true;
    expire_at: Date = new Date(Date.now() + TIME_VALID);

    [key: string]: any; // to allow any other property

    constructor() {
    }

    fromJSON(json: any): void {
        for (const key in json) {
            if (this.hasOwnProperty(key)) {
                this[key] = json[key];
            }
        }
    }

    toJSON(): any {
        const json: any = {};
        for (const key in this) {
            if (this.hasOwnProperty(key) && typeof this[key] !== 'function') {
                json[key] = this[key];
            }
        }
        return json;
    }

    encode(): string {
        this.expire_at = new Date(Date.now() + TIME_VALID);
        return jwt.sign(this.toJSON(), process.env.JWT_SECRET || '', { expiresIn: TIME_VALID });
    }

    decode(token: string): Token {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || '');
        this.fromJSON(decoded);
        return this;
    }

    isValid(): boolean {
        return this.expire_at.getTime() > Date.now();
    }

    isAdmin(): boolean {
        return this.user === 'admin';
    }
}

export default Token;

export function generateToken(user: string, email: string, password: string): string {
    const token = new Token();
    token.user = user;
    token.email = email;
    token.password = password;
    return token.encode();
}

