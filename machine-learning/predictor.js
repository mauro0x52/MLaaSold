var express = require('express');
var app = express();
var needle = require('needle');
var config = require('../config.js');
var childProcess = require('child_process');
var bodyparser = require('body-parser');

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended : true}));

var predictions = {};
var predictionsNumber = 0;

app.post('/models/:modelId/predictor-set', function (req, res) {
	res.contentType('json');
	res.header('Access-Control-Allow-Origin', '*');
	
	var port = parseInt(config.algorithms.portPrefix) + parseInt(req.params.modelId);
	
	var prediction = { predictionId : predictionsNumber, modelId : req.params.modelId };
	predictions[prediction.predictionId] = prediction;
	res.send(prediction);
	
	console.log('Creating prediction #'+prediction.predictionId+' to model #'+req.params.modelId);
				
	needle.post(config.algorithms.url + ':' + port + '/run', req.body, {json : true, timeout : 0}, function (error, res2) {
		if (error) {
			console.log('Error creating prediction #'+prediction.predictionId);
			console.log(error);
		}
		else {
			console.log('Prediction #'+prediction.predictionId+' created');
			
			// send to server
			console.log('Sending prediction #'+prediction.predictionId+' to server');
			needle.post(config.servers.predictionsServer.url + '/predictions/'+prediction.predictionId, res2.body, {json : true}, function (error, res3) {
				if (error) {
					console.log('Error sending prediction #'+prediction.predictionId);
					console.log(error);
				}
				else {
					console.log('Prediction #'+prediction.predictionId+' sent');
				}
			});
		}
	});
	
	predictionsNumber++;
});

var server = app.listen(config.servers.predictor.port);
