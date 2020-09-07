const fetch = require('node-fetch');
const { changed_letters } = require("./changed_letters");

module.exports.get_suggestions = (req, res) => {
    //create response
    const response = {
        status: "OK",
        suggestions: []
    }

    if (!req.session.user_id) {
        response.status = "not_signed_in";
        res.status(400).json(response);
        return;
    }

    //if text is missing, return error
    if (!req.body.text) {
        response.status = "no_text";
        res.status(400).json(response);
        return;
    }

    //get email from body
    let { text } = req.body;

    //check if text is string
    if (typeof text !== typeof "") {
        response.status = "text_no_string";
        res.status(400).json(response);
        return;
    }

    changed_letters.forEach(element => {
        text = text.replace(element.original, element.changed);
    });

    fetch("https://v2.sg.media-imdb.com/suggestion/" + text[0] + "/" + text.replace(" ", "_") + ".json")
        .then(resp => resp.json())
        .then(data => {
            if (!data.d) {
                res.json(response);
            }
            else {
                data.d.forEach(suggestion => {
                    if (!suggestion.id) {
                        return;
                    }
                    if (!suggestion.id.startsWith("tt")) {
                        return;
                    }
                    if (!suggestion.l) {
                        return;
                    }
                    response.suggestions.push({
                        name: suggestion.l,
                        year: suggestion.y,
                        id: suggestion.id
                    })
                });
                res.json(response);
            }
        })
        .catch(err => {
            console.log(err);
            res.json(response);
        })

}