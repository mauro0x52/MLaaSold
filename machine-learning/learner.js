var express = require('express');
var app = express();
var needle = require('needle');
var config = require('../config.js');
var childProcess = require('child_process');
var bodyparser = require('body-parser');

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended : true}));

var models = {};

app.post('/models/:modelId/training-set', function (req, res) {
	res.contentType('json');
	res.header('Access-Control-Allow-Origin', '*');
	
	var port = parseInt(config.algorithms.portPrefix) + parseInt(req.params.modelId);
	
	console.log('Sending training-set to model #'+req.params.modelId);
			
	needle.post(config.algorithms.url + ':' + port + '/training-set', req.body, {json : true, timeout : 0}, function (error, res2) {
		if (error) {
			console.log('Error sending training-set to model #'+req.params.modelId);
		}
		else {
			models[req.params.modelId] = { report : res2.body.report };
			console.log('Sent training-set to model #'+req.params.modelId);
		}
	});
	
	res.send({modelId : req.params.modelId});
});

app.get('/models/:modelId/report', function (req, res) {
	res.contentType('json');
	res.header('Access-Control-Allow-Origin', '*');
	
	console.log('Model #'+req.params.modelId+' report requested');
	res.send({report : models[req.params.modelId].report});
	console.log('Model #'+req.params.modelId+' report sent');
});

var server = app.listen(config.servers.learner.port);
