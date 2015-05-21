var Knn = function (options) {
	options = options || {};
	
	var self = this;
	var calc = require('./calc.js');
	self.weightFunction = options['weightFunction'] || 'gaussian';
	self.weightFunctionSigma = options['weightFunctionSigma'] || 10;
	self.distanceFunction = options['distanceFunction'] || 'euclidean';
	self.data = options['data'] || [];
	self.results = options['results'] || [];
	self.k = options['k'] || 3;
	
	self.setData = function (data, append) {
		if (self.data.length > 0 && append) self.data.concat(data);
		else self.data = data;
	}
	
	self.setResults = function (results, append) {
		if (self.results.length > 0 && append) self.results.concat(results);
		else self.results = results;
	}
	
	self.run = function (x) {
		var distances = [];
		var i;
		var avg = 0.0;
		var totalWeight = 0;
		var weight;
		
		for (i = 0; i < self.data.length; i++) {
			distances.push({
				index : i,
				distance : self.getDistance(x, self.data[i])
			});
		}
		
		distances.sort(function(a, b) {return a.distance - b.distance;});
		for (i = 0; i < Math.min(self.k, distances.length); i++) {
			weight = self.getWeight(distances[i].distance);
			avg += weight * self.results[distances[i].index];
			totalWeight += weight;
		}
		avg = avg/totalWeight;
		return avg;
	}
	
	self.getWeight = function (x) {
		if (typeof self.weightFunction == 'function') {
			return self.weightFunction(x);
		} else if (self.weightFunction == 'none') {
			return 1.0;
		} else { // gaussian
			return 	Math.exp(-1.*x*x/(2*self.weightFunctionSigma*self.weightFunctionSigma));
		}
	}
	
	self.getDistance = function (a,b) {
		if (typeof self.distanceFunction == 'function') {
			return self.distanceFunction(a,b);
		} else if (typeof self.distanceFunction == 'string') {
			return calc[self.distanceFunction](a,b);
		} else {
			return calc.euclidean(a,b);
		}
	}
	
	return self;
}

module.exports = Knn;
