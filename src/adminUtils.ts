
import { Request, Response } from 'express';
import Token from './Token';

export function checkAdmin(req: Request, res: Response, next: any) {

    if (!req.headers.authorization) {
        res.status(401).json({ status: 'Unauthorized', message: 'Token required' });
        return;
    }

    const token : Token = Token.decode(req.headers.authorization || '');

    if (!token.isValid()) {
        res.status(401).json({ status: 'Unauthorized', message: 'Token expired' });
        return;
    } else if (token.level < 1) {
        res.status(401).json({ status: 'Unauthorized', message: 'Not authorized' });
        return;
    }

    next();
}
