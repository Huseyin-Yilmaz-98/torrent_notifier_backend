module.exports.login = (req, res, dbinfo, knex, bcrypt) => {
    //create response
    const response = {
        success: false,
        user: {},
        status: ""
    }

    //if email or password is missing, return error
    if (!req.body.email || !req.body.password) {
        response.status = "missing_credential";
        res.status(400).json(response);
        return;
    }

    //get email and password from body
    const { password } = req.body;
    let email = req.body.email;

    //check if email is string
    if (typeof email !== typeof "") {
        response.status = "email_no_string";
        res.status(400).json(response);
        return;
    }
    email = email.toLowerCase();

    //check if password is string
    if (typeof password !== typeof "") {
        response.status = "password_no_string";
        res.status(400).json(response);
        return;
    }

    //connect to database
    const db = knex(dbinfo);

    //check if user credentials match
    db.select("*")
        .from("users")
        .where("email", "=", email)
        .then(data => {
            if (data.length === 0) {
                response.status = "email_not_registered";
                res.status(400).json(response);
                db.destroy();
            }
            else {
                if (bcrypt.compareSync(password, data[0].password_hash)) {
                    response.user = {
                        id: data[0].uid,
                        email: data[0].email,
                        joined_date: data[0].joined_date,
                        name: data[0].name
                    };
                    response.status = "OK";
                    response.success = true;
                    req.session.user_id = data[0].uid;
                    res.json(response);
                    db.destroy();
                }
                else {
                    response.status = "wrong_password";
                    res.json(response);
                    db.destroy();
                }
            }
        }).catch(err => {
            console.log(err);
            response.status = "db_error";
            res.status(400).json(response);
            db.destroy();
        })
}