const nodemailer =  require('nodemailer');

// https://www.freecodecamp.org/news/use-nodemailer-to-send-emails-from-your-node-js-server/
// https://console.cloud.google.com/apis/credentials?project=startup-map-383914&supportedpurview=project
//https://developers.google.com/oauthplayground/?code=4/0AVHEtk5OA-GwLTXBJmlzpmdR933ueMyqVf761rKtpxBNmfc_8z5x8CNJi4h_Gpcivn1sgw&scope=https://mail.google.com/
let transporter = nodemailer.createTransport({
    service: 'gmail',
    port:12,
    auth: {
        type: 'OAuth2',
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
        clientId: process.env.OAUTH_CLIENTID,
        clientSecret: process.env.OAUTH_CLIENT_SECRET,
        refreshToken: process.env.OAUTH_REFRESH_TOKEN
    }
});

//return promise
module.exports.Send = (emailTo,title,content) => {
    return new Promise((resolve, reject) => {
        var mailOptions = {
            from: 'Startup Map',
            to: emailTo,
            subject: title,
            text: content,
            // html: '<b>Hey there! </b><br> This is our first message sent with Nodemailer'
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log("error is " + error);
                resolve(false); // or use rejcet(false) but then you will have to handle errors
            }
            else {
                // console.log('Message sent: %s', info.messageId);
                resolve(true);
            }
        });

    });
}