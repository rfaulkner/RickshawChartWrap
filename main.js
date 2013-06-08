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

    /**
     * Draws a path based on a chart object,
     *
     * @param stroke_clr      - stroke colour.
     * @param stroke_width    - stroke width.
     * @param index           - index of 'y' value.  Defaults to 1.
     */
    this.drawSVGPath = function (/* string */ stroke_clr, /* int */ stroke_width, /* int */ index) {
        if(typeof(index)==='undefined') index = 1;
        var x = this.x;
        var y = this.y;
        this.vis.append("svg:path")
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", stroke_clr)
            .attr("stroke-width", stroke_width)
            .attr("d", d3.svg.line()
                .x(function(d) { return x(d.x); })
                .y(function(d) { return y(d['y' + index]); }));
        return this;
    };


    /**
     * Draws tooltip points over a path defined on the chart object.
     *
     * @param index           - index of 'y' value.  Defaults to 1.
     * @param radius          - tune radius of circle.  Defaults to 2.
     */
    this.drawSVGTooltipPoints = function (/* int */ index, /* int */ radius) {
        if(typeof(index)==='undefined') index = 1;
        if(typeof(radius)==='undefined') radius = 2;
        var x = this.x;
        var y = this.y;
        this.vis.selectAll("circle.line" + index)
            .data(this.values)
            .enter()
            .append("svg:circle")
            .attr("class", "line")
            .attr("cx", function(d) { return x(d.x); })
            .attr("cy", function(d) { return y(d['y' + index]); })
            .attr("r", radius)
            .on("mouseover", function(d) {
                div.transition()
                    .duration(200)
                    .style("opacity", 0.9);
                div .html(timeFormat(d.x) + "<br/>"  + numberWithCommas(d['y' + index]))
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
        return this;
    };

    /**
     * Draws a grid over an SVG chart object
     */
    this.drawSVGGrid = function () {
        this.rules.append("svg:line")
            .attr("x1", this.x)
            .attr("x2", this.x)
            .attr("y1", 0)
            .attr("y2", this.h - 1);
        this.rules.append("svg:line")
            .attr("class", function (d) { return d ? null : "axis"; })
            .data(this.y.ticks(10))
            .attr("y1", this.y)
            .attr("y2", this.y)
            .attr("x1", 0)
            .attr("x2", this.w - 10);
        return this;
    };

    /**
     * Draws axes over an SVG chart object.
     */
    this.drawSVGAxes = function (id) {
        d3.select("#line-chart-".concat(id))
            .select("svg")
            .append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(" + this.p + "," + (this.h + this.p)  + ")")
            .call(this.x_axis);
        d3.select("#line-chart-".concat(id)).
            select(".x.axis")
            .append("text")
            .text("Date")
            .attr("x", (this.w / 2))
            .attr("y", this.p / 2);
        d3.select("#line-chart-".concat(id))
            .select("svg")
            .append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + this.p + "," + this.p + ")")
            .call(this.y_axis);
        return this;
    };


    /**
     * Draws a path based on a chart object.
     *
     * @param title      - Plot title.
     */
    this.drawSVGChartTitle = function (title) {
        this.frame.append("svg:text")
            .attr("x", this.p)
            .attr("y", this.p - this.p / 2)
            .text(title)
            .attr("class", "underline");
        return this;
    };

    /**
     * Draws a path based on a chart object.
     *
     * @param title         - Plot title.
     * @param items         - [{"colour": str, "name": str}+]
     * @param x             - Plot title.
     * @param y             - Plot title.
     * @param x_offset      - Plot title.
     * @param y_offset      - Plot title.
     */
    this.drawSVGLegend = function (title, items, x, y, x_offset, y_offset) {

        this.vis.append("svg:text")
            .attr("x", x)
            .attr("y", y)
            .text(title)
            .attr("class", "legend_title");

        // TODO - Add a background

        for (var i=0; i < items.length; i++) {
            this.vis.append("svg:rect")
                .attr("x", x + x_offset)
                .attr("y", y + y_offset * (i + 1) - y_offset * 0.6)
                .attr("stroke", items[i].colour)
                .attr("fill", items[i].colour)
                .attr("height", y_offset * 0.3)
                .attr("width", y_offset * 0.6);

            this.vis.append("svg:text")
                .attr("x", x + x_offset + 20)
                .attr("y", y + y_offset * (i + 1))
                .text(items[i].name)
                .attr("class", "legend_item");
        }
    };
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
        var width = 815, height = 300, buffer = 70;
        var chart_obj = new d3SVGChartObject(data, id, width, height, buffer);

        // Render the plot
        chart_obj.drawSVGGrid()
            .drawSVGAxes(id)
            .drawSVGPath("maroon",1)
            .drawSVGTooltipPoints()
            .drawSVGChartTitle(title)
    };
}
