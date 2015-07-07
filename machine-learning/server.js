var express = require('express');
var app = express();
var needle = require('needle');
var config = require('../config.js');
var childProcess = require('child_process');
var bodyparser = require('body-parser');

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended : true}));

var predictions = [];

app.post('/predictions/:predictionId', function (req, res) {
	res.contentType('json');
	res.header('Access-Control-Allow-Origin', '*');
		
	console.log('Received prediction #'+req.params.predictionId);
			
	predictions.push({
		predictionId : req.params.predictionId,
		prediction : req.body.prediction,
		time : req.body.time,
		avgTime : req.body.avgTime
	});
		
	console.log('Stored prediction #'+req.params.predictionId);
	
	res.send({});
});

app.get('/predictions/:predictionId', function (req, res) {
	res.contentType('json');
	res.header('Access-Control-Allow-Origin', '*');
	
	console.log('Prediction #'+req.params.predictionId+' requested');
	
	for (var i in predictions) {
		if (predictions[i].predictionId == req.params.predictionId) {
			res.send(predictions[i]);
			console.log('Prediction #'+req.params.predictionId+' sent');
		}
	}
});

var server = app.listen(config.servers.predictionsServer.port);
