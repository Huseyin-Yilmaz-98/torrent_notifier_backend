const fetch = require('node-fetch');
const { JSDOM } = require("jsdom");
const { json } = require('express');

const get_script = (body => {
    const dom = new JSDOM(body);
    let sj = "";
    const scripts = dom.window.document.querySelectorAll('script');
    for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].textContent.indexOf("\"name\":") !== -1) {
            sj = scripts[i].textContent;
            break;
        }
    }
    return sj;
});

//adds movie to the database
const add_to_database = (response, db, movie_id) => {
    db.insert({
        mid: movie_id,
        mname: response.movie_info.name,
        msum: response.movie_info.sum,
        mrating: response.movie_info.rating,
        myear: response.movie_info.year,
        mposter: response.movie_info.poster,
        mtype: response.movie_info.type,
        added_date: new Date()
    })
        .into("movies")
        .then(() => {
            console.log("added " + movie_id);
        })
        .catch((err) => {
            console.log(err);
        })
}

module.exports.movie_info = (req, res, dbinfo, knex) => {
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


    //get email and id and movie_id from body
    const { movie_id } = req.body;


    //check if movie_id is string
    if (typeof movie_id !== typeof "") {
        response.status = "movie_id_no_string";
        res.status(400).json(response);
        return;
    }

    //connect to database
    const db = knex(dbinfo);


    let isSuccessful = false;
    db.select("*")
        .from("movies")
        .where("mid", "=", movie_id)
        .then(data => {
            if (data.length > 0) {
                response.movie_info.movie_id = movie_id;
                response.movie_info.name = data[0].mname;
                response.movie_info.sum = data[0].msum;
                response.movie_info.rating = data[0].mrating;
                response.movie_info.year = data[0].myear;
                response.movie_info.poster = data[0].mposter;
                response.movie_info.type = data[0].mtype;
                isSuccessful = true;
                console.log("from database");
                response.status = "OK";
                response.success = true;
                db.select("*")
                    .from("releases")
                    .then(formats => {
                        response.formats = formats;
                        res.json(response);
                        db.destroy();
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
                            db.destroy();
                        }
                        else {
                            movie_info = JSON.parse(sj);
                            response.movie_info.movie_id = movie_id;
                            response.movie_info.name = movie_info.name ? movie_info.name : "-";
                            response.movie_info.sum = movie_info.description ? movie_info.description : "-";
                            response.movie_info.rating = movie_info.aggregateRating ? (movie_info.aggregateRating.ratingValue ? movie_info.aggregateRating.ratingValue : "-") : "-";
                            response.movie_info.year = movie_info.datePublished ? movie_info.datePublished.split("-")[0] : "-1";
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
                                .from("releases")
                                .then(formats => {
                                    response.formats = formats;
                                    res.json(response);
                                    db.destroy();
                                })
                        }
                    });
            }
        })
        .catch(err => {
            response.status = "fetch_error";
            res.status(400).json(response);
            db.destroy();
        });
}