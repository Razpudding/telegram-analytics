/*
* Created by Laurens Aarnoudse
* TODO
* Create graph per month with activity per person (change months with interactive button by using filter)
* Restructure so that index sets up the canvas, calls different class per chart (like linechart)
* Add example TSV file with fake telegram data so the repo works, change gitignore so this file is included
* Make nicer filestructure with data and src
* Allow main graph height to be dependable on dropdown with the vars collected per person :)
*/

//(function(){ //disabled iffe for now to access vars from console .TODO: turn back on
var sourceTSV = "dummy_data.tsv";  //Change this line to point to your local telegram data file
//var sourceTSV = "telegram_data.tsv";  //Change this line to point to your local telegram data file

//var sourceTSV = "metabol.tsv";  //Change this line to point to your local telegram data file

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
  data = groupMessages(d3.tsv.parse(headers +"\n"+ data));  //Load data as tsv and group by name of the poster
  var valOptionsArr = ["averageActivity", "exclamations",  "questions", "monthsActive", "length"];
  var yVal = "length";
  var colorVal = "averageActivity";

  var barChartDropDown = d3.select("#barChartDropDown").on("change", onChange);

  //Fill the dropdowns with the names of the posters from the data and the possible options
  var nameOptions = d3.select("#lineChartDropDown").selectAll('option').data(d3.keys(data));
  var valOptions = d3.select("#barChartDropDown").selectAll('option').data(valOptionsArr);
  nameOptions.enter().append("option").text(function(d,i) { return d; });
  valOptions.enter().append("option").text(function(d,i) { return d; });
  //TODO: combine two lines below
  var selectedIndex = barChartDropDown.property('selectedIndex');
  var name = barChartDropDown.selectAll('option')[0][selectedIndex].text;

  buildLineChart(lineChart, data);

  x.domain(Object.keys(data));  //use Object.keys(myObject) to get an array of keys in the object
  y.domain([0, d3.max(d3.values(data), function(d) { return d[yVal]; } ) ]); //use d3.values to get an array of values from the object
  colorScale.domain([0, d3.max(d3.values(data), function(d) { return d[colorVal]; } ) ]);  //This should be a calculation prob something like last message timestamp -first

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
    .attr("y", function(d) { return y(d[yVal]); })
    .attr("width", barWidth)
    .attr("height", 0)
    .attr("fill", function(d) { return colorScale(d[colorVal]); })  //Todo this should divide the #messages by the delta month between first and last message
    .transition()
      .delay(function(d,i) { return 150 * i; })
      .duration(300)
      .ease("linear")
      .attr("height", function(d) { return height - y(d[yVal]); });

    bar.selectAll("rect")
    .append("svg:title")    //svg title adds a title element, which makes use of the browers native tooltip function
      .text(function(d) { return d[colorVal]; });

    bar.append("text")
      .attr("dx", "1em")
      .attr("y", function(d) {
        return y(d[yVal]);
      })
      .attr("dy", "-1em")
      .text(function(d) {
        return d[yVal];
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

    function onChange(event) {
      var selectedIndex = barChartDropDown.property('selectedIndex');
      var option        = barChartDropDown.selectAll('option')[0][selectedIndex].text;
      console.log(option);
      //update(option);
    };
});

function groupMessages(messageData){
  //Code adapted from: http://stackoverflow.com/questions/23864180/counting-data-items-in-d3-js
  var groupedMessages = [];
  

  for (var i = 0; i < messageData.length; i++){  
    var item = messageData[i];
    //console.log(i + " " + item.date);
    //IMPORTANT: Code below is needed because sometimes people use tabs (or maybe linefeeds?) in their text
    //This causes a new item to be created which doesn't have a valid date, breaking the code.
    //For now I'm skipping these breaking ines from my data
    if (item.date === undefined)
    {
      // console.log("undef date: ");
      // console.log(item);
      // console.log(item.name);
      continue;
      //item.date = messageData[i-1].date;
    }
    else {
      item.date = new Date(item.date.substr(4, 2)+"."+item.date.substr(1, 2)+"."+item.date.substr(7));
    }
    //IMPORTANT: if the date is invalid for whatever reason, make it equal to the previous date
    //Even is this is a message by a different person, it will be the closest to the actual date
    if (isNaN(item.date)){
      item.date = messageData[i-1].date;
    }
    if (!groupedMessages[item.name]){
      groupedMessages[item.name] = [];
    }
    groupedMessages[item.name].push({date: item.date, message:item.message});
  }

  //Compute the deltatime between last and first post for each poster in months
  for (var t in groupedMessages)
  {
    //TODO: Probably dont need this bit anymore since invalid dates are fixed above
    var lastDate = groupedMessages[t][groupedMessages[t].length -1].date;
    if (isNaN( lastDate.getTime()))
    {
      lastDate = groupedMessages[t][groupedMessages[t].length - 2].date;
    }

    groupedMessages[t].plusOne = 0;
    groupedMessages[t].plusTwo = 0;
    groupedMessages[t].exclamations = 0;
    groupedMessages[t].questions = 0;

    for (var j in groupedMessages[t]){
      if (groupedMessages[t][j].message === undefined)
      {
        break;  //TODO: fix this dirty hack. this loop also includes properties like plusone which dont have a message component
      }
      if(groupedMessages[t][j].message.includes("!"))
      {
        groupedMessages[t].exclamations ++;
      }
      if(groupedMessages[t][j].message.includes("?"))
      {
        groupedMessages[t].questions ++;
      }
      if(groupedMessages[t][j].message.includes("+1"))
      {
        groupedMessages[t].plusOne ++;
      }
      else if(groupedMessages[t][j].message.includes("+2"))
      {
        groupedMessages[t].plusTwo ++;
      }
    }

    //from milliseconds to seconds to mintes to hours to days to months
    //+1 because posting once means you were active in one month
    groupedMessages[t].monthsActive = 1 + (lastDate - groupedMessages[t][0].date)/1000 /60 /60 /24 /30;  
    groupedMessages[t].averageActivity = Math.round(groupedMessages[t].length / groupedMessages[t].monthsActive);
  }
  //console.table(groupedMessages);
  globalData = groupedMessages;
  return groupedMessages;
}
//}()); 