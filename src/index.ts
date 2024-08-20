
import MySQL from "./mysql";
export { MySQL }

import Token, {generateToken, checkToken} from "./Token";
export { Token, generateToken, checkToken }

// import { User } from "cm-data";
// import bcrypt from 'bcryptjs';

// MySQL.init();
// async function test() {

//     // get the admin
//     const admin: User = User.fromJson((await MySQL.query('SELECT * FROM users WHERE username = ?', ['admin']))[0]);

//     // generate a token for the admin
//     const token = generateToken(admin);
//     console.log('token:', token);

//     // decode the token
//     const decoded = Token.decode(token);
//     console.log('decoded:', decoded);


//     // check the token
//     const req: any = { headers: { authorization: `Bearer ${token}` } };
//     const res: any = { status: (code: number) => ({ json: (data: any) => console.log(data) }) };
//     const next = () => console.log('next');
//     checkToken(req, res, next);
// }

// test();