const nodemailer = require('nodemailer');

// Create a reusable transporter object
const transporter = nodemailer.createTransport({
    service: 'gmail',
    secure: true,
    port: 465,
    auth: {
        // user: 'santoshkumarsharmabagda@gmail.com',  // Your email
        // pass: 'ihqt onaj jspt ahgq',     
        user: 'rajatsinghrajawatrajawat@gmail.com',
        pass: 'zbhb wkdp mdin izfm'
    },
});

// Common function to send emails
const sendEmail = async (to, subject, text, html = null) => {
    try {
        // ✅ ensure valid recipients
        if (!to || (Array.isArray(to) && to.length === 0)) {
            throw new Error("No recipients provided");
        }

        const mailOptions = {
            from: 'rajatsinghrajawatrajawat@gmail.com',
            to: Array.isArray(to) ? to.join(',') : to, // ✅ fix here
            subject,
            text,
            html: html || text,
        };

        console.log("Sending to:", mailOptions.to); // ✅ debug

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return info;

    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

// Example usage
module.exports = sendEmail;

