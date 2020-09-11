const nodemailer = require('nodemailer');
const info = require("./info.json");

const transporter = nodemailer.createTransport({
    host: 'smtp.yandex.ru',
    port: 465,
    auth: {
        user: info["email-username"],
        pass: info["email-password"]
    },
    secure: true
});


module.exports.forgot_password = (req, res, db) => {

    //create response
    const response = {
        success: false,
        status: ""
    }

    //if email is missing, return error
    if (!req.body.email) {
        response.status = "missing_credential";
        res.status(400).json(response);
        return;
    }

    //get email from body
    const { email } = req.body;

    //check if email is string
    if (typeof email !== typeof "") {
        response.status = "email_no_string";
        res.status(400).json(response);
        return;
    }


    //define a variable for user match
    let isUserFound = false;
    let user_id = null;

    db.select("*")
        .from("users")
        .where("email", "=", email)
        .then(data => {
            if (data.length > 0) {
                isUserFound = true;
                user_id = data[0].uid;
            }
            else {
                response.status = "invalid_credentials";
                res.status(400).json(response);
                
            }
        })
        .catch(err => {
            console.log(err);
            response.status = "db_error";
            res.status(400).json(response);
            
        })
        .then(() => {
            if (isUserFound && user_id !== null) {
                db("pw_reset_requests")
                    .where("uid", "=", user_id)
                    .del()
                    .catch(err => console.log("couldnt delete"))
                    .finally(() => {
                        const randomCode = Math.floor(100000 + Math.random() * 900000);
                        db.insert({
                            code: randomCode.toString(),
                            uid: user_id,
                            created_at: new Date(),
                            is_used: false
                        })
                            .into("pw_reset_requests")
                            .then(() => {
                                const url = new URL("/reset_password", info["frontend-address"]);
                                url.searchParams.append("email", email);
                                url.searchParams.append("code", randomCode.toString());
                                const mailOptions = {
                                    from: info["email-username"],
                                    to: email,
                                    subject: 'Forgot Password',
                                    text: url.href
                                };
                                transporter.sendMail(mailOptions, (error, info) => {
                                    if (error) {
                                        console.log(error);
                                        response.status = "mail_not_sent";
                                        res.status(400).json(response);
                                        
                                    } else {
                                        console.log("Sent " + info.response);
                                        response.status = "OK";
                                        response.success = true;
                                        res.json(response);
                                        
                                    }
                                });
                            })
                    })
            }
        })
}