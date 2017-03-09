'use strict';
var express = require('express');
var router = express.Router();
// var tweetBank = require('../tweetBank');
var client = require('../db/index.js');

var look = 'SELECT users.id AS user_id, name, picture_url, tweets.id AS tweet_id, content FROM users JOIN tweets ON users.id = user_id';

module.exports = function makeRouterWithSockets (io) {

  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // a reusable function
  function respondWithAllTweets (req, res, next){
    client.query(look, function (err, result) {
      if (err) return next(err); // pass errors to Express
      var tweets = result.rows;
      res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
    });
  }


  router.get('/users/:username', function(req, res, next){
    var username = req.params.username;
   client.query(look + ' WHERE name = $1', [username], function (err, result) {
      if (err) return next(err);
      // pass errors to Express
      var tweets = result.rows;
      res.render('index', {
        title: 'Twitter.js',
        tweets: tweets,
        showForm: true,
        username: req.params.username});
    });
  });

    // var tweetsForName = tweetBank.find({ name: req.params.username });
    // res.render('index', {
    //   title: 'Twitter.js',
    //   tweets: tweetsForName,
    //   showForm: true,
    //   username: req.params.username



  router.get('/tweets/:id', function(req, res, next){
    var id = req.params.id;
    client.query(look + ' WHERE tweets.id = $1', [id], function (err, result) {
    if (err) return next(err);
    var tweets = result.rows;
    res.render('index', {
      title: 'Twitter.js',
      tweets: tweets // an array of only one element ;-)
    });
  });
  });

  // create a new tweet
  router.post('/tweets', function(req, res, next){
    var id;
    client.query('SELECT users.id AS user_id FROM users WHERE name = $1', [req.body.name], function (err, result) {
      if (err) return next(err);
      if (result.rows[0]) {
        id = result.rows[0].user_id
        client.query('INSERT INTO tweets (user_id, content) VALUES ($1, $2)', [id, req.body.text], function (err, data) {
          if (err) return next(err);
          io.sockets.emit('new_tweet', req.body.name);
          res.redirect('/');
        });
      } else {
        client.query('INSERT INTO users (name) VALUES ($1)', [req.body.name], function (err, result) {
          if (err) return next(err);
                // console.log(result.rows)
          id = result.rows[result.rows.length - 1].user_id;
          client.query('INSERT INTO tweets (content) VALUES ($1)', [req.body.text], function (err,result) {
            if (err) return next(err);
            io.sockets.emit('new_tweet', req.body.name);
            res.redirect('/');
          });
        });
      }
    });
  });



  // // // replaced this hard-coded route with general static routing in app.js
  // // router.get('/stylesheets/style.css', function(req, res, next){
  // //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // // });

  return router;
  }
