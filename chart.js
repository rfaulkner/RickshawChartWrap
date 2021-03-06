
/*
 * jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, unused:true,
 * curly:true, browser:true, indent:4, maxerr:50, newcap:true
 *
 * Author:     Ryan Faulkner
 * Date:       2013-06-10
 * File:       chart.js
 *
 * Defines the chart object for that eases the use of Rickshaw [1] charts.
 *
 * [1] https://github.com/shutterstock/rickshaw
 *
 */


"use strict";

// Chart dimensions
var RS_CHART_CONSTANTS = {
    default_width: 640,
    default_height: 300,
    overflow: 10000000,
    overflow_err_msg: "Too many datapoints aborting render.",
    seconds_per_hour: 3600,
    seconds_per_day: 3600 * 24,
    seconds_per_minute: 3600000 * 24,
    milliseconds_per_day: 3600000 * 24,
    milliseconds_per_minute: 60000,
    resolution_none: 'res_default',
    resolution_hourly: 'res_hourly',
    resolution_daily: 'res_daily'
};

// Variable for global chart documentation of series
var gl_chart_docs;


/**
 * Create chart elements based on Rickshaw library.
 *
 * @param id            - Chart id.
 * @param series_data   - [{data: [{x: <x>, y: <y>},+] color: <color>, name: <name>},+]
 * @param render_type   - Rickshaw render type of the plot.
 * @param docs          - comments for this chart.
 * @param annotations   - array of chart annotation.
 * @param formatter_handle  - formatter to use for hover detail (see Formatter).
 * @param is_ajax       - flag indicating if the data is sourced via ajax.
 * @param width         - chart width.
 * @param height        - chart height.
 * @param resolution    - time resolution for the chart.
 * @param show_refresh_times    - time resolution for the chart.
 */
