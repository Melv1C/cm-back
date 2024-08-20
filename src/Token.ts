import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';


import { User } from 'cm-data';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || '';
const TIME_VALID = 24 * 60 * 60 * 1000; // 24 hours

class Token {
    user_id:    number = 0;
    username:   string = '';
    role:       string = '';

    constructor() {
    }

    toJSON(): any {
        return {
            user_id: this.user_id,
            username: this.username,
            role: this.role
        };
    }

    static fromJSON(json: any): Token {
        const token = new Token();
        token.user_id = json.user_id;
        token.username = json.username;
        token.role = json.role;
        return token;
    }

    static fromUser(user: User): Token {
        const token = new Token();
        token.user_id = user.id;
        token.username = user.username;
        token.role = user.role;
        return token;
    }

    encode(): string {
        return jwt.sign(this.toJSON(), JWT_SECRET, { expiresIn: TIME_VALID });
    }

    static decode(token: string): Token | null {
        try {
            const json = jwt.verify(token, JWT_SECRET);
            return Token.fromJSON(json);
        } catch (error) {
            console.error(error);
            return null;
        }
    }
}

export default Token;

export function generateToken(user: User): string {
    return Token.fromUser(user).encode();
}

export function checkToken(req: Request, res: Response, next: any) {

    if (!req.headers.authorization) {
        res.status(401).json({ message: 'Token required' });
        return;
    }

    const token : Token | null = Token.decode(req.headers.authorization || '');

    if (!token) {
        res.status(401).json({ message: 'Invalid token' });
        return;
    }

    req.body.token = token;

    next();
}


