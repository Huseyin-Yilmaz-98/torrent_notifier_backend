module.exports.add_request = (req, res, db) => {

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
        res.status(400).json(response); xerip
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

    //check if formats is an array
    if (!Array.isArray(formats)) {
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


    //define variable for movie match
    let isMovieFound = false;

    //initial season and episode info is set to -1 which means no season or episode is selected
    let season = -1;
    let episode = -1;

    //get the movie from database
    db.select("*")
        .from("titles")
        .where("tid", "=", movie_id)
        .then(data => {
            if (data.length > 0) { //check if movie is in the database
                isMovieFound = true;
                //if title is a tv series, check season and episode info, they can be an integer from 0 to 99, -1 means no selection
                if (data[0].type === "TVSeries" && req.body.season && typeof req.body.season === typeof "" && req.body.episode && typeof req.body.episode === typeof "") {
                    const episodeNumber = parseInt(req.body.episode);
                    const seasonNumber = parseInt(req.body.season);
                    if (seasonNumber !== NaN && seasonNumber > -1 && seasonNumber < 100) {
                        season = seasonNumber;
                        //only in the event that a season info is provided, episode selection will be put into consideration
                        if (episodeNumber !== NaN && episodeNumber > -1 && episodeNumber < 100) { 
                            episode = episodeNumber;
                        }
                    }
                }
            }
            else { //if the movie is not found, return error
                response.status = "invalid_movie_id";
                res.status(400).json(response);
            }
        })
        //if something goes wrong, return error
        .catch(err => {
            console.log(err);
            response.status = "db_error";
            res.status(400).json(response);
            
        })
        .then(() => {
            if (isMovieFound) { //if the movie is found in the database, delete all previous requests for this title, episode and season from this user
                db("requests")
                    .where("uid", "=", id)
                    .andWhere("tid", "=", movie_id)
                    .andWhere("season", "=", season)
                    .andWhere("episode", "=", episode)
                    .del()
                    .then(data => {
                        console.log(data + " deleted");
                    })
                    .then(() => {
                        //add all request entries to a list
                        const toAdd = formats.map(element => {
                            return ({
                                vid: element,
                                tid: movie_id,
                                uid: id,
                                added_date: new Date(),
                                season: season,
                                episode: episode
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
                            })
                            .catch((err) => {
                                //if an error occured while inserting requests, respond with error
                                console.log(err);
                                response.status = "error_inserting";
                                res.status(400).json(response);
                            })
                    })
            }
            else {
                //if the movie is not found in the database, return an error
                response.status = "movie_not_in_database";
                res.status(400).json(response);
            }
        })

}