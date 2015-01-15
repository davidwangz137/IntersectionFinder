//TODO
/*
Implement navigation and dynamic point generation
Implement algorithm for determining best graph axes so that the shape of the graph
can be best seen
*/

var lim1 = -5, lim2 = 5;//Graphing limits
var step = 0.01;//The step size of evaluation for the points
var divLimit = 1e10;//Past this will stop searching for zeroes
var f1,f2,g,d;//The functions, difference, and derivative

function replace_hyperbolic(str){
	//var patt = /(sinh(.*?)|cosh(.*?)|tanh(.*?))/;
	var patt = /sinh\(.*?\)/g;
	if(patt.test(str))
	{
		var matches = str.match(patt);//Array of different string matches
		for (var i = 0; i < matches.length; i++)
		{
			var repStr = matches[i];
			var inside = repStr.substring(5, repStr.length -1);
			str = str.replace(repStr, "((exp(" + inside + ")-exp(-" + inside + "))/2)");
		}
	}
	var patt = /cosh\(.*?\)/g;
	if(patt.test(str))
	{
		var matches = str.match(patt);//Array of different string matches
		for (var i = 0; i < matches.length; i++)
		{
			var repStr = matches[i];
			var inside = repStr.substring(5, repStr.length -1);
			str = str.replace(repStr, "((exp(" + inside + ")+exp(-" + inside + "))/2)");
		}
	}
	var patt = /tanh\(.*?\)/g;
	if(patt.test(str))
	{
		var matches = str.match(patt);//Array of different string matches
		for (var i = 0; i < matches.length; i++)
		{
			var repStr = matches[i];
			var inside = repStr.substring(5, repStr.length -1);
			str = str.replace(repStr, "((exp(" + inside + ")-exp(-" + inside + "))/(exp(" + inside + ")+exp(-" + inside + ")))");
		}
	}
	//console.log(str);
	return str;
}

function set_f(){
	nerdamer.clear('all');//Clear previous functions
	var str1 = replace_hyperbolic($("#function1").val());
	var str2 = replace_hyperbolic($("#function2").val());
	var str3 = str1 + ' - ' + str2;
	var str4 = 'diff(' + str3 + ',x)';
	f1 = nerdamer(str1);
	f2 = nerdamer(str2);
	g = nerdamer(str3);
	d = nerdamer(str4);
	if($("#new").prop("checked"))
	{
		newtons();
	}
	else
	{
		bisection();
	}
}

function newtons(){
	var zero = Number($("#guess").val());//Initial guess
	var delta = Math.abs(Number($("#tol").val()));//Solve until delta is less than this
	if (delta < 1e-6)//Minimum delta to check for
		delta = 1e-6;
	var diff = delta + 1;//The actual change between the iterations
	var prevDiff = diff;
	var inc = 0;
	var limit = Math.abs(Number($("#iter").val()));
	if (limit > 100)//No more than 100 iterations
		limit = 100;
	if (limit < 10)//No less than 10 iterations
		limit = 10;
	var diverged = false;
	while (Math.abs(diff) > delta && inc < limit)
	{
		diff = g.evaluate({x:zero})/d.evaluate({x:zero});
		zero -= diff;
		if (Math.abs(zero)==Infinity || isNaN(zero) || (inc > 5 && Math.abs(diff) - Math.abs(prevDiff) > 1))//Divergence check
		{
			console.log("Diverging from solution");
			diverged = true;
			break;
		}
		prevDiff = diff;
		inc++;
		//console.log(zero);
	}
	if (!diverged)
	{
		var exps = nerdamer.expressions(true,true);
		var math = MathJax.Hub.getAllJax("solution")[0];//Get the current MathJax jax instance
		MathJax.Hub.Queue(["Text",math,exps[3] + " = 0"]);
		var math = MathJax.Hub.getAllJax("solution")[1];
		MathJax.Hub.Queue(["Text",math,"x = "+String(zero)]);
		$("#solution").show();
		$("#diverge").hide();
		$("#nostart").hide();
		graph_f(zero-5,zero+5,zero,step);
	}
	else
	{
		$("#solution").hide();
		$("#diverge").show();
		$("#nostart").hide();
	}
}

//Finds two points of the function. One is positive, one is negative.
function bisection(){
	var zero = Number($("#guess").val());//Initial guess
	var diverged = true;
	if (g.evaluate({x:zero}) != 0)//If the guess isn't a zero point
	{
		var a = 0, b = 0;
		var aSet = false, bSet = false;
		var j = zero;
		for(var i = zero; i<zero+1000; i+= 0.0469, j -= 0.0469)
		{
			if (aSet == false && g.evaluate({x:i}) > 0)
			{
				a = i;
				aSet = true;
			}
			if (a == false && g.evaluate({x:j}) > 0)
			{
				a = j;
				aSet = true;
			}
			if (b == false && g.evaluate({x:i}) < 0)
			{
				b = i;
				bSet = true;
			}
			if (b == false && g.evaluate({x:j}) < 0)
			{
				b = j;
				bSet = true;
			}
			if (aSet && bSet)
			{
				console.log(a);
				console.log(b);
				diverged = false;
				zero = bisect(a,b);
				break;
			}
		}
	}
	else
	{
		diverged = false;
	}
	
	if (!diverged)
	{
		var exps = nerdamer.expressions(true,true);
		var math = MathJax.Hub.getAllJax("solution")[0];//Get the current MathJax jax instance
		MathJax.Hub.Queue(["Text",math,exps[3] + " = 0"]);
		var math = MathJax.Hub.getAllJax("solution")[1];
		MathJax.Hub.Queue(["Text",math,"x = "+String(zero)]);
		$("#solution").show();
		$("#diverge").hide();
		$("#nostart").hide();
		graph_f(zero-5,zero+5,zero,step);
	}
	else
	{
		$("#solution").hide();
		$("#diverge").hide();
		$("#nostart").show();
	}
}

//Finds zero given two points. a above, b below zero
function bisect(a,b){
	var delta = Math.abs(Number($("#tol").val()));//Solve until delta is less than this
	if (delta < 1e-6)//Minimum delta to check for
		delta = 1e-6;
	var inc = 0;
	var limit = Math.abs(Number($("#iter").val()));
	if (limit > 10000)//No more than 10000 iterations
		limit = 10000;
	if (limit < 1000)//No less than 1000 iterations
		limit = 1000;
	var mid = (a+b)/2;//Midpoint of the two current endpoints
	while (Math.abs(g.evaluate({x:mid})) > delta && inc < limit)
	{
		mid = (a+b)/2;
		if (g.evaluate({x:mid}) > 0)
		{
			a = mid;
		}
		else
		{
			b = mid;
		}
		inc++;
	}
	return mid;
}

function graph_f(lim1, lim2, mid, step){
	$(function() {

		var y_0 = f1.evaluate({x:mid});
		var y1 = [], y2 = [], y3 = [];
		for (var i = lim1; i < lim2; i+= step)
		{
			var val1,val2;
			val1 = f1.evaluate({x:i});
			val2 = f2.evaluate({x:i});
			y1.push([i,val1]);
			y2.push([i,val2]);
			y3.push([i,val1-val2]);
		}
		//console.log(y1.length);
		$.plot("#graph", [{label: "f1",
			data: y1},
			{label: "f2",
			data: y2}],
			{
			yaxis:
			{
				min:y_0-5, max:y_0+5, tickSize: 1
			}
			});
		//$.plot("#graph", [y1, y2, y3]);

	});
}
