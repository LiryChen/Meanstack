const express = require('express')
const router = express.Router()
const request = require('request-promise-lite');
const vibrant = require('node-vibrant')
const path = require('path')
const async = require('async')
const fs = require('fs')
const mongoose = require('mongoose')
    , albums = mongoose.model('albums')

router.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/../public/howisyourday.html'))
})

module.exports = router;