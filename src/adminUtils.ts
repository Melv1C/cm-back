
import { Request, Response } from 'express';
import Token from './Token';

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
