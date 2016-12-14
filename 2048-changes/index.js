var express = require('express');
var bodyParser = require('body-parser');
var validator = require('validator');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var mongoUri = process.env.MONGODB_URI || process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/2048';
var MongoClient = require('mongodb').MongoClient, format = require('util').format;
var db = MongoClient.connect(mongoUri, function(error, databaseConnection) {
  db = databaseConnection;
});

app.get('/', function(request, response) {
  response.set('Content-Type', 'text/html');
  db.collection('scores', function(er, scores) {
    if (er){
      throw(er);
    }
    scores.find().sort({score: -1}).toArray(function(err, cursor) {
      if (!err) {
        var display = "<!DOCTYPE HTML><html><head><title>2048 Game Center</title></head><body>2048 Game Center<table><tr><th>User</th><th>Score</th><th>Timestamp</th></tr>";
        for (var i = 0; i < cursor.length; i++) {
          display += "<tr><td>" + cursor[i].username + "</td><td>" + cursor[i].score + "</td><td>" + cursor[i].created_at + "</td></tr>";
        }
        display += "</table></body></html>"
        response.send(display);
      } 
      else {
        response.send('<!DOCTYPE HTML><html><head><title>ScoreCenter</title></head><body>Error</body></html>');
      }
    });
  });
});

app.post('/submit.json', function(request, response) {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "X-Requested-With");
  var username = request.body.username;
  var score = parseInt(request.body.score);
  var grid = request.body.grid;

  console.log(username);
  console.log(score);
  console.log(grid);
  if (username != undefined && validator.isAlphanumeric(username) && score != undefined && score > 0 && grid != undefined && validator.isJSON(grid)) {
    var data = {
      "username": username,
      "score": score,
      "grid": grid,
      "created_at": Date()
    };
    db.collection('scores', function(er, collection) {
      collection.insert(data, function(err, saved) {
        if (err || !saved) {
          response.send(500)
        } 
        else {
          response.send(200);
        }
      });
    });
  }
  else {
    response.send("Error with data");
  }
});

app.get('/scores.json', function(request, response) {
  console.log("in get");
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "X-Requested-With");

  var username = request.query.username;
  if (request.query.username === undefined) {
    response.send("[]");
  } 
  else {
    db.collection('scores', function(er, collection) {
      //find top ten scores of username in descending order
      collection.find({"username": username}).sort({score: -1}).limit(10).toArray(function(err, display) {
        response.send(JSON.stringify(display));
      });
    });
  }
});

app.listen(process.env.PORT || 3000);