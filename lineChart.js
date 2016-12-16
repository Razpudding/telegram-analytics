/*
* Created by Laurens Aarnoudse
* This file will hold the linechart code
* Steps:
*	v 1. Try blocks example on codepen, change every line http://bl.ocks.org/mbostock/3883245
*	V 2. Change blocks example to match my data
*	V 3. Make chart work with my data
*	4. Add additional data buckets to switch between posters or months
*	TODO: Find a way to order data by days/weeks/or months
*	TODO: Format data
*/
var messagesPerDay;

function buildLineChart(svg, data)
{	
	var select  = d3.select("#lineChartDropDown").on("change", onChange);
	var selectedIndex = d3.select("#lineChartDropDown").property('selectedIndex');
	var name = d3.select("#lineChartDropDown").selectAll('option')[0][selectedIndex].text;
	
	var margin = {top: 20, right: 20, bottom: 30, left: 50},
	    width = 960 - margin.left - margin.right,
	    height = 500 - margin.top - margin.bottom;

	var x = d3.time.scale()
	    .range([0, width]);

	var y = d3.scale.linear()
	    .range([height, 0]);

	var xAxis = d3.svg.axis()
	    .scale(x)
	    .orient("bottom");

	var yAxis = d3.svg.axis()
	    .scale(y)
	    .orient("left");

	svg.append("g")
	  .attr("class", "x axis")
	  .attr("transform", "translate(0," + height + ")")
	  .call(xAxis);

	svg.append("g")
	  .attr("class", "y axis")
	  .call(yAxis)
	.append("text")
	  .attr("transform", "rotate(-90)")
	  .attr("y", 6)
	  .attr("dy", ".71em")
	  .style("text-anchor", "end")
	  .text("messages per day");

	update(name);

	function update(name)
	{
		console.log("update called with name: " + name);

		var selectedData = countMessagesPerDay(data[name]);
		selectedData.forEach(function(d) { d.date = new Date(d.key); });

		var line = d3.svg.line()
		    .x(function(d) { return x(d.date); })
		    .y(function(d) { return y(d.values.length)} );
		line.interpolate('step-after');

		x.domain(d3.extent(selectedData,function(d) {return d.date;}));
		y.domain(d3.extent(selectedData, function(d) { return d.values.length; }));
		//console.log("xdomain: " + x.domain());
		//console.log("ydomain: " + y.domain());

		var body = d3.select("body").transition();	//This is a weird trick I dont fully understand
		body.select(".lineChart .x.axis")
            .duration(750)
            .call(xAxis);
        body.select(".lineChart .y.axis")
            .duration(750)
            .call(yAxis);

		d3.select(".line")
		  .datum(selectedData)
		  .attr("d", line);
	}

	//adapted from https://stackoverflow.com/questions/11903709/adding-drop-down-menu-using-d3-js/11907096#11907096
	function onChange() {
		//console.log(select);
		var selectedIndex = d3.select("#lineChartDropDown").property('selectedIndex');
		var name          = d3.select("#lineChartDropDown").selectAll('option')[0][selectedIndex].text;
		update(name); //This should prob be used to a more global control module
	}
}



function countMessagesPerDay(messageData){
	//console.table(messageData);
	messageData.forEach(function(d) { d.date.setHours(0,0,0,0); });

	messagesPerDay = d3.nest()
  		.key(function(d) { return d.date })
  		.entries(messageData);
  	//console.table(messagesPerDay);
  	return messagesPerDay;
}