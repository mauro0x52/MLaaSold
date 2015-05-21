var express = require('express');
var Knn = require('./lib/knn.js');
var config = require('../config.js');
var bodyparser = require('body-parser');
var app = express();

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended : true}));

var modelId = process.argv[2];
var port = process.argv[3];

var running = false;

var knn = new Knn();

app.post('/build', function (req, res) {
	res.contentType('json');
	res.header('Access-Control-Allow-Origin', '*');
	
	for (var i in req.body.model) {
		knn[i] = req.body.model[i];
	}
	
	console.log('Model #'+modelId+' built');
		
	res.send({});
});

app.get('/status', function (req, res) {
	res.contentType('json');
	res.header('Access-Control-Allow-Origin', '*');
	
	res.send({status : running ? 'running' : 'idle' }); 
});

app.post('/training-set', function (req, res) {
	res.contentType('json');
	res.header('Access-Control-Allow-Origin', '*');
		
	var data = req.body.data;
	var results = req.body.results;
		
	knn.setData(data, true);
	knn.setResults(results, true);
	
	console.log('Model #'+modelId+' trained');
	
	res.send({});
});

app.post('/run', function (req, res) {
	res.contentType('json');
	res.header('Access-Control-Allow-Origin', '*');
	
	console.log('Model #'+modelId+' is running');
	
	running = true;
	
	var predictors = req.body.data;
	var prediction = [];
	
	for (var i in predictors) {
		prediction.push(knn.run(predictors[i]));	
	}
	
	running = false;
	console.log('Model #'+modelId+' finished running');
	
	res.send({prediction : prediction});
});

var server = app.listen(port);

