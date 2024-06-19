import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-password'
    }
});

const sendEmail = (mailProps) => {
    console.log(mailProps);
    const mailOptions = {
        from: 'your-email@gmail.com',
        to: mailProps.to,
        subject: mailProps.subject,
        text: mailProps.text
    };
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                reject(error);
            } else {
                resolve(info);
            }
        });
    });
};

export { sendEmail };



// import nodemailer from 'nodemailer';

// const transporter = nodemailer.createTransport({
//     host: 'smtp.mail.yahoo.com',
//     port: 465, secure: true, service: 'yahoo',
//     auth: {
//         user: 'asdf', pass: 'lkj'
//     }
// });

// const sendEmail = (mailProps) => {
//     const mailOptions = {
//         from: 'asdf@yahoo.com',
//         to: mailProps.to,
//         subject: mailProps.subject,
//         text: mailProps.text
//     };
//     return new Promise((resolve, reject) => {
//         try {
//             const success =
//                 transporter.sendMail(mailOptions);
//             resolve(success);
//         }
//         catch (error) {
//             reject(error);
//         }
//     });
// };
// export { sendEmail };