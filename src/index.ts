
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
//     setTimeout(() => {
//         console.log('decoding token...');
//         try {
//             const decoded = Token.decode(token);
//             console.log('decoded:', decoded);
//         } catch (err: any) {
//             console.error(err.message);
//         }
//     }, 2000);
// }

// test();