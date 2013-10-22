
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
var MILLISECONDS_PER_DAY = 3600000 * 24;
var MILLISECONDS_PER_MINUTE = 60000;

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
                      /* Array|string */ series_data,
                      /* String */ render_type,
                      /* String */ docs,
                      /* Array */ annotations,
                      /* string */ formatter_handle,
                      /* boolean */ is_ajax
    ) {

    formatter_handle = typeof formatter_handle !== 'undefined' ? formatter_handle : '';

    var formatter = new Formatter();

    if (is_ajax) {
        return new Chart(id, series_data, render_type).
            buildGraph({
                'ajax': true,
                'formatter_handle': formatter_handle,
                'docs': docs,
                'annotations': annotations
            });
    } else {
        return new Chart(id, series_data, render_type).
              buildGraph({}).
              buildSlider().
              buildHoverDetail(formatter.getFormatter(formatter_handle)).
              buildAxes().
              buildLegend().
              buildDocs(docs).
              buildAnnotation(annotations);
    }
}


/**
 *
 *  Stores different formatters for Rickshaw hover detail objects.  Useful for customizing
 *  formatters for time-series or other types of plots.
 *
 */
function Formatter() {

    var formatterContext = this;

    this.numberWithCommas = function (/* int */ value) {
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    this.Formatters = {

        'timeseries_1': {

            formatter: function(/* array */ series, /* int - unix_timestamp */ x, /* int  */ y) {

                var date = new Date(x * 1000 + MILLISECONDS_PER_DAY);
                var dateStr = '<span class="date">' + date.toDateString() + ' ' + date.getUTCHours() + 'H' + '</span>';
                var swatch = '<span class="detail_swatch" style="background-color: ' + series.color + '"></span>';
                return swatch + series.name + ": " + formatterContext.numberWithCommas(y) + '<br>' + dateStr;
            },
            xFormatter: function(x) {
                var date = new Date(x * 1000 + MILLISECONDS_PER_DAY);
                return date.toDateString()
            }
        },

        'integer_1': {

            formatter: function(/* array */ series, /* int - unix_timestamp */ x, /* int  */ y) {
                var swatch = '<span class="detail_swatch" style="background-color: ' + series.color + '"></span>';
                return swatch + series.name + ": " + formatterContext.numberWithCommas(x) + ',' + formatterContext.numberWithCommas(y);
            },
            xFormatter: function(x) {
                return formatterContext.numberWithCommas(x);
            }
        },

        'confidence': {

            formatter: function(/* array */ series, /* int - unix_timestamp */ x, /* int  */ y) {
                var swatch = '<span class="detail_swatch" style="background-color: ' + series.color + '"></span>';
                return swatch + series.name + " count: " + formatterContext.numberWithCommas(y);
            },
            xFormatter: function(x) {
                return 'Confidence Level - ' + x;
            }
        }
    };

    this.getFormatter = function (/* string */ formatter_type) {

        switch (formatter_type) {
            case 'timeseries_1':
                return formatterContext.Formatters.timeseries_1;

            case 'integer_1':
                return formatterContext.Formatters.integer_1;

            case 'confidence':
                return formatterContext.Formatters.confidence;

            default:
                return formatterContext.Formatters.timeseries_1;
        }
    };

    return this;
}

/**
 *  Compares numeric independent variable values for Rickshaw formatted plot.
 */
function compareDataSeries(a,b) {
    if (a.x < b.x)
        return -1;
    if (a.x > b.x)
        return 1;
    return 0;
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
               /* Array */ render_type
    ) {

    this.id = id;
    this.series_data = series_data;
    this.render_type = render_type;
    this.built = false;

    /**
     *  Builds a chart object that wraps a variety of RickShaw chart features.  An Ajax
     *  chart that updates minutely can be created by specifying 'isAjax' in args and
     *  supplying a data URL.
     */
    this.buildGraph = function (args) {

        if (args === undefined) {
            args = {};
        }
        var minVal =  args['min'] != undefined ? args.min : 0;
        var isAjax =  args['ajax'] != undefined ? args.ajax : false;

        if (isAjax) {

            var formatter = new Formatter();
            var _this = this;

            this.ajaxGraph = new Rickshaw.Graph.Ajax( {

                element: document.getElementById("chart" + this.id),
                width: WIDTH,
                height: HEIGHT,
                renderer: this.render_type,
                dataURL: this.series_data,

                onData: function(d) {
                    d[0].data.sort(compareDataSeries);
                    return d },

                onComplete: function(rsThis) {

                    // On the first call build the chart artifacts
                    if (!_this.built) {
                        _this.graph = rsThis.graph;
                        _this.buildSlider().
                            buildHoverDetail(formatter.getFormatter(args.formatter_handle)).
                            buildAxes().
                            buildLegend().
                            buildDocs(args.docs).
                            buildAnnotation(args.annotations);
                        _this.built = true;
                    }
                    _this.graph.render();
                }
            } );

            this.interval = setInterval( function() { _this.ajaxGraph.request(); },
                MILLISECONDS_PER_MINUTE);

        } else {
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
            this.built = true;
        }
        return this;
    };

    this.buildSlider = function () {
        this.slider = new Rickshaw.Graph.RangeSlider({
            graph: this.graph,
            element: $('#slider' + this.id)
        });
        return this;
    };

    this.buildHoverDetail = function (/* Formatter */ formatter_def) {
        this.hoverDetail = new Rickshaw.Graph.HoverDetail( {
            graph: this.graph,
            formatter: formatter_def.formatter,
            xFormatter: formatter_def.xFormatter
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
                        this.series_data[i].data[j].y].join(':') + "\n";
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
     * Add annotations to the chart.
     *
     * @param timestamp     - Timestamp of annotation.
     * @param message       - Annotation text.
     */
    this.buildAnnotation = function (/* String */ annotations) {

        var annotator = new Rickshaw.Graph.Annotate({
            graph: this.graph,
            element: document.getElementById("timeline" + this.id)
        });

        // Add annotations
        for (var j = 0; j < annotations.length; j++) {
            annotator.add(annotations[j][0], annotations[j][1]);
        }
        return this;
    };

    return this;
}