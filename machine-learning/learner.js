var express = require('express');
var app = express();
var needle = require('needle');
var config = require('../config.js');
var childProcess = require('child_process');
var bodyparser = require('body-parser');

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended : true}));

app.post('/models/:modelId/training-set', function (req, res) {
	res.contentType('json');
	res.header('Access-Control-Allow-Origin', '*');
	
	var port = parseInt(config.algorithms.portPrefix) + parseInt(req.params.modelId);
	
	console.log('Sending training-set to model #'+req.params.modelId);
			
	needle.post(config.algorithms.url + ':' + port + '/training-set', req.body, {json : true}, function (error, res2) {
		if (error) {
			res.send({error : error});
			console.log('Error sending training-set to model #'+req.params.modelId);
		}
		else {
			res.send({modelId : req.params.modelId});
			console.log('Sent training-set to model #'+req.params.modelId);
		}
	});
});

var server = app.listen(config.servers.learner.port);
