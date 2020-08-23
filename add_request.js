module.exports.add_request = (req, res, dbinfo, knex) => {

    //create response
    const response = {
        success: false,
        status: ""
    }

    //if user id not in cookies, return error
    if (!req.session.user_id) {
        response.status = "not_signed_in";
        res.status(400).json(response);
        return;
    }

    //if movie_id is missing, return error
    if (!req.body.movie_id) {
        response.status = "movie_id_missing";
        res.status(400).json(response);
        return;
    }

    //if formats is missing, return error
    if (!req.body.formats) {
        response.status = "formats_missing";
        res.status(400).json(response);
        return;
    }

    //get formats and movie_id from body
    const { formats, movie_id } = req.body;

    //get user id from cookies
    const id = req.session.user_id;

    //check if movie_id is string
    if (typeof movie_id !== typeof "") {
        response.status = "movie_id_no_string";
        res.status(400).json(response);
        return;
    }

    //check if formats is list
    if (typeof formats !== typeof ["a", 5]) {
        response.status = "formats_not_list";
        res.status(400).json(response);
        return;
    }

    //check if any formats selected
    if (formats.length === 0) {
        response.status = "no_formats_selected";
        res.status(400).json(response);
        return;
    }

    //connect to database
    const db = knex(dbinfo);

    //define variable for movie match
    let isMovieFound = false;

    //get the movie from database
    db.select("*")
        .from("movies")
        .where("mid", "=", movie_id)
        .then(data => {
            if (data.length > 0) { //check if movie is in the database
                isMovieFound = true;
            }
            else { //if the movie is not found, return error
                response.status = "invalid_movie_id";
                res.status(400).json(response);
                db.destroy();
            }
        })
        //if something goes wrong, return error
        .catch(err => {
            console.log(err);
            response.status = "db_error";
            res.status(400).json(response);
            db.destroy();
        })
        .then(() => {
            if (isMovieFound) { //if the movie is found in the database, delete all previous requests for this movie from this user
                db("requests")
                    .where("uid", "=", id)
                    .andWhere("mid", "=", movie_id)
                    .del()
                    .then(data => {
                        console.log(data + " silindi");
                    })
                    .then(() => {
                        //add all request entries to a list
                        const toAdd = [];
                        formats.forEach(element => {
                            toAdd.push({
                                rid: element,
                                mid: movie_id,
                                uid: id,
                                r_added_date: new Date()
                            });
                        });
                        //insert all requests to database
                        db.insert(toAdd)
                            .into("requests")
                            .then(() => {
                                //if all went right, respond with success
                                response.success = true;
                                response.status = "OK";
                                res.json(response);
                                db.destroy();
                            })
                            .catch((err) => {
                                //if an error occured while inserting requests, respond with error
                                console.log(err);
                                response.status = "error_inserting";
                                res.status(400).json(response);
                                db.destroy();
                            })
                    })
            }
            else {
                //if the movie is not found in the database, return an error
                response.status = "movie_not_in_database";
                res.status(400).json(response);
                db.destroy();
            }
        })

}