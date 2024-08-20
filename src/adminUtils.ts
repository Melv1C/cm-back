
import { Request, Response } from 'express';
import Token from './Token';

export function checkAdmin(req: Request, res: Response, next: any) {
    const token : Token = new Token();
    token.decode(req.headers.authorization || '');

    if (!token.isValid()) {
        res.status(401).json({ status: 'Unauthorized', message: 'Token expired' });
        return;
    } else if (token.level < 1) {
        res.status(401).json({ status: 'Unauthorized', message: 'Not authorized' });
        return;
    }

    next();
}
