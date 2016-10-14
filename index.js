/*
* Created by Laurens Aarnoudse
* TODO
* Create graph per month with activity per person (change months with interactive button by using filter)
* Restructure so that index sets up the canvas, calls different class per chart (like linechart)
* Add example TSV file with fake telegram data so the repo works, change gitignore so this file is included
* Make nicer filestructure with data and src
*/

//(function(){ //disabled iffe for now to access vars from console .TODO: turn back on
var sourceTSV ="Tel_20_08_2015.tsv";  //Change this line to point to your local telegram data file
var headers = ["name","date","message"].join("\t"); //This line holds the headers that will be added to the data

var margin = {
  top: 50,
  right: 30,
  bottom: 130,
  left: 39
};
var width = 1200 - margin.left - margin.right;
var height = 500 - margin.top - margin.bottom;

var y = d3.scale.linear().range([height, 0]);
var x = d3.scale.ordinal().rangeRoundBands([0, width], 0);
var colorScale = d3.scale.linear().range(["lightblue", "blue"]);

var barChart = d3.select(".chart")
    .attr("y", "400")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var lineChart = d3.select(".lineChart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
lineChart.append("path")
    .attr("class", "line");

var globalData; //temporarily global to allow access from brower console

d3.text(sourceTSV, function(error, data) {
  data = d3.tsv.parse(headers +"\n"+ data);
  data = groupMessages(data);//Let's group the data by name of the poster

  //Fill the droptown with the names of the posters from the data
  var options = d3.select("#lineChartDropDown").selectAll('option').data(d3.keys(data));
  options.enter().append("option").text(function(d,i) { return d; });

  buildLineChart(lineChart, data);

  //console.table(data);
  x.domain(Object.keys(data));  //use Object.keys(myObject) to get an array of keys in the object
  y.domain([0, d3.max(d3.values(data), function(d) { return d.length; } ) ]); //use d3.values to get an array of values from the object
  colorScale.domain([0, d3.max(d3.values(data), function(d) { return d.averageActivity; } ) ]);  //This should be a calculation prob something like last message timestamp -first

  var barWidth = width / x.domain().length;

  //We're creating a group per datum. By tranlating the group to the right position,
  //Its children wont need their x values set individually.
  var bar = barChart.selectAll("g")
      .data(d3.values(data))
    .enter().append("g")
      .attr("transform", function(d, i) {
        return "translate(" + i * barWidth + ",0)";
      });
      
  bar.append("rect")
    .attr("y", function(d) { return y(d.length) })
    .attr("width", barWidth)
    .attr("height", 0)
    .attr("fill", function(d) { return colorScale(d.averageActivity)})  //Todo this should divide the #messages by the delta month between first and last message
    .transition()
      .delay(function(d,i) { return 150 * i})
      .duration(300)
      .ease("linear")
      .attr("height", function(d) { return height - y(d.length)});

    bar.selectAll("rect")
    .append("svg:title")    //svg title adds a title element, which makes use of the browers native tooltip function
      .text(function(d) { return d.averageActivity});

    bar.append("text")
      .attr("dx", "1em")
      .attr("y", function(d) {
        return y(d.length);
      })
      .attr("dy", "-1em")
      .text(function(d) {
        return d.length;
      });

    var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .ticks(10);

    var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

    barChart.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .selectAll("text")
      .attr("dx", barWidth/2)
      .attr("dy", "2em")
      .attr("transform", "rotate(45)");

    barChart.append("g")
      .attr("class", "y axis")
      .call(yAxis);
});

function groupMessages(messageData){
  //Code adapted from: http://stackoverflow.com/questions/23864180/counting-data-items-in-d3-js
  var groupedMessages = [];
  for (var i = 0; i < messageData.length; i++){
    var item = messageData[i];

    if (!groupedMessages[item.name]){
      groupedMessages[item.name] = [];
    }
    item.date = new Date(item.date.substr(4, 2)+"."+item.date.substr(1, 2)+"."+item.date.substr(7));
    //IMPORTANT: if the date is invalid for whatever reason, make it equal to the previous date
    //Even is this is a message by a different person, it will be the closest to the actual date
    if (isNaN(item.date)){
      item.date = messageData[i-1].date;
    }

    groupedMessages[item.name].push({date: item.date, message:item.message});
  }

  //Compute the deltatime between last and first post for each poster in months
  for (var i in groupedMessages)
  {
    //TODO: Probably dont need this bit anymore since invalid dates are fixed above
    var lastDate = groupedMessages[i][groupedMessages[i].length -1].date;
    if (isNaN( lastDate.getTime()))
    {
      lastDate = groupedMessages[i][groupedMessages[i].length - 2].date;
    }

    groupedMessages[i].plusOne = 0;
    groupedMessages[i].plusTwo = 0;
    groupedMessages[i].exclamations = 0;
    groupedMessages[i].questions = 0;

    for (var j in groupedMessages[i]){
      if (groupedMessages[i][j].message == undefined)
      {
        break;  //TODO: fix this dirty hack. this loop also includes properties like plusone which dont have a message component
      }
      if(groupedMessages[i][j].message.includes("!"))
      {
        groupedMessages[i].exclamations ++;
      }
      if(groupedMessages[i][j].message.includes("?"))
      {
        groupedMessages[i].questions ++;
      }
      if(groupedMessages[i][j].message.includes("+1"))
      {
        groupedMessages[i].plusOne ++;
      }
      else if(groupedMessages[i][j].message.includes("+2"))
      {
        groupedMessages[i].plusTwo ++;
      }
    }

    //from milliseconds to seconds to mintes to hours to days to months
    //+1 because posting once means you were active in one month
    groupedMessages[i].monthsActive = 1 + (lastDate - groupedMessages[i][0].date)/1000 /60 /60 /24 /30;  
    groupedMessages[i].averageActivity = groupedMessages[i].length / groupedMessages[i].monthsActive;
  }
  //console.table(groupedMessages);
  globalData = groupedMessages;
  return groupedMessages;
}
//}()); 