'use strict';

var app = angular.module('panel', []);

app.controller('panel', function ($scope, $http) {
	var config = {};
	
	$scope.models = [];
	$scope.tab = 'post-model';
	$scope.responses = {
		postModel : null,
		postTrainingSet : null,
		postPredictorSet : null,
		getPreProcessedData : null,
		getPredictedData : null
	}
	trainingSet = trainingSet ? trainingSet : {data : [], results: []};
	var testIndex = parseInt(Math.random()*(trainingSet.data.length - 10));
	var testSet = trainingSet.data.slice().splice(testIndex, 10);
	$scope.algorithms = {
		mlp : angular.toJson({ model : {algorithm : 'mlp', parameters : {layers : [12, 15, 1], rate : 0.1, iterations : 1000, error: 0.0001}}}, true),
		knn : angular.toJson({ model : {algorithm : 'knn', parameters : {k : 22, maxDistance : 0, weightFunctionSigma : 100}}}, true),
		svm : angular.toJson({ model : {algorithm : 'svm', parameters : {}}}, true)
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
			var model = {modelId : data.modelId, algorithm : jsonData.model.algorithm, status : 'building' };
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
		$http.get('/models/'+$scope.forms.getReport.modelId+'/report').success(function(data) {
			$scope.responses.getReport = data;
			setModelId($scope.forms.getReport.modelId);
		});
	}
	
	$scope.postPredictorSet = function () {
		var postData = angular.toJson(JSON.parse($scope.forms.postPredictorSet.data));
		$scope.forms.postPredictorSet.data = postData;
		$scope.responses.postPredictorSet = null;
		$http.post('/models/'+$scope.forms.postPredictorSet.modelId+'/predictor-set', postData).success(function(data) {
			$scope.responses.postPredictorSet = data;
			$scope.forms.getPredictedData.predictionId = data.predictionId;
			setModelId($scope.forms.postPredictorSet.modelId);
		});
	}
	
	$scope.getPredictedData = function () {
		$scope.responses.getPredictedData = null;
		$http.get('/predictions/'+$scope.forms.getPredictedData.predictionId).success(function(data) {
			$scope.responses.getPredictedData = data;
		});
	}
	
	var getStatus = function (model) {
		setInterval(function () {
			$http.get('/models/'+model.modelId+'/status').success(function(data) {
				model.status = data.status == 'ready' ?  'ready' : '';
			}, {timeout : 900});
		}, 1000);
	}
	
	$scope.printJSON = function (json) {
		return json ? angular.toJson(json, true) : '';
	}
});
