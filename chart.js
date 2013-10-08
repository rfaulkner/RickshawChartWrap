
/*
 * jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, unused:true,
 * curly:true, browser:true, indent:4, maxerr:50, newcap:true
 *
 * Author:     Ryan Faulkner
 * Date:       2013-06-10
 * File:       chart.js
 *
 * Defines the chart object for ydash.
 *
 */


"use strict";

// Chart dimensions
var WIDTH = 640;
var HEIGHT = 300;

/**
 * Create chart elements based on Rickshaw library.
 *
 * @param id            - Chart id.
 * @param series_data   - [{data: [{x: <x>, y: <y>},+] color: <color>, name: <name>},+]
 * @param render_type   - Rickshaw render type of the plot.
 * @param docs          - comments for this chart.
 *
 */
function chartFactory(/* int */ id,
                      /* Array */ series_data,
                      /* String */ render_type,
                      /* String */ docs) {

    return new Chart(id, series_data, render_type, docs).
        buildGraph().
        buildSlider().
        buildHoverDetail().
        buildAxes().
        buildLegend().
        buildDocs(docs);
}


/**
 * Create chart elements based on Rickshaw library.
 *
 * @param id            - Chart id.
 * @param series_data   - [{data: [{x: <x>, y: <y>},+] color: <color>, name: <name>},+]
 * @param render_type   - Rickshaw render type of the plot.
 *
 */
function Chart(/* int */ id,
               /* Array */ series_data,
               /* Array */ render_type) {

    this.id = id;
    this.series_data = series_data;
    this.render_type = render_type;

    this.buildGraph = function (args) {

        if (args === undefined) {
            args = {};
        }
        var minVal =  args['min'] != undefined ? args.min : 0;

        this.graph = new Rickshaw.Graph( {
            element: document.querySelector("#chart" + this.id),
            width: WIDTH,
            height: HEIGHT,
            renderer: this.render_type,
            preserve: true,
            series: this.series_data,
            min: minVal
        } );
        this.graph.render();
        return this;
    };

    this.buildSlider = function () {
        this.slider = new Rickshaw.Graph.RangeSlider({
            graph: this.graph,
            element: $('#slider' + this.id)
        });
        return this;
    };

    this.buildHoverDetail = function () {
        this.hoverDetail = new Rickshaw.Graph.HoverDetail( {
            graph: this.graph
        });
        return this;
    };

    this.buildAxes = function () {
        this.x_axis = new Rickshaw.Graph.Axis.Time( { graph: this.graph } );
        this.x_axis.render();

        this.y_axis = new Rickshaw.Graph.Axis.Y( {
            graph: this.graph,
            orientation: 'left',
            tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
            element: document.getElementById('y_axis' + this.id)
        } );
        this.y_axis.render();
        return this;
    };

    this.buildLegend = function () {

        this.legend = new Rickshaw.Graph.Legend({
            graph: this.graph,
            element: document.querySelector('#legend' + this.id)
        });

        this.shelving = new Rickshaw.Graph.Behavior.Series.Toggle({
            graph: this.graph,
            legend: this.legend
        });

        this.highlighter = new Rickshaw.Graph.Behavior.Series.Highlight({
            graph: this.graph,
            legend: this.legend
        });

        this.order = new Rickshaw.Graph.Behavior.Series.Order({
            graph: this.graph,
            legend: this.legend
        });
        return this;
    };

    /*
     * Create a CSV from the series data.
     */
    this.getCSV = function () {
        var i,j;
        var out = "name,x,y\n";
        for (i = 0; i < this.series_data.length; i++) {
            for (j = 0; j < this.series_data[i].data.length; j++) {
                out += [this.series_data[i].name,
                    this.series_data[i].data[j].x,
                    this.series_data[i].data[j].y].join(',') + "\n";
            }
        }
        return out;
    };

    /*
     * Add documentation to the chart.
     *
     * @param text   - The documentation content.
     */
    this.buildDocs = function (/* String */ text) {
        this.docs =  text != undefined ? text : '_';
        document.getElementById("chart_docs" + this.id).innerHTML = this.docs;
        return this;
    };

     /*
     * Add annotation to the chart.
     *
     * @param timestamp     - Timestamp of annotation.
     * @param message       - Annotation text.
     */
    this.buildAnnotaton = function (/* String */ timestamp, /* String */ message) {

        console.log('annotate');
        var annotator = new Rickshaw.Graph.Annotate({
            graph: this.graph,
            element: document.getElementById("timeline" + this.id)
        });
        annotator.add(timestamp, message);
        return this;
    };

    return this;
}