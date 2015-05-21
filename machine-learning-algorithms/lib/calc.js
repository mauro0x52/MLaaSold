var Calc = {};

Calc.euclidean = function (x1, x2) {
	var i;
	var distance = 0;
	for (i = 0; i < x1.length; i++) {
		var d = x1[i] - x2[i];
		distance += d * d;
	}
	return Math.sqrt(distance);
}

module.exports = Calc;
