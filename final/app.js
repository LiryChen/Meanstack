var express = require('express'); // Express web server framework
var request = require('request-promise'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = '8a5e7080b0ae41e18165590ff06592a3'; 
var client_secret = '6343078f199a4eec9065ad35357210f7'; 
var redirect_uri = 'http://localhost:8888/callback'; 
var queryService = require('./service');

//Set up database connection
var mongoose = require('mongoose')
if (!mongoose.connection.db) {
    mongoose.connect('mongodb://localhost/day')
}

var db = mongoose.connection
db.once('open', function () {
    console.log('Connected to database!')
})

var Schema = mongoose.Schema;
var albumSchema = new Schema ({
    art: {type: String, unqiue: false},
    name: {type: String, unique: false}
})

var albums = mongoose.model('albums', albumSchema);

var howisyourday = require('./routes/howisyourday')

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
    .use(cookieParser());

app.use('/howisyourday', howisyourday);

app.get('/login', function(req, res) {

    var state = generateRandomString(16);
    res.cookie(stateKey, state);

    // application requests authorization
    var scope = 'user-read-private user-read-email user-library-read';
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

    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        res.clearCookie(stateKey);
        var authOptions = {
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

                var access_token = body.access_token,
                    refresh_token = body.refresh_token;

                var options = {
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
    var refresh_token = req.query.refresh_token;
    var authOptions = {
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
            var access_token = body.access_token;
            res.send({
                'access_token': access_token
            });
        }
    });
});

app.get('/search', function(req, res) {
    var text = req.query.text;
    queryService.search(text, (data) => {res.send(data); console.log(data)})
})
app.get('/top', function(req, res) {
    albums.findOne({ }, function (err, adventure) {if(err) {res.send(err);return} res.send(adventure) });
})

module.exports = app;
