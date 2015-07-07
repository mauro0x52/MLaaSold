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
var trainning = false;

var knn = new Knn();

/**
 * Build the model
 */
app.post('/build', function (req, res) {
	res.contentType('json');
	res.header('Access-Control-Allow-Origin', '*');
			
	if (req.body.model && req.body.model.parameters) {
		for (var i in req.body.model.parameters) {
			knn[i] = req.body.model.parameters[i];
		}
	}
		
	console.log('Model #'+modelId+' built');
		
	res.send({});
});

/**
 * Check Status
 */
app.get('/status', function (req, res) {
	res.contentType('json');
	res.header('Access-Control-Allow-Origin', '*');
	
	var status = 'ready';
	
	if (running) status = 'running';
	else if (trainning) status = 'trainning';
	
	res.send({status : status}); 
});

/**
 * Post training set and train model
 */
app.post('/training-set', function (req, res) {
	res.contentType('json');
	res.header('Access-Control-Allow-Origin', '*');
	
	var start = new Date().getTime();
		
	trainning = true;
	console.log('Training model #'+modelId);
		
	var data = req.body.data;
	var results = req.body.results;
		
	knn.setData(data, true);
	knn.setResults(results, true);
	knn.train();
	
	trainning = false;
	
	console.log('Model #'+modelId+' trained');
	
	knn.report.time = new Date().getTime() - start;
	
	res.send({report : knn.report});
});

/**
 * Run prediction
 */
app.post('/run', function (req, res) {
	res.contentType('json');
	res.header('Access-Control-Allow-Origin', '*');
	
	console.log('Model #'+modelId+' is running');
	
	var start = new Date().getTime();
	
	running = true;
	
	var predictors = req.body.data;
	var prediction = [];
	
	for (var i in predictors) {
		prediction.push(knn.run(predictors[i]));	
	}
	
	running = false;
	console.log('Model #'+modelId+' finished running');
	
	res.send({prediction : prediction, time : new Date().getTime() - start, avgTime : (new Date().getTime() - start)/predictors.length});
});

var server = app.listen(port);

