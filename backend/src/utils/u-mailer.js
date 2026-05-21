import nodemailer from 'nodemailer';
import 'dotenv/config';

//La parte de mailtrap es quien envía el correo
const mailConfig = {
    host: process.env.MAIL_HOST || 'sandbox.smtp.mailtrap.io',
    port: process.env.MAIL_PORT || 2525,
    auth: {
        user: process.env.MAIL_USER, // Usuario de Mailtrap
        pass: process.env.MAIL_PASS  // Password de Mailtrap
    }
};

if (!mailConfig.auth.user || !mailConfig.auth.pass) {
    console.warn("ADVERTENCIA: Credenciales de Mailtrap no configuradas en .env. El envío de correos fallará.");
}

export const transporter = nodemailer.createTransport(mailConfig);