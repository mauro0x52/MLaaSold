var express = require('express');
var config = require('../config.js');
var bodyparser = require('body-parser');
var synaptic = require('synaptic'); 
var Neuron = synaptic.Neuron,
    Layer = synaptic.Layer,
    Network = synaptic.Network,
    Trainer = synaptic.Trainer,
    Architect = synaptic.Architect;
    
var app = express();

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended : true}));

var modelId = process.argv[2];
var port = process.argv[3];

var running = false;
var trainning = false;

var perceptron;
var trainer;

var normalization = { input : [], output : { min : 0, max : 0 } };

var report;

var options = {
    rate: 0.1,
    iterations: 10000,
    error: .0001,
    shuffle: true,
    log: 0,
    folds: 10
}


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


	
var crossvalidation = function (trainingSet, options) {
	var dataLength = trainingSet.length;
	var foldLength = parseInt(trainingSet.length / options.folds);
	var validation = [];
	var start = new Date().getTime(); 
	
	for (var i = 0; i < options.folds; i++) {
		var trainingSetClone = trainingSet.slice(0);	
		var dataFold = trainingSetClone.splice(i * foldLength, foldLength);
		var trainer = new Trainer(perceptron);
		trainer.train(trainingSetClone, options);
		for (var j in dataFold) {
			//console.log(dataFold[j].input, dataFold[j].output[0], perceptron.activate(dataFold[j].input)[0]);
			validation.push({real : dataFold[j].output[0], predicted : perceptron.activate(dataFold[j].input)[0]});
		}
	}
		
	var sum = parseFloat(0);
	var sumsq = parseFloat(0);
	for (var i in validation) {
		var error = Math.abs(validation[i].real - validation[i].predicted);
		error = error * (normalization.output.max - normalization.output.min) + normalization.output.min;
		var sq = parseFloat(error * error);
		sum += error;
		sumsq += sq;
	}
	var report = { 
		mse : sumsq/dataLength,
		std : Math.sqrt(sumsq/dataLength),
		mean : sum/dataLength,
		size : dataLength,
		time : new Date().getTime() - start
	};
	return report;
}

/**
 * Post training set and train model
 */
app.post('/training-set', function (req, res) {
	res.contentType('json');
	res.header('Access-Control-Allow-Origin', '*');
		
	if (!perceptron) {
		if (!options.layers) {
			options.layers = [req.body.data[0].length, 2*req.body.data[0].length, 1];
		}
		perceptron = new Architect.Perceptron(options.layers[0], options.layers[1], 1);
		trainer = new Trainer(perceptron);
	}
	
	trainning = true;
	console.log('Training model #'+modelId);
		
	var trainingSet = [];
	var data = req.body.data;
	var results = req.body.results;
	
	for (var i in req.body.data) {
		trainingSet.push({input : data[i], output : [results[i]]});
		if (normalization.output.min > results[i]) normalization.output.min = results[i];
		if (normalization.output.max < results[i]) normalization.output.max = results[i];
		for (var j in trainingSet[i].input) {
			if (i == 0) {
				normalization.input.push({max : 0, min : 0});
			}
			if (normalization.input[j].min > trainingSet[i].input[j]) normalization.input[j].min = trainingSet[i].input[j];
			if (normalization.input[j].max < trainingSet[i].input[j]) normalization.input[j].max = trainingSet[i].input[j];
		}
	}
	
	for (var i in trainingSet) {
		for (var j in trainingSet[i].input) {
			if (normalization.input[j].max - normalization.input[j].min == 0) trainingSet[i].input[j] = 0;
			else trainingSet[i].input[j] = (trainingSet[i].input[j] - normalization.input[j].min) / (normalization.input[j].max - normalization.input[j].min);
		}
		if (normalization.output.max - normalization.output.min == 0) trainingSet[i].output = 0;
		else trainingSet[i].output = [(trainingSet[i].output[0] - normalization.output.min) / (normalization.output.max - normalization.output.min)];
	}
	
	report = crossvalidation(trainingSet, options);
	res.send({report : report});
	
	trainer.train(trainingSet, options);
	
	trainning = false;
	
	console.log('Model #'+modelId+' trained');
	
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
		for (var j in predictors[i]) {
			predictors[i][j] = (predictors[i][j] - normalization.input[j].min) / (normalization.input[j].max - normalization.input[j].min);
		}
	}
		
	for (var i in predictors) {
		prediction.push(perceptron.activate(predictors[i])[0] * (normalization.output.max - normalization.output.min) + normalization.output.min);	
	}
	
	running = false;
	console.log('Model #'+modelId+' finished running');
	
	res.send({prediction : prediction, time : new Date().getTime() - start, avgTime : (new Date().getTime() - start)/predictors.length});
});

var server = app.listen(port);

