const nodemailer = require('nodemailer');
const pug = require('pug');
const { fromString } = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Ananthu Krishnan <${process.env.EMAIL_ADDRESS}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USER,
          pass: process.env.SENDGRID_PASS,
        },
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  //Send the actual mail
  async send(template, subject) {
    //render the html
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );
    //definr email options
    const mailOptions = {
      from:
        process.env.NODE_ENV !== 'production'
          ? this.from
          : process.env.EMAIL_ADDRESS,
      to: this.to,
      subject: subject,
      html: html,
      text: fromString(html),
    };
    //await transporter.sendMail(mailOptions);
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'welcome to the natours family');
  }

  async resetPassword() {
    await this.send('resetPassword', 'reset your password');
  }
};

// const sendEmail = async (options) => {
//1 Create a transporter
// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: process.env.EMAIL_PORT,
//   auth: {
//     user: process.env.EMAIL_USERNAME,
//     pass: process.env.EMAIL_PASSWORD,
//   },
//Activate in gmail "less secure app" option
// });
//2 create email options
// const mailOptions = {
//   from: 'Ananthu Krishnan <ananthuk.krish@gmail.com>',
//   to: options.email,
//   subject: options.subject,
//   text: options.message,
//   // html: options.html,
// };
//3 send the mail
//   await transporter.sendMail(mailOptions);
// };
