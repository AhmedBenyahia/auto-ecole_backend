const mailer = require('nodemailer');
const mailDebuger = require('debug')('app:mail');

// configure the nodemailer
const mailServer = mailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ahmedbenyahiakanansa@gmail.com',
        pass: 'AHMED55312699GG'
    }
});

module.exports = function (to, subject, body) {
    mailDebuger('Debugging mailer');
    const mailOptions = {
        from: 'ahmedbenyahiakanansa@gmail.com', // sender address
        to: to, // list of receivers
        subject: subject, // Subject line
        html: `<p>${body}</p>`// plain text body
    };
    mailServer.sendMail(mailOptions, (err, info) => {
        if (err) mailDebuger("The mail send was failed:" + err);
        else mailDebuger("Mail successful sent" + info);
    });
};
