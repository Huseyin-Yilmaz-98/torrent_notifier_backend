module.exports.register = (req, res, db, bcrypt) => {
    //create response
    const response = {
        success: false,
        user: {},
        status: ""
    }

    //if email or password or name is missing, return error
    if (!req.body.email || !req.body.password || !req.body.name) {
        response.status = "missing_credential";
        res.status(400).json(response);
        return;
    }

    //get email and password and name from body
    const { password, name } = req.body;
    let email = req.body.email;

    //check if email is string
    if (typeof email !== typeof " ") {
        response.status = "email_no_string";
        res.status(400).json(response);
        return;
    }

    email = email.toLowerCase();

    //check if password is string
    if (typeof password !== typeof " ") {
        response.status = "password_no_string";
        res.status(400).json(response);
        return;
    }

    //check if name is string
    if (typeof name !== typeof " ") {
        response.status = "name_no_string";
        res.status(400).json(response);
        return;
    }

    //check if password length is less than 6 characters
    if (password.length < 6) {
        response.status = "password_too_short";
        res.status(400).json(response);
        return;
    }

    //check if name length is less than 2 characters
    if (name.length < 2) {
        response.status = "name_too_short";
        res.status(400).json(response);
        return;
    }

    //check if email contains @ and .
    const email_split = email.split("@");
    if (email_split.length !== 2 || email_split[0].length === 0 || email_split[1].split(".").length === 1) { //check if email contains @ and .
        response.status = "email_wrong_pattern";
        res.status(400).json(response);
        return;
    }

    //convert password to hash
    const hash = bcrypt.hashSync(password);


    let isRegistered = false;
    //check if email is registered
    db.select("*")
        .from("users")
        .where("email", "=", email)
        .then(data => {
            if (data.length > 0) {
                isRegistered = true;
                response.status = "email_registered";
                res.status(400).json(response);
                
            }
        })
        .catch(err => {
            console.log(err);
            console.log("couldnt check if user exists");
            isRegistered = true;
            response.status = "error_checking";
            res.status(400).json(response);
            
        }).then(() => {
            //if email is not registered, try registering the user
            if (isRegistered === false) {
                const randomCode = Math.floor(100000 + Math.random() * 900000);
                db.insert({
                    email: email,
                    password_hash: hash,
                    joined_date: new Date(),
                    name: name,
                    activation_code: randomCode,
                    is_activated: false
                })
                    .into("users")
                    .then((data) => {
                        db("users")
                            .select("uid", "email", "name", "joined_date")
                            .where("uid", "=", data[0])
                            .then(data => {
                                response.user = data[0];
                                response.success = true;
                                response.status = "OK";
                                req.session.user_id = data[0].uid;
                                res.json(response);
                                
                            })
                    })
                    .catch(err => {
                        console.log(err);
                        response.status = "db_error";
                        res.status(400).json(response);
                        
                    })
            }
        })
}