'use strict';

var app = angular.module('panel', []);

app.controller('panel', function ($scope, $http) {
	var config = {};
	
	$scope.models = [];
	$scope.predictions = [];
	$scope.tab = 'post-model';
	$scope.responses = {
		postModel : null,
		postTrainingSet : null,
		postPredictorSet : null,
		getPreProcessedData : null,
		getPredictedData : null
	}	
	trainingSet = trainingSet ? trainingSet : {data : [], results: []};
	var testSteps = 280;//58
	var testRange = 20;
	var testIndex = trainingSet.data.length - testRange - testSteps;
	//var testIndex = parseInt(Math.random()*(trainingSet.data.length - 20));
	var testSet = trainingSet.data.slice().splice(testIndex, testRange);
	var testResultsSet = trainingSet.results.slice().splice(testIndex, testRange);
	
	$scope.algorithms = {
		mlp : angular.toJson({ model : {algorithm : 'mlp', parameters : {layers : [12, 14, 1], rate : 0.1, iterations : 1000, error: 0.0001}}}, true),
		knn : angular.toJson({ model : {algorithm : 'knn', parameters : {k : 10, maxDistance : 2, weightFunctionSigma : 100, weights : [1, 1000, 1000, 1000000, 1, 1, 1000, 1000000, 1000, 1000, 10000, 1000]}}}, true),
		svm : angular.toJson({ model : {algorithm : 'svm', parameters : {gamma : [0.125, 0.5, 1], c : [8, 16, 32], epsilon : [0.001, 0.125, 0.5], retainedVariance : 0.995,}}}, true)
	}
	
	$scope.forms = {
		postModel : { 
			data : angular.copy($scope.algorithms.mlp)
		},
		postTrainingSet : { 
			modelId : null, 
			data : angular.toJson(trainingSet)
		},
		getReport : {
			modelId : null
		},
		postPredictorSet : { 
			modelId : null, 
			data : angular.toJson({ data : testSet}) 
		},
		getPreProcessedData : { 
			modelId : null 
		},
		getPredictedData : { 
			modelId : null, 
			predictionId : null 
		}
	}
	
	$scope.data = {};
	
	$http.get('/config').success(function(data) {
		config = data;
	});
	
	var setModelId = function (modelId) {
		$scope.forms.postTrainingSet.modelId = modelId;
		$scope.forms.getReport.modelId = modelId;
		$scope.forms.postPredictorSet.modelId = modelId;
		$scope.forms.getPreProcessedData.modelId = modelId;
		$scope.forms.getPredictedData.modelId = modelId;
	}
	
	var getModel = function (modelId) {
		for (var i in $scope.models) {
			if ($scope.models[i].modelId == modelId) return $scope.models[i];
		}
	}
	
	var getPrediction = function (predictionId) {
		for (var i in $scope.predictions) {
			if ($scope.predictions[i].predictionId == predictionId) return $scope.predictions[i];
		}
	}
	
	$scope.loadModelInput = function (algorithm) {
		$scope.forms.postModel.data = angular.copy($scope.algorithms[algorithm]);
		$scope.responses.postModel = null;
	}
	
	$scope.postModel = function () {
		var jsonData = JSON.parse($scope.forms.postModel.data);
		$scope.forms.postModel.data = angular.toJson(jsonData, true);
		$scope.responses.postModel = null;
		$http.post('/models', JSON.parse($scope.forms.postModel.data)).success(function(data) {
			$scope.responses.postModel = data;
			var model = {modelId : data.modelId, algorithm : jsonData.model.algorithm, status : 'building', report : null, predictions : [] };
			$scope.models.push(model);
			setModelId(data.modelId);
			getStatus(model);
		});
	}
	
	$scope.postTrainingSet = function () {
		var postData = angular.toJson(JSON.parse($scope.forms.postTrainingSet.data));
		$scope.forms.postTrainingSet.data = postData;
		$scope.responses.postTrainingSet = null;
		$http.post('/models/'+$scope.forms.postTrainingSet.modelId+'/training-set', postData).success(function(data) {
			$scope.responses.postTrainingSet = data;
			setModelId($scope.forms.postTrainingSet.modelId);
		});
	}
	
	$scope.getReport = function () {
		$scope.responses.getReport = null;
		var modelId = $scope.forms.getReport.modelId;
		$http.get('/models/'+modelId+'/report').success(function(data) {
			$scope.responses.getReport = data;
			getModel(modelId).report = data.report;
			setModelId($scope.forms.getReport.modelId);
		});
	}
	
	$scope.postPredictorSet = function () {
		var postData = angular.toJson(JSON.parse($scope.forms.postPredictorSet.data));
		var modelId = $scope.forms.postPredictorSet.modelId;
		$scope.forms.postPredictorSet.data = postData;
		$scope.responses.postPredictorSet = null;
		$http.post('/models/'+modelId+'/predictor-set', postData).success(function(data) {
			$scope.responses.postPredictorSet = data;
			$scope.forms.getPredictedData.predictionId = data.predictionId;
			setModelId($scope.forms.postPredictorSet.modelId);
			getModel(modelId).predictions.push(data.predictionId);
		});
	}
	
	$scope.getPredictedData = function () {
		$scope.responses.getPredictedData = null;
		var predictionId = $scope.forms.getPredictedData.predictionId;
		$http.get('/predictions/'+predictionId).success(function(data) {
			$scope.responses.getPredictedData = data;
			$scope.predictions.push(data);
		});
	}
	
	var getStatus = function (model) {
		setInterval(function () {
			var gotReply = false;
			$http.get('/models/'+model.modelId+'/status').success(function(data) {
				gotReply = true;
				model.status = data.status == 'ready' ?  'ready' : '';
			}, {timeout : 500});
			if (gotReply == false) model.status = '';
		}, 1000);
	}
	
	$scope.printJSON = function (json) {
		return json ? angular.toJson(json, true) : '';
	}
	
	$scope.buildCharts = function () {
		var predictionChart = {
			x : [], 
			y : []
		}
		for (var i = 0; i < testSet.length; i++) {
			predictionChart.x.push(i+1);
		}
		var colors = ['#66ddee','#ee9955','#aaee66']
		for (var i in $scope.models) {
			for (var j in $scope.models[i].predictions) {
				var prediction = getPrediction($scope.models[i].predictions[j]);
				predictionChart.y.push({
					name : $scope.models[i].modelId +'. '+$scope.models[i].algorithm+')',
					data : prediction.prediction
				});
				$scope.models[i].time = prediction.time;
				var mean = 0;
				var mse = 0;
				for (var k in prediction.prediction) {
					var error = Math.abs(prediction.prediction[k] - testResultsSet[k]);
					var sq = parseFloat(error * error);
					mean += error;
					mse += sq;
					mean = mean + Math.abs(prediction.prediction[k] - testResultsSet[k]);
				}
				mean = mean/prediction.prediction.length;
				mse = mse/prediction.prediction.length;
				$scope.models[i].test = {
					time : prediction.time,
					mse : mse,
					std : Math.sqrt(mse),
					mean : mean
				}
			}
		}
		predictionChart.y.push({name : 'real', data : testResultsSet, color : '#CCCCCC', dashStyle : 'ShortDash'});
		
		
		var validationMeanChart = [];
		var testMeanChart = [];
		for (var i in $scope.models) {
			validationMeanChart.push([$scope.models[i].modelId+'. '+$scope.models[i].algorithm, $scope.models[i].report.mean]);
			testMeanChart.push([$scope.models[i].modelId+'. '+$scope.models[i].algorithm, $scope.models[i].test.mean]);
		}
		
		var validationMseChart = [];
		var testMseChart = [];
		for (var i in $scope.models) {
			validationMseChart.push([$scope.models[i].modelId+'. '+$scope.models[i].algorithm, $scope.models[i].report.mse]);
			testMseChart.push([$scope.models[i].modelId+'. '+$scope.models[i].algorithm, $scope.models[i].test.mse]);
		}
		
		var validationTimeChart = [];
		var testTimeChart = [];
		for (var i in $scope.models) {
			validationTimeChart.push([$scope.models[i].modelId+'. '+$scope.models[i].algorithm, $scope.models[i].report.time]);
			testTimeChart.push([$scope.models[i].modelId+'. '+$scope.models[i].algorithm, $scope.models[i].test.time]);
		}
		
		
		setTimeout(function() {
			$('#predictions-chart').highcharts({
				colors : colors,
				title: {
					text: 'Predictions'
					//x: -20 //center
				},
				xAxis: {
					categories: predictionChart.x
				},
				yAxis: {
					plotLines: [{
						value: 0,
						width: 1,
						color: '#808080'
					}]
				},
				legend: {
					layout: 'vertical',
					align: 'right',
					verticalAlign: 'middle',
					borderWidth: 0
				},
				series: predictionChart.y
			});
			
			
			$('#validation-mean-chart').highcharts({
				colors : colors,
				chart: {
					type: 'column'
				},
				title: {
					text: 'Validation Mean Errors'
				},
				xAxis: {
					type: 'category'
				},
				yAxis: {
					min: 0,
					title: {
						text: 'Mean Error'
					}
				},
				legend: {
					enabled: false
				},
				series: [{
					name: 'Models',
                    colorByPoint: true,
					data: validationMeanChart
				}]
			});
			
			$('#validation-mse-chart').highcharts({
				colors : colors,
				chart: {
					type: 'column'
				},
				title: {
					text: 'Validation MSEs'
				},
				xAxis: {
					type: 'category'
				},
				yAxis: {
					min: 0,
					title: {
						text: 'MSE'
					}
				},
				legend: {
					enabled: false
				},
				series: [{
					name: 'Models',
                    colorByPoint: true,
					data: validationMseChart
				}]
			});
			
			$('#validation-time-chart').highcharts({
				colors : colors,
				chart: {
					type: 'column'
				},
				title: {
					text: 'Validation Time'
				},
				xAxis: {
					type: 'category'
				},
				yAxis: {
					min: 0,
					title: {
						text: 'Time (ms)'
					}
				},
				legend: {
					enabled: false
				},
				series: [{
					name: 'Models',
                    colorByPoint: true,
					data: validationTimeChart
				}]
			});
			
			$('#test-mean-chart').highcharts({
				colors : colors,
				chart: {
					type: 'column'
				},
				title: {
					text: 'Testing Mean Errors'
				},
				xAxis: {
					type: 'category'
				},
				yAxis: {
					min: 0,
					title: {
						text: 'Mean Error'
					}
				},
				legend: {
					enabled: false
				},
				series: [{
					name: 'Models',
                    colorByPoint: true,
					data: testMeanChart
				}]
			});
			
			$('#test-mse-chart').highcharts({
				colors : colors,
				chart: {
					type: 'column'
				},
				title: {
					text: 'Testing MSEs'
				},
				xAxis: {
					type: 'category'
				},
				yAxis: {
					min: 0,
					title: {
						text: 'MSE'
					}
				},
				legend: {
					enabled: false
				},
				series: [{
					name: 'Models',
                    colorByPoint: true,
					data: testMseChart
				}]
			});
			
			$('#test-time-chart').highcharts({
				colors : colors,
				chart: {
					type: 'column'
				},
				title: {
					text: 'Testing Time'
				},
				xAxis: {
					type: 'category'
				},
				yAxis: {
					min: 0,
					title: {
						text: 'Time (ms)'
					}
				},
				legend: {
					enabled: false
				},
				series: [{
					name: 'Models',
                    colorByPoint: true,
					data: testTimeChart
				}]
			});
			
		}, 200);
	}
});
