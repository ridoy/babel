var express = require('express');
var path = require('path');
var app = express();
var bodyParser = require('body-parser');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({ host: 'localhost:9200' });

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.enable('trust proxy')

/* Default route */
app.get('/', function(req, res) {
  res.sendFile('index.html');
});

/* Route for loading all annotations */
/*
app.get('/store/annotations', function(req, res) {
  searchAnnotations().then(function(data) {
    var rows = [];
    for (var i = 0; i < data.hits.hits.length; i++) {
      rows[i] = data.hits.hits[i]._source;
      rows[i].id = data.hits.hits[i]._id;
    }
    return res.json(rows);
  });
});
*/

/* Route for loading all annotations */
app.get('/store/search', function(req, res) {
  console.log(getFormattedDate() + ',' + req.ip + ',' + req.headers['user-agent']);
  searchAnnotations().then(function(data) {
    var rows = [];
    for (var i = 0; i < data.hits.hits.length; i++) {
      rows[i] = data.hits.hits[i]._source;
      rows[i].id = data.hits.hits[i]._id;
    }
    var jsonBody = {
      total: data.hits.total,
      rows: rows
    };
    return res.json(jsonBody);
  });
});

/* Route for editing an existing annotation */
app.put('/store/annotations/:id', function(req, res) {
  if (!req.params.id) { return res.status(400).send({error: 'Annotation id must be specified'});}
  editAnnotationById(req.params.id, req.body).then(function(data) {
    return res.json(data);
  });
});

/* Route for editing an existing annotation */
app.put('/store/annotations/', function(req, res) {
  if (!req.params.id) { return res.status(400).send({error: 'Annotation id must be specified'}); }
  editAnnotationById(req.params.id, req.body).then(function(data) {
    return res.json(data);
  });
});

/* Route for storing a new annotation */
app.post('/store/annotations', function(req, res) {
  var body = req.body;
  var ip   = req.ip;
  storeAnnotation(ip, body).then(function(data) {
    return res.json(data);
  });
});

/* Route for upvoting an annotation */
app.post('/store/annotations/:id/upvote', function(req, res) {

});

/* Route for downvoting an annotation */
app.post('/store/annotations/:id/downvote', function(req, res) {

});

function editAnnotationById(id, body) {
  return new Promise(function(resolve, reject) {
    client.update({
      index: 'annotations',
      type: 'annotation',
      id: id,
      body: {
        doc: {
          text: body.text
        }
      }
    }, function(err, res) {
      // TODO error handling
      resolve(body);
    });
  });
}

function searchAnnotations() {
  return new Promise(function(resolve, reject) {
    client.search({
      index: 'annotations',
      q: '*:*',
      size: 1000
    }, function(err, res) {
      // TODO error handling
      resolve(res);
    });
  });
}

function storeAnnotation(ip, body) {
  body.ip = ip; 
  body.timestamp = Date.now();
  return new Promise(function(resolve, reject) {
    client.index({
      index: 'annotations',
      type: 'annotation',
      body: body
    }, function(err, res) {
      resolve(body);
    });
  });
}

function dropIndex() {
  return client.indices.delete({
    index: 'annotations',
  });
}

function createIndex() {
  return client.indices.create({
    "index": "annotations",
    "mapping": {
      "annotation": {
        "ip": { "type": "string", },
        "text": { "type": "text", },
        "ranges": [
          {
            "start": { "type": "string", },
            "startOffset": { "type": "long", },
            "end": { "type": "string", },
            "endOffset": { "type": "long", }
          }
        ],
        "uri": { "type": "string", },
        "quote": { "type": "text", },
      }
    }

  });
}

function getFormattedDate() {
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var d = new Date();
  var day = days[d.getDay()];
  var hr = d.getHours();
  var min = d.getMinutes();
  if (min < 10) {
        min = "0" + min;
  }
  var ampm = hr < 12 ? "am" : "pm";
  var date = d.getDate();
  var month = months[d.getMonth()];
  var year = d.getFullYear();
  var formattedDate = day + " " + hr + ":" + min + ampm + " " + date + " " + month + " " + year;
  return formattedDate;
}

app.listen(80);
