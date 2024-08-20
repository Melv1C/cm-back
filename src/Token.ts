import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || '';
const TIME_VALID = 3600000;

class Token {
    user: string = '';
    password: string = '';
    level: number = 0;
    expire_at: Date = new Date(Date.now() + TIME_VALID);

    [key: string]: any; // to allow any other property

    constructor() {
    }

    toJSON(): any {
        return {
            user: this.user,
            password: this.password,
            level: this.level,
            expire_at: this.expire_at.toISOString()
        };
    }

    static fromJSON(json: any): Token {
        const token = new Token();
        token.user = json.user;
        token.password = json.password;
        token.level = json.level;
        token.expire_at = new Date(json.expire_at);
        return token;
    }

    encode(): string {
        this.expire_at = new Date(Date.now() + TIME_VALID);
        return jwt.sign(this.toJSON(), JWT_SECRET, { expiresIn: TIME_VALID });
    }

    static decode(token: string): Token {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        return Token.fromJSON(decoded);       
    }

    isValid(): boolean {
        return this.expire_at.getTime() > Date.now();
    }
}

export default Token;

export function generateToken(user: string, password: string, level: number): string {
    const token = new Token();
    token.user = user;
    token.password = password;
    token.level = level;
    return token.encode();
}

