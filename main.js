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

/**
 * Unpacks data timestamp and count data into SVG Chart Object
 *
 * @param data      - array of tuples containing date stamp and count
 * @param id        - id of chart element
 */
function d3SVGChartObject(/* array[[str, int], ...] */ data,
                          /* int */ id) {
    this.max = 0;
    this.labels = [];
    this.values = [];

    // Unpack the chart data
    for (var i=0; i < data.length; i++) {

        this.labels[i] = new Date(data[i][0]);

        this.values[i] = {
            x: this.labels[i],
            y: parseInt(data[i][1], 10)
        };

        this.max = Math.max(this.max, parseFloat(data[i][1]));
    }

    // Max element
    this.max = (1 + Math.floor(this.max / 10)) * 10;

    // Set the frame width, height, and offset
    this.w = 815;
    this.h = 300;
    this.p = 100;

    this.x = d3.time.scale().domain([ this.labels[0], this.labels[data.length-1] ]).range([0, this.w]);
    this.y = d3.scale.linear().domain([0, this.max]).range([this.h, 0]);

    this.frame = d3.select("#line-chart-".concat(id))
        .data([this.values])
        .append("svg:svg")
        .attr("width", this.w + this.p * 2)
        .attr("height", this.h + this.p * 2);

    this.vis = this.frame.append("svg:g")
        .attr("transform", "translate(" + this.p + "," + this.p + ")");

    this.rules = this.vis.selectAll("g.rule")
        .data(this.x.ticks(15))
        .enter().append("svg:g")
        .attr("class", "rule");

    this.y_axis = d3.svg.axis().scale(this.y).orient("left");
    this.x_axis  = d3.svg.axis().scale(this.x).tickFormat(timeFormat);
}

/**
 * Draws a path based on a chart object,
 *
 * @param chart_obj       - chart object on which to draw.
 * @param stroke_clr      - stroke colour.
 * @param stroke_width    - stroke width.
 */
function drawSVGPath(/* d3SVGChartObject */ chart_obj,
                     /* string */ stroke_clr,
                     /* int */ stroke_width) {
    chart_obj.vis.append("svg:path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", stroke_clr)
        .attr("stroke-width", stroke_width)
        .attr("d", d3.svg.line()
            .x(function(d) { return chart_obj.x(d.x); })
            .y(function(d) { return chart_obj.y(d.y); }));
    return chart_obj;
}

/**
 * Draws a grid over an SVG chart object
 *
 * @param chart_obj       - chart object on which to draw.
 */
function drawSVGGrid(/* d3SVGChartObject */ chart_obj) {
    chart_obj.rules.append("svg:line")
        .attr("x1", chart_obj.x)
        .attr("x2", chart_obj.x)
        .attr("y1", 0)
        .attr("y2", chart_obj.h - 1);

    chart_obj.rules.append("svg:line")
        .attr("class", function(d) { return d ? null : "axis"; })
        .data(chart_obj.y.ticks(10))
        .attr("y1", chart_obj.y)
        .attr("y2", chart_obj.y)
        .attr("x1", 0)
        .attr("x2", chart_obj.w - 10);
    return chart_obj
}

/**
 * Draws axes over an SVG chart object.
 *
 * @param chart_obj       - chart object on which to draw.
 */
function drawSVGAxes(/* d3SVGChartObject */ chart_obj, id) {
    d3.select("#line-chart-".concat(id))
        .select("svg")
        .append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(" + chart_obj.p + "," + (chart_obj.h + chart_obj.p)  + ")")
        .call(chart_obj.x_axis);

    d3.select("#line-chart-".concat(id)).
        select(".x.axis")
        .append("text")
        .text("Date")
        .attr("x", (chart_obj.w / 2))
        .attr("y", chart_obj.p / 3);

    d3.select("#line-chart-".concat(id))
        .select("svg")
        .append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + chart_obj.p + "," + chart_obj.p + ")")
        .call(chart_obj.y_axis);
    return chart_obj;
}

/**
 * Draws tooltip points over a path defined on the chart object.
 *
 * @param chart_obj       - chart object on which to draw.
 */
function drawSVGTooltipPoints(/* d3SVGChartObject */ chart_obj) {
    chart_obj.vis.selectAll("circle.line")
        .data(chart_obj.values)
        .enter().append("svg:circle")
        .attr("class", "line")
        .attr("fill", "maroon" )
        .attr("cx", function(d) { return chart_obj.x(d.x); })
        .attr("cy", function(d) { return chart_obj.y(d.y); })
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
    return chart_obj;
}

/**
 * Draws a path based on a chart object.
 *
 * @param chart_obj       - chart object on which to draw.
 * @param stroke_clr      - stroke colour.
 * @param stroke_width    - stroke width.
 */
function drawSVGChartTitle(/* d3SVGChartObject */ chart_obj, title) {
    chart_obj.frame.append("svg:text")
        .attr("x", chart_obj.w / 2 + chart_obj.p)
        .attr("y", chart_obj.p - chart_obj.p / 10)
        .text(title)
        .attr("class", "underline");
    return chart_obj;
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
        var chart_obj = new d3SVGChartObject(data, id);

        // Render the plot
        drawSVGGrid(chart_obj);
        drawSVGAxes(chart_obj, id);
        drawSVGPath(chart_obj, "maroon", 1);
        drawSVGTooltipPoints(chart_obj);
        drawSVGChartTitle(chart_obj, title);
    };
}
