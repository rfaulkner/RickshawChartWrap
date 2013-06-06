/*
* jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, unused:true,
* curly:true, browser:true, indent:4, maxerr:50
*
* Author:     Ryan Faulkner
* Date:       2013-05-31
* File:       main.js
*
* Defines the getChart method used to generate "line-chart" elements for visualization of time series data.
* Depends on d3.js.
*/

"use strict";

var timeFormat = d3.time.format("%e %B");
var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);


function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/*
*  Returns a closure that can be called to generate a "line-chart" element
*
*  Parameters:
*      @id         - numeric id for element (e.g. <div id="line-chart-2"></div>)
*      @title      - Plot title
*
*/
function getChart(id, title) {
    return function(data) {

        /*
         *  "data" should contain attributes 'time_of_record' (date string) and 'count' (integer)
         */

        var maxValue = 0, sampleSize;
        var labelArray = [], valueArray = [];

        sampleSize = data.length;

        // Format Data
        for (var i=0; i < sampleSize; i++) {
            labelArray[i] = new Date(data[i][0]);
            valueArray[i] = { x: labelArray[i], y: parseInt(data[i][1], 10) };
            maxValue = Math.max(maxValue, parseFloat(data[i][1]));
        }

        // Max element
        maxValue = (1 + Math.floor(maxValue / 10)) * 10;

        var  w = 815, h = 300, p = 100,
            x = d3.time.scale().domain([ labelArray[0], labelArray[sampleSize-1] ]).range([0, w]),
            y = d3.scale.linear().domain([0, maxValue]).range([h, 0]);

        var vis = d3.select("#line-chart-".concat(id))
            .data([valueArray])
            .append("svg:svg")
            .attr("width", w + p * 1.5)
            .attr("height", h + p * 1.5)
            .append("svg:g")
            .attr("transform", "translate(" + p + "," + p + ")");

        var rules = vis.selectAll("g.rule")
            .data(x.ticks(15))
            .enter().append("svg:g")
            .attr("class", "rule");

        var y_axis = d3.svg.axis().scale(y).orient("left");
        var x_axis  = d3.svg.axis().scale(x).tickFormat(timeFormat);

        // Draw grid lines
        // ===============

        rules.append("svg:line")
            .attr("x1", x)
            .attr("x2", x)
            .attr("y1", 0)
            .attr("y2", h - 1);

        rules.append("svg:line")
            .attr("class", function(d) { return d ? null : "axis"; })
            .data(y.ticks(10))
            .attr("y1", y)
            .attr("y2", y)
            .attr("x1", 0)
            .attr("x2", w - 10);


        // Draw Axes
        // =========

        d3.select("#line-chart-".concat(id))
            .select("svg")
            .append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(" + p + "," + (h + p)  + ")")
            .call(x_axis);

        d3.select("#line-chart-".concat(id)).
            select(".x.axis")
            .append("text")
            .text("Date")
            .attr("x", (w / 2) - p)
            .attr("y", p / 3);

        d3.select("#line-chart-".concat(id))
            .select("svg")
            .append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + p + "," + p + ")")
            .call(y_axis);


        // Draw the series
        // ===============

        vis.append("svg:path")
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", "maroon")
            .attr("stroke-width", 1)
            .attr("d", d3.svg.line()
                .x(function(d) { return x(d.x); })
                .y(function(d) { return y(d.y); }));

        vis.selectAll("circle.line")
            .data(valueArray)
            .enter().append("svg:circle")
            .attr("class", "line")
            .attr("fill", "maroon" )
            .attr("cx", function(d) { return x(d.x); })
            .attr("cy", function(d) { return y(d.y); })
            .attr("r", 3)
            .on("mouseover", function(d) {
                div.transition()
                    .duration(200)
                    .style("opacity", 0.9);
                div .html(timeFormat(d.x) + "<br/>"  + numberWithCommas(d.y))
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        vis.append("svg:text")
            .attr("x", w/2)
            .attr("y", 0)
            .text(title)
            .attr("class", "underline");
    };
}
