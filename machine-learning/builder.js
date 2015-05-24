var express = require('express');
var app = express();
var needle = require('needle');
var config = require('../config.js');
var fork = require('child_process').fork;
var exec = require('child_process').exec;
var bodyparser = require('body-parser');

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended : true}));

var models = {};
var modelsNumber = 0;

app.post('/models', function (req, res) {
	res.contentType('json');
	res.header('Access-Control-Allow-Origin', '*');
	
	var model = {};
	
	for (var i in req.body.model) model[i] = req.body.model[i];
	
	console.log('Creating model #' + modelsNumber+ ' ('+model.algorithm+')');
	
	model.modelId = modelsNumber;
	model.port = parseInt(config.algorithms.portPrefix) + parseInt(model.modelId);
	
	models[model.modelId] = model;
		
	models[model.modelId].process = fork('./machine-learning-algorithms/'+model.algorithm+'.js', [model.modelId, model.port]);
			
	var interval = setInterval(function () {	
		console.log('Building #' +model.modelId);
		needle.post(config.algorithms.url + ':' + model.port + '/status', null, {json : true, timeout : 300}, function (error, res2) {
			if (res2) {
				clearInterval(interval);		
				needle.post(config.algorithms.url + ':' + model.port + '/build', req.body, {json : true, timeout : 1000}, function (error, res3) {
					console.log('Model #'+model.modelId+' deployed on port '+model.port);
					res.send({modelId : model.modelId});
				});
			}
		});
	}, 500);
	
	modelsNumber++;
});

app.get('/models/:modelId/status', function (req, res) {
	res.contentType('json');
	res.header('Access-Control-Allow-Origin', '*');
				
	needle.get(config.algorithms.url + ':' + models[req.params.modelId].port + '/status', function (error, data) {
		if (data) res.send(data.body);
	});
});

var server = app.listen(config.servers.builder.port);
