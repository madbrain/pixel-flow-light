<script>
    import { onMount } from "svelte";
    import * as d3 from "d3";

    const margin = {top: 10, right: 30, bottom: 30, left: 40},
            width = 460 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

    let graphElement;
    let svg;
    let x, y;
    let xAxis, yAxis;

    export let data = [];

    onMount(() => {

        svg = d3.select(graphElement)
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
        x = d3.scaleLinear()
            .range([0, width]);

        y = d3.scaleLinear()
            .range([height, 0]);

        xAxis = svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));
        
        yAxis = svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y));

        const bars = svg.selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
                .attr("x", 1)
                .attr("transform", (d, i) => { return "translate(" + x(i) + "," + y(d) + ")"; })
                .attr("width", (d) => { return 0.9 * (width / data.length); })
                .attr("height", (d) => { return height - y(d); })
                .style("fill", "#69b3a2");

        bars
            .exit()
                .remove();
    });

    $: {
        if (svg && data) {

            x.domain([0, data.length ]);
            y.domain([0, d3.max(data, (d) => { return d; })]);

            xAxis.transition().duration(500).call(d3.axisBottom(x));
            yAxis.transition().duration(500).call(d3.axisLeft(y));
            
            const bars = svg.selectAll("rect")
                .data(data);

            bars
                .enter()
                .append("rect")
                    .attr("x", 1)
                    .attr("transform", (d, i) => { return "translate(" + x(i) + "," + y(d) + ")"; })
                    .attr("width", (d) => { return 0.9 * (width / data.length); })
                    .attr("height", (d) => { return height - y(d); })
                    .style("fill", "#69b3a2");
            bars
                .transition().duration(500)
                    .attr("transform", (d, i) => { return "translate(" + x(i) + "," + y(d) + ")"; })
                    .attr("width", (d) => { return 0.9 * (width / data.length); })
                    .attr("height", (d) => { return height - y(d); });
            bars
                .exit()
                    .remove();
            
        }
    }
</script>

<div bind:this={graphElement}>

</div>