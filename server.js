// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();

var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get("/dreams", function (request, response) {
  response.send(dreams);
});

app.get("/actions", function (request, response) {
  response.send(actions);
  console.log(actions);
});


// could also use the POST body instead of query string: http://expressjs.com/en/api.html#req.body
app.post("/dreams", function (request, response) {
  dreams.push(request.query.dream);
  response.sendStatus(200);
});

// could also use the POST body instead of query string: http://expressjs.com/en/api.html#req.body
app.post("/actions", upload.array(), function (request, response) {
  actions = request.body.contents;
  response.sendStatus(200);
  console.log(actions);
});

// Simple in-memory store for now
var dreams = [
  "Find and count some sheep",
  "Climb a really tall mountain",
  "Wash the dishes"
];


var actions = '{"sequence": [{"type": "Editor","text": "Hello World"},{"type": "Show"},{"type": "Load","location": {"type": "String","value": "actions"},"process": {"type": "Function","sequence": [{"type": "Show"}]}}]};';

var store = {};

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
