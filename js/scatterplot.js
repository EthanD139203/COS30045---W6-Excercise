function initScatterplot(allData) {
  const options = ["All", "LED", "LCD", "OLED"];
  let selectedTech = "All";

  const buttons = d3.select("#scatter-filters")
    .selectAll("button")
    .data(options)
    .join("button")
    .attr("type", "button").attr("class", "filter-button")
    .text(d => d)
    .on("click", function (event, technology) {
      selectedTech = technology;
      updateScatter();
    });

  function updateScatter() {
    const subset = selectedTech === "All" ? allData :
      allData.filter(d => d.screenTech === selectedTech);
    buttons.classed("active", d => d === selectedTech)
      .attr("aria-pressed", d => String(d === selectedTech));
    d3.select("#scatter-count").text(`${subset.length.toLocaleString()} TVs`);
    drawScatterplot(subset, allData);
    console.log("Scatter plot:", selectedTech, "records:", subset.length);
  }
  updateScatter();
}

function drawScatterplot(data, allData) {
  const margin = { top: 25, right: 24, bottom: 68, left: 75 };
  const width = 960, height = 490;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = d3.scaleLinear()
    .domain([0, d3.max(allData, d => d.star) || 8]).nice()
    .range([0, innerWidth]);
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(allData, d => d.energyConsumption) || 2800]).nice()
    .range([innerHeight, 0]);
  const colorScale = d3.scaleOrdinal()
    .domain(["LED", "LCD", "OLED"])
    .range(["#3579ad", "#df9957", "#9b6bb3"]);

  const svg = d3.select("#scatterplot").selectAll("svg")
    .data([null]).join("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "img")
    .attr("aria-label", "TV models plotted by star rating and energy consumption");
  const chart = svg.selectAll("g.plot-area").data([null]).join("g")
    .attr("class", "plot-area")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  chart.selectAll("g.x-axis").data([null]).join("g")
    .attr("class", "axis x-axis").attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xScale).ticks(9));
  chart.selectAll("g.y-axis").data([null]).join("g")
    .attr("class", "axis y-axis").call(d3.axisLeft(yScale).ticks(8));

  svg.selectAll("text.x-axis-label").data([null]).join("text")
    .attr("class", "axis-label x-axis-label")
    .attr("x", margin.left + innerWidth / 2).attr("y", height - 12)
    .attr("text-anchor", "middle").text("Energy star rating");
  svg.selectAll("text.y-axis-label").data([null]).join("text")
    .attr("class", "axis-label y-axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + innerHeight / 2)).attr("y", 20)
    .attr("text-anchor", "middle").text("Labelled energy consumption (kWh/year)");

  chart.selectAll("circle.point")
    .data(data)
    .join("circle")
    .attr("class", "point")
    .attr("cx", d => xScale(d.star))
    .attr("cy", d => yScale(d.energyConsumption))
    .attr("r", 3.3)
    .attr("fill", d => colorScale(d.screenTech))
    .on("pointermove", function (event, d) {
      const escape = s => String(s).replace(/[&<>"']/g,
        c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c]);
      showTVTooltip(event,
        `<strong>${escape(d.brand)} — ${escape(d.model)}</strong><br>` +
        `Technology: ${escape(d.screenTech)}<br>` +
        `Screen size: ${d.screenSize} in<br>` +
        `Star rating: ${d.star}<br>` +
        `Energy: ${d.energyConsumption} kWh/year`);
    })
    .on("pointerleave", hideTVTooltip);
}
