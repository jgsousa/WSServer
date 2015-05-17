var nodemailer = require('nodemailer');
var fs = require('fs');

var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: config.emailaccount,
        pass: config.emailpass
    }
});

exports.generatePasscode = function () {
    var base = Math.random() * 10000 - 1;
    var int = Math.floor(base);
    if(int === 10000){
        int = int - 1;
    }
    return int;
};

exports.sendMail = function(user) {
    var text = 'Para o utilizador ' + user.user + ' use o codigo ' + user.passcode + ' para activar a sua aplicacao.';
    transporter.sendMail({
        from: config.emailaccount,
        to: user.email,
        subject: 'Activacao de aplicacao',
        text: text
    }, function (error, response) {
        if (error) {
            console.log(error);
        } else {
            console.log("Message sent to user " + user.user);
        }
    });
};