function chartFactory(/* string */ id,
                      /* Array|string */ series_data,
                      /* String */ render_type,
                      /* String */ docs,
                      /* Array */ annotations,
                      /* string */ formatter_handle,
                      /* boolean */ is_ajax,
                      /* integer */ width,
                      /* integer */ height,
                      /* integer */ resolution,
                      /* boolean */ show_refresh_times
    ) {

    formatter_handle = typeof formatter_handle !== 'undefined' ? formatter_handle : '';

    var formatter = new Formatter();
    gl_chart_docs = docs;

    if (is_ajax) {
        return new Chart(id, series_data, render_type, resolution).
            buildGraph({
                'width': width,
                'height': height,
                'ajax': true,
                'formatter_handle': formatter_handle,
                'docs': docs,
                'annotations': annotations,
                'show_refresh_times': show_refresh_times
            });
    } else {
        return new Chart(id, series_data, render_type, resolution).
            buildGraph({'width': width, 'height': height}).
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

                var date = new Date(x * 1000 + RS_CHART_CONSTANTS.milliseconds_per_day);
                var dateStr = '<span class="date">' + date.toDateString() + ' ' + date.getUTCHours() + 'H' + '</span>';
                var swatch = '<span class="detail_swatch" style="background-color: ' + series.color + '"></span>';
                return swatch + series.name + ": " + formatterContext.numberWithCommas(y) + '<br>' + dateStr;
            },
            xFormatter: function(x) {
                var date = new Date(x * 1000 + RS_CHART_CONSTANTS.milliseconds_per_day);
                return date.toDateString();
            }
        },

        'timeseries_2': {

            formatter: function(/* array */ series, /* int - unix_timestamp */ x, /* int  */ y) {

                var date = new Date(x * 1000 + RS_CHART_CONSTANTS.milliseconds_per_day);
                var dateStr = '<span class="date">' + date.toDateString() + ' ' + date.getUTCHours() + ':' + date.getUTCMinutes() + '</span>';
                var swatch = '<span class="detail_swatch" style="background-color: ' + series.color + '"></span>';
                return swatch + series.name + ": " + formatterContext.numberWithCommas(y) + '<br>' + dateStr;
            },
            xFormatter: function(x) {
                var date = new Date(x * 1000 + RS_CHART_CONSTANTS.milliseconds_per_day);
                return date.toUTCString();
            }
        },

        'timeseries_no_commas': {

            formatter: function(/* array */ series, /* int - unix_timestamp */ x, /* int  */ y) {

                var date = new Date(x * 1000 + RS_CHART_CONSTANTS.milliseconds_per_day);
                var dateStr = '<span class="date">' + date.toDateString() + ' ' + date.getUTCHours() + 'H' + '</span>';
                var swatch = '<span class="detail_swatch" style="background-color: ' + series.color + '"></span>';
                return swatch + series.name + ": " + y + '<br>' + dateStr;
            },
            xFormatter: function(x) {
                var date = new Date(x * 1000 + RS_CHART_CONSTANTS.milliseconds_per_day);
                return date.toDateString();
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
        },

        'dynamic_docs_1': {

            formatter: function(/* array */ series, /* int - unix_timestamp */ x, /* int  */ y) {

                var date = new Date(x * 1000 + RS_CHART_CONSTANTS.milliseconds_per_day);
                var dateStr = '<span class="date">' + date.toDateString() + ' ' + date.getUTCHours() + 'H' + '</span>';
                var swatch = '<span class="detail_swatch" style="background-color: ' + series.color + '"></span>';

                // Set the docstring
                document.getElementById('chart_docs').innerHTML = gl_chart_docs[series.name];

                return swatch + series.name + ": " + formatterContext.numberWithCommas(y) + '<br>' + dateStr;
            },
            xFormatter: function(x) {
                var date = new Date(x * 1000 + RS_CHART_CONSTANTS.milliseconds_per_day);
                return date.toDateString();
            }
        }
    };

    this.getFormatter = function (/* string */ formatter_type) {

        switch (formatter_type) {
            case 'timeseries_1':
                return formatterContext.Formatters.timeseries_1;

            case 'timeseries_2':
                return formatterContext.Formatters.timeseries_2;

            case 'timeseries_no_commas':
                return formatterContext.Formatters.timeseries_no_commas;

            case 'integer_1':
                return formatterContext.Formatters.integer_1;

            case 'confidence':
                return formatterContext.Formatters.confidence;

            case 'dynamic_docs_1':
                return formatterContext.Formatters.dynamic_docs_1;

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

    if (resolution == RS_CHART_CONSTANTS.resolution_none) {
        return data;
    }

    // Compute hash with new {timestamp: count} values
    for (i = 0; i < data.length; i++) {

        if (resolution == RS_CHART_CONSTANTS.resolution_daily) {
            new_time = parseInt(data[i].x / RS_CHART_CONSTANTS.seconds_per_day) * RS_CHART_CONSTANTS.seconds_per_day;
        } else if (resolution == RS_CHART_CONSTANTS.resolution_hourly) {
            new_time = parseInt(data[i].x / RS_CHART_CONSTANTS.seconds_per_hour) * RS_CHART_CONSTANTS.seconds_per_hour;
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
 * @param resolution    - Resolution of time series data.
 *
 */
function Chart(/* String */ id,
               /* Array */ series_data,
               /* Array */ render_type,
               /* integer */ resolution
    ) {

    this.id = id;
    this.series_data = series_data;
    this.render_type = render_type;
    this.built = false;

    // Defaults to a daily resolution
    this.resolution = resolution != undefined ? resolution : RS_CHART_CONSTANTS.resolution_daily;

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
        var w =  args['width'] != undefined ? args.width : RS_CHART_CONSTANTS.default_width;
        var h =  args['height'] != undefined ? args.height : RS_CHART_CONSTANTS.default_height;
        var minVal =  args['min'] != undefined ? args.min : 0;
        var isAjax =  args['ajax'] != undefined ? args.ajax : false;
        var y_default_value =  args['y_default_value'] != undefined ? args.ajax : 0;
        var x_offset =  args['x_offset'] != undefined ? args.ajax : RS_CHART_CONSTANTS.seconds_per_day;
        this.show_refresh_times = args['show_refresh_times'] != undefined ? args.show_refresh_times : false;

        this.args = args;

        if (isAjax) {

            Formatter.bind(this);
            var formatter = new Formatter();

            this.syncUpdate = function() {
                _this.ajaxGraph.request();
                if (this.show_refresh_times) {
                    _this.setRefreshTimes();
                }
            };

            this.ajaxGraph = new Rickshaw.Graph.Ajax( {

                element: document.getElementById("chart" + this.id),
                width: w,
                height: h,
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
                        if (d[i].data.length > RS_CHART_CONSTANTS.overflow)
                            throw RS_CHART_CONSTANTS.overflow_err_msg;
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
            // TODO - refactor how this control works.
            this.setResolutionCheckControls(new Array("daily", "hourly"));

            // Set the update interval and perform the initial update
            this.interval = setInterval(_this.syncUpdate, RS_CHART_CONSTANTS.milliseconds_per_minute);
            this.syncUpdate();

        } else {

            this.graph = new Rickshaw.Graph( {
                element: document.querySelector("#chart" + this.id),
                width: w,
                height: h,
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
        var out = "Content-Type: text/plain\nname,x,y\n";
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
    this.buildDocs = function (/* String | Array */ doc) {
        this.docs =  doc != undefined ? doc : '_';

        try {
            if (doc instanceof Array)
                document.getElementById("chart_docs" + this.id).innerHTML = '';
            else
                document.getElementById("chart_docs" + this.id).innerHTML = this.docs;
        } catch(err) {
            console.log('Couldn\'t set docs in Chart::buildDocs: ' + err);
        }

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
        var next = (new Date((new Date).getTime() + RS_CHART_CONSTANTS.milliseconds_per_minute)).toUTCString();
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
                            if (_this.resolution != RS_CHART_CONSTANTS.resolution_daily) {
                                _this.resolution = RS_CHART_CONSTANTS.resolution_daily;
                                _this.syncUpdate();
                                _this.graph.render();
                            }
                            break;

                        case "hourly":
                            if (_this.resolution != RS_CHART_CONSTANTS.resolution_hourly) {
                                _this.resolution = RS_CHART_CONSTANTS.resolution_hourly;
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