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
        console.log(this.toJSON());
        return jwt.sign(this.toJSON(), JWT_SECRET, { expiresIn: TIME_VALID });
    }

    static decode(token: string): Token {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            return Token.fromJSON(decoded);
        } catch (err: any) {
            if (err.name === 'TokenExpiredError') {
                throw new ExpiredTokenError();
            } else {
                throw new InvalidTokenError();
            }
        }
    }
}

export default Token;

export class ExpiredTokenError extends Error {
    constructor() {
        super('Token expired');
        this.name = 'ExpiredTokenError';
    }
}

export class InvalidTokenError extends Error {
    constructor() {
        super('Invalid token');
        this.name = 'InvalidTokenError';
    }
}

export function generateToken(user: User): string {
    return Token.fromUser(user).encode();
}

export function checkToken(req: Request, res: Response, next: any) {

    if (!req.headers.authorization) {
        res.status(401).json({ message: 'Token required' });
        return;
    }

    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded: Token = Token.decode(token);

        // Add the token to the request body
        if (!req.body) {
            req.body = {};
        }
        req.body.token = decoded;

        next();
    } catch (err) {
        if (err instanceof ExpiredTokenError) {
            res.status(401).json({ message: 'Token expired' });
        } else {
            res.status(401).json({ message: 'Invalid token' });
        }
    }
}


