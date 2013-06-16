
// Chart dimensions
var WIDTH = 640;
var HEIGHT = 300;

/**
 * Create chart elements based on Rickshaw library.
 *
 * @param id            - Chart id.
 * @param series_data   - [{data: [{x: <x>, y: <y>},+] color: <color>, name: <name>},+]
 * @param render_type   - Rickshaw render type of the plot.
 *
 */
function drawChart(/* int */ id, /* Array */ series_data, /* String */ render_type) {


    // Create the graph and render
    // ===========================

    var graph = new Rickshaw.Graph( {
        element: document.querySelector("#chart" + id),
        width: WIDTH,
        height: HEIGHT,
        renderer: render_type,
        preserve: true,
        series: series_data
    } );
    graph.render();

    // Add slider
    // ==========

    var slider = new Rickshaw.Graph.RangeSlider({
        graph: graph,
        element: $('#slider' + id)
    });


    // Add hover
    // =========

    var hoverDetail = new Rickshaw.Graph.HoverDetail( {
        graph: graph
    } );


    // Construct the axes
    // ==================

    var x_axis = new Rickshaw.Graph.Axis.Time( { graph: graph } );
    x_axis.render();

    var y_axis = new Rickshaw.Graph.Axis.Y( {
        graph: graph,
        orientation: 'left',
        tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
        element: document.getElementById('y_axis' + id)
    } );
    y_axis.render();


    // Construct the legend
    // ====================

    var legend = new Rickshaw.Graph.Legend({
        graph: graph,
        element: document.querySelector('#legend' + id)
    });

    var shelving = new Rickshaw.Graph.Behavior.Series.Toggle({
        graph: graph,
        legend: legend
    });

    var highlighter = new Rickshaw.Graph.Behavior.Series.Highlight({
        graph: graph,
        legend: legend
    });

    var order = new Rickshaw.Graph.Behavior.Series.Order({
        graph: graph,
        legend: legend
    });
}