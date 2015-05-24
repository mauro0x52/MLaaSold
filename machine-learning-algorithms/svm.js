var express = require('express');
var Svm = require('node-svm');
var config = require('../config.js');
var bodyparser = require('body-parser');
var app = express();

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended : true}));

var modelId = process.argv[2];
var port = process.argv[3];

var running = false;
var trainning = false;
var options = {
	gamma : [0.125, 0.5, 1],
	c : [8, 16, 32],
	epsilon : [0.001, 0.125, 0.5],
	normalize : true,
	reduce : true,
	retainedVariance : 0.995,
	kFold: 10
};

var report = null;

var svm = null;

/**
 * Build the model
 */
app.post('/build', function (req, res) {
	res.contentType('json');
	res.header('Access-Control-Allow-Origin', '*');
		
	if (req.body.model && req.body.model.parameters) {
		for (var i in req.body.model.parameters) {
			options[i] = req.body.model.parameters[i];
		}
	}
	
	svm = new Svm.EpsilonSVR(options);
	
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
		
	var trainingSet = [];
	
	for (var i in req.body.data) {
		trainingSet.push([req.body.data[i], req.body.results[i]]);
	}
		
	trainning = true;
	console.log('Training model #'+modelId);
	
	svm.train(trainingSet)
		.spread(function (model, report) {
			trainning = false;
			console.log('Model #'+modelId+' trained');
			res.send({report : report});
		});
	
	
});

/**
 * Run prediction
 */
app.post('/run', function (req, res) {
	res.contentType('json');
	res.header('Access-Control-Allow-Origin', '*');
	
	console.log('Model #'+modelId+' is running');
	
	running = true;
	
	var data = req.body.data;
	
	prediction = [];
	
	console.log('data');
	console.log(data);
	
	for (var i in data) {
		prediction.push(svm.predictSync(data[i]));
	}
	
	console.log('prediction');
	console.log(prediction);
			
	running = false;
	console.log('Model #'+modelId+' finished running');
	
	res.send({prediction : prediction});
});

var server = app.listen(port);

