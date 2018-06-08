var express = require('express');
var router = express.Router();
var app = express();


// getting-started.js
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
});

/*
http://mongoosejs.com/docs/index.html

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

var Cat = mongoose.model('Cat', { name: String });

var kitty = new Cat({ name: 'Zildjian' });
kitty.save().then(() => console.log('meow'));

*/

/* GET users listing. */

var Schema = mongoose.Schema
var mySchema = new Schema({
    name: String,
    length: String
})
var  = mongoose.model('hw2_db', mySchema)

router.get('/', function (req, res, next) {
    .find({}, function (err, results) {
        res.json(results);
    })

})


router.get('/:_name', function (req, res, next) {
    .find({name: req.params._name}, function (err, results) {
        if(Object.keys(results).length === 0){
            let str = req.params._name;
            let len = str.length;
            var newstring = new ({
                name: str,
                length: len
                });

            newstring.save(function(err){
                if (err) {res.send(err)}
                else{
                    res.send(JSON.stringify({string:str,length:len}));
                }
            })

        }
        else {res.json({string:results[0].name,length:results[0].length});}
    })
})




router.post('/', function (req, res, next) {
    if(req.body.name){
        .find({name: req.body.name}, function (err, results) {
            if (Object.keys(results).length === 0) {
                let str = req.body.name;
                let len = str.length;
                var newstring = new ({
                    name: str,
                    length: len
                });

                newstring.save(function (err) {
                    if (err) {
                        res.send(err)
                    }
                    else {
                        res.send(JSON.stringify({string: str, length: len}));
                    }

                })

            }

            else {
                res.json({string: results[0].name, length: results[0].length});
            }
        } )

    }

    else{
        res.json({message:"Warning: please provide a string"});
    }
})

router.delete('/:toDelete', function (req, res, next) {
    .find({name:req.params.toDelete},function(err,results){
        if(Object.keys(results).length === 0){

            res.json({message:"String not found"});
        }
        else{
            .remove({name:req.params.toDelete},function(err){
            if(err) throw err;
            else res.json({message:"Deleted successfully"});


        })

        }})});
module.exports = router;

