'use strict';

var express = require('express');
var needle = require('needle');
var config = require('./config.js');
var bodyparser = require('body-parser');
var app = express();

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended : true}));

app.use('/front-end', express.static('front-end'));

app.get('/config', function (req, res) {
	res.contentType('json');
	res.header('Access-Control-Allow-Origin', '*');
	res.send(config);
});

app.get('/ping', function (req, res) {
	res.contentType('json');
	res.header('Access-Control-Allow-Origin', '*');
	res.send({message : 'pong'});
});

app.post('/models', function (req, res) {
	res.contentType('json');
	res.header('Access-Control-Allow-Origin', '*');
		
	needle.post(config.servers.builder.url + '/models', req.body, {json : true}, function (error, res2) {
		if (error) res.send({error : error});
		else res.send(res2.body);
	});
});

app.post('/models/:modelId/training-set', function (req, res) {
	res.contentType('json');
	res.header('Access-Control-Allow-Origin', '*');
		
	needle.post(config.servers.learner.url + '/models/'+req.params.modelId+'/training-set', req.body, {json : true}, function (error, res2) {
		if (error) res.send({error : error});
		else res.send(res2.body);
	});
});

app.post('/models/:modelId/predictor-set', function (req, res) {
	res.contentType('json');
	res.header('Access-Control-Allow-Origin', '*');
	
	needle.post(config.servers.predictor.url + '/models/'+req.params.modelId+'/predictor-set', req.body, {json : true}, function (error, res2) {
		if (error) res.send({error : error});
		else res.send(res2.body);
	});
});


app.get('/predictions/:predictionId', function (req, res) {
	res.contentType('json');
	res.header('Access-Control-Allow-Origin', '*');
	
	needle.get(config.servers.predictionsServer.url + '/predictions/'+req.params.predictionId, {json : true}, function (error, res2) {
		if (error) res.send({error : error});
		else res.send(res2.body);
	});
});


var server = app.listen(7000);

