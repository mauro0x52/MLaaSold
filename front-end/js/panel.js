'use strict';

var app = angular.module('panel', []);

app.controller('panel', function ($scope, $http) {
	var config = {};
	
	$scope.tab = 'post-model';
	$scope.responses = {
		postModel : null,
		postTrainingSet : null,
		postPredictorSet : null,
		getPreProcessedData : null,
		getPredictedData : null
	}
	$scope.forms = {
		postModel : { 
			data : angular.toJson({ model : {algorithm : 'knn'}}) 
		},
		postTrainingSet : { 
			modelId : null, 
			data : angular.toJson({ data : [[1, 1], [1, 4], [3, 1], [4, 2], [3, 3]], results : [1, 2, 3, 4, 5]})
		},
		postPredictorSet : { 
			modelId : null, 
			data : angular.toJson({ data : [[2, 2], [2, 3]]}) 
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
		$scope.forms.postPredictorSet.modelId = modelId;
		$scope.forms.getPreProcessedData.modelId = modelId;
		$scope.forms.getPredictedData.modelId = modelId;
	}
	
	$scope.postModel = function () {
		$scope.forms.postModel.data = angular.toJson(JSON.parse($scope.forms.postModel.data));
		$http.post('/models', JSON.parse($scope.forms.postModel.data)).success(function(data) {
			$scope.responses.postModel = data;
			setModelId(data.modelId);
		});
	}
	
	$scope.postTrainingSet = function () {
		var postData = angular.toJson(JSON.parse($scope.forms.postTrainingSet.data));
		$scope.forms.postTrainingSet.data = postData;
		$http.post('/models/'+$scope.forms.postTrainingSet.modelId+'/training-set', postData).success(function(data) {
			$scope.responses.postTrainingSet = data;
			setModelId($scope.forms.postTrainingSet.modelId);
		});
	}
	
	$scope.postPredictorSet = function () {
		var postData = angular.toJson(JSON.parse($scope.forms.postPredictorSet.data));
		$scope.forms.postPredictorSet.data = postData;
		$http.post('/models/'+$scope.forms.postPredictorSet.modelId+'/predictor-set', postData).success(function(data) {
			$scope.responses.postPredictorSet = data;
			$scope.forms.getPredictedData.predictionId = data.predictionId;
			setModelId($scope.forms.postPredictorSet.modelId);
		});
	}
	
	$scope.getPredictedData = function () {
		$http.get('/predictions/'+$scope.forms.getPredictedData.predictionId).success(function(data) {
			$scope.responses.getPredictedData = data;
		});
	}
});
