var ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');
var request = require('request-promise'); // "Request" library
var querystring = require('querystring');
var username = "bea7a1a5-a927-40b0-9c9e-92f50e761f07";
var password = "eKKNaYI1NEuq";
var toneAnalyzer = new ToneAnalyzerV3({
  version: '2017-09-21',
  username: `${username}`,
  password: `${password}`
});
var _text = 'Team, I know we are facing a tough situation! Product sales have been disappointing for the past three quarters. We have a competitive product, but we need to do a better job at selling it!'

/**
 * get tones from watson with simple input
 * @param {*} text 
 * @param {*} callback 
 */
function getTone(text, callback) {
    if (!text) {
        text = _text;
    }

    var toneParams = {
    'tone_input': { 'text': text },
    'content_type': 'application/json'
    };

    toneAnalyzer.tone(toneParams, function (error, analysis) {
    if (error) {
        console.log(error);
    } else { 
        console.log(JSON.stringify(analysis, null, 2));
        callback(analysis['document_tone']['tones'].map(to => to.tone_name));
    }
    });
}

getTone("I'm yours.", console.log)

/**
 * get tones from text
 * and search the tones in spotify 
 * @param {*} text  search words
 * @param {*} callback  callback function
 */
function search(text, callback) {
    var api = "https://api.spotify.com/v1/search?";

    getTone(text, (tones) => {
        let results = [];
        console.log("tones length is")
        console.log(tones.length);
        if (tones.length == 0) {
            tones = ['Unknow']
        }

 
        /**
         * for each tone, get the search result in spotiry
         */
        tones.forEach((element, index) => {
            console.log("index is" + index)
            let queries = {
                q: element,
                type: "track",
                limit: 3,
                offset: 5
            }
            let spotifyOptions = {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': this.Token
                }
            }

            /**
             * get search result in spotify with options
             */
            request.get(api + querystring.stringify(queries), spotifyOptions).then((resp) => {
                let obj = JSON.parse(resp);
                obj.keyword = element;
                results.push(obj);

                /**
                 * send http response when all request are finished
                 */
                if (results.length == tones.length) {
                    callback(results);
                }
            }).catch((er) => { callback(er)}) }
        );
    })
}

module.exports = {
    search,
    Token: undefined
}