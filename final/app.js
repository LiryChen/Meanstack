const express = require('express'); // Express web server framework
const request = require('request-promise'); // "Request" library
const querystring = require('querystring');
const cookieParser = require('cookie-parser');

const client_id = '8a5e7080b0ae41e18165590ff06592a3'; 
const client_secret = '6343078f199a4eec9065ad35357210f7'; 
const redirect_uri = 'http://localhost:8888/callback'; 
const queryService = require('./service');

//Set up database connection
const mongoose = require('mongoose')
if (!mongoose.connection.db) {
    mongoose.connect('mongodb://localhost/day')
}

const db = mongoose.connection
db.once('open', function () {
    console.log('Connected to database!')
})

const Schema = mongoose.Schema;
const albumSchema = new Schema ({
    art: {type: String, unqiue: false},
    name: {type: String, unique: false}
})

const albums = mongoose.model('albums', albumSchema);

const howisyourday = require('./routes/howisyourday')

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
const generateRandomString = function(length) {
    const text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (const i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

const stateKey = 'spotify_auth_state';

const app = express();

app.use(express.static(__dirname + '/public'))
    .use(cookieParser());

app.use('/howisyourday', howisyourday);

app.get('/login', function(req, res) {

    const state = generateRandomString(16);
    res.cookie(stateKey, state);

    // application requests authorization
    const scope = 'user-read-private user-read-email user-library-read';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));
});

app.get('/callback', function(req, res) {

    // your application requests refresh and access tokens
    // after checking the state parameter

    const code = req.query.code || null;
    const state = req.query.state || null;
    const storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        res.clearCookie(stateKey);
        const authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };

        request.post(authOptions, function(error, response, body) {
            if (!error && response.statusCode === 200) {

                const access_token = body.access_token,
                    refresh_token = body.refresh_token;

                const options = {
                    url: 'https://api.spotify.com/v1/me',
                    headers: { 'Authorization': 'Bearer ' + access_token },
                    json: true
                };

                // use the access token to access the Spotify Web API
                request.get(options, function(error, response, body) {
                    console.log(body);
                });

                // we can also pass the token to the browser to make requests from there
                res.redirect('/#' +
                    querystring.stringify({
                        access_token: access_token,
                        refresh_token: refresh_token
                    }));
                // let Token = 'Bearer BQAwE7J0lQwjPFwt7nj0DCuhnqyGsdNwsJ9o8VrvFUzydVVV8dTv1D0RGS-KUrYyzMiymLvGcRI49ixCWB31M1SOMbBYlWlWs_RwCdHoDracTeJ_5uBmwKhSsIbiD-nNPNkGa0TLl8uEFiQ_abYF3E93YIwGtDNmDgj0rhUO-SE';
                let Token = 'Bearer ' + access_token;
                let spotifyAPI = 'https://api.spotify.com/v1/me/tracks?limit=50'
                let spotifyOptions = {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': Token
                    }
                }
                queryService.Token = Token;
                console.log("TOKENIS" + Token)
                request.get(spotifyAPI, spotifyOptions, function(error,response) {
                    if (error) {
                        throw new Error(error)
                    }
                    else {
                        let topTracks = JSON.parse(response.body)
                        console.log("topTracks:11");
                        console.log(topTracks);
                        topTracks.items.forEach(function (item) {
                                let entry = new albums({
                                    art: item.track.album.images[1].url,
                                    name: item.track.album.name
                                })
                                entry.save(function (err) {
                                    if (err) { res.send(err) }
                                    else {
                                        console.log(entry, "Album added to database!")
                                    }
                                })
                        })
                    }
                })
            } else {
                res.redirect('/#' +
                    querystring.stringify({
                        error: 'invalid_token'
                    }));
            }
        });
    }
});

app.get('/refresh_token', function(req, res) {

    // requesting access token from refresh token
    const refresh_token = req.query.refresh_token;
    const authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
        form: {
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        },
        json: true
    };

    request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            const access_token = body.access_token;
            res.send({
                'access_token': access_token
            });
        }
    });
});

app.get('/search', function(req, res) {
    const text = req.query.text;
    queryService.search(text, (data) => {res.send(data); console.log(data)})
})
app.get('/top', function(req, res) {
    albums.findOne({ }, function (err, adventure) {if(err) {res.send(err);return} res.send(adventure) });
})

module.exports = app;
