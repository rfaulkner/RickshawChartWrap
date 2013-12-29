
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

var OVERFLOW = 10000000;
var OVERFLOW_ERR_MSG = "Too many datapoints aborting render.";

var SECONDS_PER_HOUR = 3600;
var SECONDS_PER_DAY = 3600 * 24;
var MILLISECONDS_PER_DAY = 3600000 * 24;
var MILLISECONDS_PER_MINUTE = 60000;

var RESOLUTION_HOURLY = 0;
var RESOLUTION_DAILY = 1;


/**
 * Create chart elements based on Rickshaw library.
 *
 * @param id            - Chart id.
 * @param series_data   - [{data: [{x: <x>, y: <y>},+] color: <color>, name: <name>},+]
 * @param render_type   - Rickshaw render type of the plot.
 * @param docs          - comments for this chart.
 *
 */
function chartFactory(/* string */ id,
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
 *  Re-slices the data depending on desired resolution. O(n).
 */
function recomputeDataByTime(data, resolution) {

    var new_time;
    var new_data = {};
    var i;

    // Compute hash with new {timestamp: count} values
    for (i = 0; i < data.length; i++) {

        if (resolution == RESOLUTION_DAILY) {
            new_time = parseInt(data[i].x / SECONDS_PER_DAY) * SECONDS_PER_DAY;
        } else if (resolution == RESOLUTION_HOURLY) {
            new_time = parseInt(data[i].x / SECONDS_PER_HOUR) * SECONDS_PER_HOUR;
        }

        if (!new_data.hasOwnProperty(new_time.toString())) {
            new_data[new_time.toString()] = data[i].y;
        } else {
            new_data[new_time.toString()] += data[i].y;
        }
    }

    data = [];
    for (var key in new_data) {
        if (new_data.hasOwnProperty(key)) {
            data.push({x: parseInt(key), y: new_data[key]});
        }
    }

    return data;
}

/**
 * Create chart elements based on Rickshaw library.
 *
 * @param id            - Chart id.
 * @param series_data   - [{data: [{x: <x>, y: <y>},+] color: <color>, name: <name>},+]
 * @param render_type   - Rickshaw render type of the plot.
 *
 */
function Chart(/* String */ id,
               /* Array */ series_data,
               /* Array */ render_type
    ) {

    this.id = id;
    this.series_data = series_data;
    this.render_type = render_type;
    this.built = false;
    this.resolution = RESOLUTION_DAILY;

    this.dataItems = {};

    this.activateItem = null;
    this.deactivateItem = null;

    if (render_type == 'bar-unstacked') {
        this.render_type = 'bar';
        this.unstacked = true;
    }

    /**
     *  Builds a chart object that wraps a variety of RickShaw chart features.  An Ajax
     *  chart that updates minutely can be created by specifying 'isAjax' in args and
     *  supplying a data URL.
     */
    this.buildGraph = function (args) {

        if (args === undefined) {
            args = {};
        }

        var _this = this;
        var minVal =  args['min'] != undefined ? args.min : 0;
        var isAjax =  args['ajax'] != undefined ? args.ajax : false;
        var y_default_value =  args['y_default_value'] != undefined ? args.ajax : 0;
        var x_offset =  args['x_offset'] != undefined ? args.ajax : SECONDS_PER_DAY;

        this.args = args;

        if (isAjax) {

            var formatter = new Formatter();

            this.syncUpdate = function() {
                _this.ajaxGraph.request();
                _this.setRefreshTimes();
            };

            this.ajaxGraph = new Rickshaw.Graph.Ajax( {

                element: document.getElementById("chart" + this.id),
                width: WIDTH,
                height: HEIGHT,
                renderer: this.render_type,
                dataURL: this.series_data,

                onData: function(d) {

                    // Manage any changes to the graph series
                    if (_this.ajaxGraph.graph != undefined && (_this.deactivateItem || _this.activateItem)) {
                        if (_this.deactivateItem) {     // Check for removed series
                            for (var idx = 0; idx < _this.ajaxGraph.graph.series.length; idx++) {
                                // console.log('deact ' + d[idx]);
                                if (_this.deactivateItem == _this.ajaxGraph.graph.series[idx].name) {
                                    console.log('Removing series \'' + _this.ajaxGraph.graph.series[idx].name + '\'.');
                                    delete _this.ajaxGraph.graph.series[idx];
                                    _this.ajaxGraph.graph.series.splice(idx, 1);
                                    _this.deactivateItem = null;
                                    break;
                                }
                            }
                            if (_this.deactivateItem)
                                console.log('Error could not deactivate series \'' + _this.deactivateItem + '\'');

                        } else if (_this.activateItem) {    // Check for newly added series
                            for (idx = 0; idx < d.length; idx++) {
                                if (_this.activateItem == d[idx].name) {
                                    console.log('Adding series \'' + d[idx].name + '\'.');
                                    _this.ajaxGraph.graph.series.push(d[idx]);
                                    _this.activateItem = null;
                                    break;
                                }
                            }
                            if (_this.deactivateItem)
                                console.log('Error could not activate series \'' + _this.deactivateItem + '\'');
                        }
                        $('#legend').empty();
                        _this.buildLegend();
                    }

                    var min_x = d[0].data[0].x;
                    var max_x = d[0].data[0].x;
                    var i;

                    // Handle data granularity
                    for (i = 0; i < d.length; i++) {
                        d[i].data = recomputeDataByTime(d[i].data, _this.resolution);
                    }

                    // Sort the data retrieved
                    for (i = 0; i < d.length; i++) {
                        d[i].data.sort(compareDataSeries);

                        // Check for the minimum x-value
                        if (d[i].data[0].x < min_x)
                            min_x = d[i].data[0].x;

                        // Check for the maximum x-value
                        if (d[i].data[d[i].data.length - 1].x > max_x)
                            max_x = d[i].data[d[i].data.length - 1].x;

                    }

                    // Pad the series to ensure that they're all the same length
                    for (i = 0; i < d.length; i++) {

                        // Prepend
                        while (d[i].data[0].x > min_x) {

                            d[i].data.unshift(
                                {
                                    x: d[i].data[0].x - x_offset,
                                    y: y_default_value
                                }
                            );
                        }

                        // Append default values
                        while (d[i].data[d[i].data.length - 1].x < max_x) {
                            d[i].data.push(
                                {
                                    x: d[i].data[d[i].data.length - 1].x + x_offset,
                                    y: y_default_value
                                });
                        }

                        // Limit the number of datapoints in a chart (10M)
                        if (d[i].data.length > OVERFLOW)
                            throw OVERFLOW_ERR_MSG;
                    }

                    return d;
                },

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

                    if (_this.unstacked != undefined)
                        _this.graph.renderer.unstack = _this.unstacked;

                    _this.graph.render();
                }
            } );

            // Set the resolution controls
            this.setResolutionCheckControls(new Array("daily", "hourly"));

            // Set the update interval and perform the initial update
            this.interval = setInterval(_this.syncUpdate, MILLISECONDS_PER_MINUTE);
            this.syncUpdate();

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

            if (this.unstacked != undefined)
                this.graph.renderer.unstack = this.unstacked;

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

        // If annotations are undefined do not add
        if (annotations == undefined) {
            return this;
        }

        var annotator = new Rickshaw.Graph.Annotate({
            graph: this.graph,
            element: document.getElementById("timeline" + this.id)
        });

        // Add annotations
        for (var j = 0; j < annotations.length; j++) {
            try {
                annotator.add(annotations[j][0], annotations[j][1]);
            } catch (err) {
                console.log('Failed to add annotation: ' + err.message);
            }
        }
        return this;
    };

    /*
     * Create a CSV from the series data.
     */
    this.setRefreshTimes = function () {
        var next = (new Date((new Date).getTime() + MILLISECONDS_PER_MINUTE)).toUTCString();
        document.getElementById("refresh_date" + this.id).innerHTML = "<b>Refreshed on:</b>" + (new Date).toUTCString();
        document.getElementById("next_date" + this.id).innerHTML = "<b>Next refresh:</b>" + next;
    };

    /*
     * Create a CSV from the series data.
     */
    this.setResolutionCheckControls = function(/* Array */ check_ids) {

        var _this = this;
        this.resolutionChecks = check_ids;

        for (var i = 0; i < this.resolutionChecks.length; i++) {

            try {
                document.getElementById(this.resolutionChecks[i] + this.id).onclick = function(event) {

                    // default selection behaviour
                    switch (event.target.value)
                    {
                        case "daily":
                            if (_this.resolution != RESOLUTION_DAILY) {
                                _this.resolution = RESOLUTION_DAILY;
                                _this.syncUpdate();
                                _this.graph.render();
                            }
                            break;

                        case "hourly":
                            if (_this.resolution != RESOLUTION_HOURLY) {
                                _this.resolution = RESOLUTION_HOURLY;
                                _this.syncUpdate();
                                _this.graph.render();
                            }
                            break;
                    }
                };
            } catch (err) {
                // Normal behaviour if the section containing the "resolution" controls is missing
                console.log('Ignoring resolution section for chart \'' + this.id + '\'.');
                break;
            }
        }
    };

    /*
     *  Reconstructs the url from `dataItems`
     */
    this.constructDataUrl = function() {

        var ids = [];
        var names = [];
        var colors = [];

        // Unpack ids, names, and colors
        for (var key in this.dataItems) {
            if (this.dataItems.hasOwnProperty(key)) {
                if (this.dataItems[key].active) {
                    names.push(key);
                    ids.push(this.dataItems[key].id);
                    colors.push(this.dataItems[key].color);
                }
            }
        }
        this.ajaxGraph.dataURL = 'stats_chart_data_response.gne?ids=' + ids.join(',') +
            '&names=' + names.join(',') + '&colors=' + colors.join(',');
        return this;
    };

    /*
     *  Adds a new metric
     */
    this.addDataItem = function(
        /* string */ id,
        /* string */ name,
        /* string */ color) {
        this.dataItems[name] = {
            'active': false,
            'id': id,
            'color': color
        };
        return this;
    };

    /*
     *  Deactivates or activates the metric
     */
    this.toggleDataItemActive = function(/* string */ key) {
        if (this.dataItems.hasOwnProperty(key)) {
            this.dataItems[key].active = !this.dataItems[key].active;

            if (this.dataItems[key].active)
                this.activateItem = key;
            else
                this.deactivateItem = key;

            // Re-render the graph
            this.constructDataUrl().syncUpdate();
        }
        return this;
    };

    /*
     *  Is the data item active?
     */
    this.isActiveItem = function(/* string */ key) {
        return this.dataItems[key].active;
    };

    return this;
}