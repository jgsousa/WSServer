var nodemailer = require('nodemailer');
var fs = require('fs');

var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    service: 'Yahoo',
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
    console.log("User:" + user.user);
    console.log("Email:" + user.email);
    console.log("Passcode:" + user.passcode);
    transporter.sendMail({
        from: 'jgsousa81@yahoo.com',
        to: 'asousa.joao@gmail.com',
        subject: 'Olá',
        text: 'Teste de envio de password para mobilidade.'
    }, function (error, response) {
        if (error) {
            console.log(error);
        } else {
            console.log("Message sent: " + response.message);
        }
    });
};

