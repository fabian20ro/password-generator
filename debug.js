import { generatePasswordWithCharset } from './src/password.js';
const pw = generatePasswordWithCharset(10, '🚀✨');
console.log('pw:', pw, 'length:', pw.length, 'chars:', [...pw]);
