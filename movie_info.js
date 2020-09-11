const fetch = require('node-fetch');
const { JSDOM } = require("jsdom");
const { json } = require('express');

const get_script = (body => {
    const dom = new JSDOM(body);
    const scripts = dom.window.document.querySelectorAll('script');
    for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].textContent.indexOf("\"name\":") !== -1) {
            return scripts[i].textContent;
        }
    }
    return "";
});

//adds movie to the database
const add_to_database = (response, db, movie_id) => {
    db.insert({
        tid: movie_id,
        name: response.movie_info.name,
        sum: response.movie_info.sum,
        rating: response.movie_info.rating,
        year: response.movie_info.year,
        poster: response.movie_info.poster,
        type: response.movie_info.type,
        added_date: new Date()
    })
        .into("titles")
        .then(() => {
            console.log("added " + movie_id);
        })
        .catch((err) => {
            console.log(err);
        })
}

module.exports.movie_info = (req, res, db) => {
    //create response
    const response = {
        success: false,
        movie_info: {},
        status: "",
        formats: []
    }

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


    //get movie_id from body
    const { movie_id } = req.body;


    //check if movie_id is string
    if (typeof movie_id !== typeof "") {
        response.status = "movie_id_no_string";
        res.status(400).json(response);
        return;
    }

    //check if movie_id pattern is valid
    if (!/tt[0-9]*/.test(movie_id)) {
        response.status = "parsing_error";
        res.status(400).json(response);
        return;
    }




    let isSuccessful = false;
    db.select("*")
        .from("titles")
        .where("tid", "=", movie_id)
        .then(data => {
            if (data.length > 0) {
                response.movie_info.movie_id = movie_id;
                response.movie_info.name = data[0].name;
                response.movie_info.sum = data[0].sum;
                response.movie_info.rating = data[0].rating;
                response.movie_info.year = data[0].year;
                response.movie_info.poster = data[0].poster;
                response.movie_info.type = data[0].type;
                isSuccessful = true;
                console.log("from database");
                response.status = "OK";
                response.success = true;
                db.select("*")
                    .from("versions")
                    .orderBy("level", "desc")
                    .then(formats => {
                        response.formats = formats;
                        res.json(response);

                    })
            }
            else {
                const url = "https://www.imdb.com/title/" + movie_id;
                fetch(url)
                    .then(res => res.text())
                    .then(body => {
                        const sj = get_script(body);
                        if (sj.length === 0) {
                            response.status = "parsing_error";
                            res.status(400).json(response);

                        }
                        else {
                            movie_info = JSON.parse(sj);
                            response.movie_info.movie_id = movie_id;
                            response.movie_info.name = movie_info.name ? movie_info.name : "-";
                            response.movie_info.sum = movie_info.description ? movie_info.description : "-";
                            response.movie_info.rating = movie_info.aggregateRating ? (movie_info.aggregateRating.ratingValue ? movie_info.aggregateRating.ratingValue : "-") : "-";
                            response.movie_info.year = movie_info.datePublished ? movie_info.datePublished.split("-")[0] : "0000";
                            response.movie_info.poster = movie_info.image ? movie_info.image : "-";
                            response.movie_info.type = movie_info["@type"] ? movie_info["@type"] : "-";
                            isSuccessful = true;
                        }
                    })
                    .then(() => {
                        if (isSuccessful) {
                            add_to_database(response, db, movie_id);
                            response.status = "OK";
                            response.success = true;
                            db.select("*")
                                .from("versions")
                                .orderBy("level", "desc")
                                .then(formats => {
                                    response.formats = formats;
                                    res.json(response);

                                })
                        }
                    })
                    .catch(() => {
                        response.status = "parsing_error";
                        res.status(400).json(response);
                    })
            }
        })
        .catch(err => {
            response.status = "db_error";
            res.status(400).json(response);

        });
}