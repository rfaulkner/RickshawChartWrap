
RickshawChartWrap
=================

Library for writing basic time-series charts with Rickshaw [1] based on d3.js with tool-tips on the data-points.

[1] https://github.com/shutterstock/rickshaw

To use the chart wrapper with an AJAX chart object:

    <div id="content">

        <div id="container" class="container">
            <div id="refresh_date0" style="font-weight:100;font-style:italic;font-size:11px;"></div>
            <div id="next_date0" style="font-weight:100;font-style:italic;font-size:11px;"></div>
            <form id="side_panel0" class="side_panel">
                <h1>{$chart_title}</h1>
                <section><div id="legend0"></div></section>
            </form>
            <div id="chart_container0" class="chart_container">
                <div id="y_axis0" class="y_axis"></div>
                <div id="chart0" class="chart"></div>
                <div id="timeline0" class="timeline"></div>
                <div id="slider0" class="slider"></div>
                <div style="clear:both">&nbsp;</div>
                <a id="csv_link0">CSV Data</a>
            </div>
            <div id="chart_docs0" class="chart_docs"></div>
        </div>
        <div style="clear:both">&nbsp;</div>
        <div style="clear:both">&nbsp;</div>

    </div>

    <script>

        var idx = 0;
        var data_url = "http://data.com/everything";
        var comments = "...";
        var render_type = "...";
        var annotations = [];
        var formatter_type = "...";

        // UNPACK smarty data into JS
        {foreach from=$annotations[$idx] key=k item=v}
            annotations.push([{$v.unix_time}, "{$v.message}"]);
        {/foreach}

        {literal}

        // Attempt to render the chart
        var chart = chartFactory(
                    idx,                        // :int: index referencing the correct chart elems
                    data_url,                   // :str: data url (data must be in rickshaw consumable JSON)
                    render_type,                // :str: render type of pl
                    comments,                   // :str: docs accompanying your chart
                    annotations,                // :array: contains list of annotations e.g. [[1, 'a1'], [[2, 'a2']]]
                    formatter_type,             // :str: handle that defines hover detai formatter (See Formatter in chart.js)
                    true,                       // :bool: is the data sourced via ajax?
                    RS_CHART_CONSTANTS.width,   // :int: default chart width
                    RS_CHART_CONSTANTS.height   // :int: default chart height
            );

    </script>

The response from should look something like:

    [{"data":[{"x":1388534400,"y":23166},{"x":1388620800,"y":26281},{"x":1388707200,"y":24648},{"x":1388793600,
    "y":24805},{"x":1388880000,"y":25733},{"x":1388966400,"y":26008},{"x":1389052800,"y":22226},{"x":1389139200,
    "y":21026},{"x":1389225600,"y":20060},{"x":1388361600,"y":26324},{"x":1388448000,"y":22664},{"x":1387065600,
    "y":19533},{"x":1387152000,"y":18663},{"x":1387238400,"y":18144},{"x":1387324800,"y":17854},{"x":1387411200,
    "y":17514},{"x":1389312000,"y":19851},{"x":1389398400,"y":18383},{"x":1389484800,"y":21109},{"x":1389571200,
    "y":21762},{"x":1389657600,"y":21503},{"x":1389744000,"y":19099},{"x":1389830400,"y":20568},{"x":1389916800,
    "y":19149},{"x":1390003200,"y":19495},{"x":1390089600,"y":22586},{"x":1387497600,"y":17651},{"x":1387584000,
    "y":17727},{"x":1387670400,"y":18747},{"x":1387756800,"y":19069},{"x":1387843200,"y":20605},{"x":1387929600,
    "y":21108},{"x":1388016000,"y":25323},{"x":1388102400,"y":22878},{"x":1388188800,"y":24224},{"x":1388275200,
    "y":24772},{"x":1390176000,"y":21778},{"x":1390262400,"y":21635},{"x":1390348800,"y":18403},{"x":1390435200,
    "y":17622},{"x":1390521600,"y":18112},{"x":1390608000,"y":19340},{"x":1390694400,"y":20634},{"x":1390780800,
    "y":20478},{"x":1390867200,"y":19441},{"x":1390953600,"y":20481}],"name":"failed","color":"#111111"},{"data":
    [{"x":1388534400,"y":393449},{"x":1388620800,"y":454631},{"x":1388707200,"y":418177},{"x":1388793600,"y":
    444077},{"x":1388880000,"y":459499},{"x":1388966400,"y":387644},{"x":1389052800,"y":335677},{"x":1389139200,
    "y":306843},{"x":1389225600,"y":295549},{"x":1388361600,"y":442800},{"x":1388448000,"y":397535},{"x":1387065600,
    "y":347125},{"x":1387152000,"y":299136},{"x":1387238400,"y":283301},{"x":1387324800,"y":290282},{"x":1387411200,
    "y":268761},{"x":1389312000,"y":277966},{"x":1389398400,"y":324414},{"x":1389484800,"y":397398},{"x":1389571200,
    "y":348058},{"x":1389657600,"y":292111},{"x":1389744000,"y":259045},{"x":1389830400,"y":276763},{"x":1389916800,
    "y":261435},{"x":1390003200,"y":308698},{"x":1390089600,"y":355972},{"x":1387497600,"y":257019},{"x":1387584000,
    "y":295689},{"x":1387670400,"y":347686},{"x":1387756800,"y":330882},{"x":1387843200,"y":330268},{"x":1387929600,
    "y":411787},{"x":1388016000,"y":447327},{"x":1388102400,"y":444571},{"x":1388188800,"y":447851},{"x":1388275200,
    "y":488906},{"x":1390176000,"y":318184},{"x":1390262400,"y":272842},{"x":1390348800,"y":293478},{"x":1390435200,
    "y":249244},{"x":1390521600,"y":252190},{"x":1390608000,"y":309104},{"x":1390694400,"y":363013},{"x":1390780800,
    "y":310749},{"x":1390867200,"y":300900},{"x":1390953600,"y":288759}],"name":"success","color":"#112881"}]



Example
-------

To see an example render example.html in your browser:

![Alt text](/example.png "Screenshot")
