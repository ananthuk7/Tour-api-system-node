const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  //1 Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    //Activate in gmail "less secure app" option
  });
  //2 create email options
  const mailOptions = {
    from: 'Ananthu Krishnan <ananthuk.krish@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html: options.html,
  };
  //3 send the mail
  await transporter.sendMail(mailOptions);
};
module.exports = sendEmail;
