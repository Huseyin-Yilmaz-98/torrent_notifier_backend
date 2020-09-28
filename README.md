Backend app for [Movie-Notifier](https://www.movie-notifier.com).

Tracker app for the website can be found [here](https://github.com/Xeraphin/torrent_notifier_tracker) and the frontend app can be found [here](https://github.com/Xeraphin/torrent_notifier_frontend).

-------------------------------------

This app was written in Express Framework. In order for the app to work, private.key, certificate.crt and ca_bundle.crt files must be present in the root directory. These files are required because the app uses HTTPS protocol.

An info.json files is also required for the app to work. This file contains private info. The structur for the file is as follows:

    {
        "session-secret": "random-session-secret",
        "database-credentials": {
            "host": "mysql-db-host-address",
            "user": "username",
            "password": "password",
            "database": "database-name"
        },
        "email-username": "gsuite-email-address",
        "email-password": "gsuite-password",
        "frontend-address": "frontend-address"
    }

A MYSQL 8.0 database was used to store data. Sessions are already stored in this database. Knex.js was used to manage database transactions. The database schema is as follows:

![database](https://github.com/Xeraphin/torrent_notifier_tracker/blob/master/images/database.png?raw=true)

-----------------------------------

The app can be run with the command "(sudo) npm run start". This starts a nodemon session which autostarts the app everytime a change is made to any of the files.