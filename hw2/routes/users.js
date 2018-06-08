var express = require('express');
var router = express.Router();
var app = express();


/* GET users listing. */

app.use('/hw1', router);

router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/:name', function(req, res, next){
	let Tname = req.params.name
	res.send({"string": Tname, "length": Tname.length})
})

router.params('name', function(req, res, next, value) {
	console.log('got', value)
	req.params.name
	next()
})

router.post('/', function(req, res, next){
	let value = req.body.keystring
	res.json({"string": value, "length": value.length})
})

module.exports = router;