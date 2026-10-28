d3.csv("./data/Ex6_TVdata_withStar.csv", d3.autoType)
  .then(function (rows) {
    const data = rows.filter(d =>
      Number.isFinite(d.energyConsumption) && d.energyConsumption >= 0 &&
      Number.isFinite(d.star) && Number.isFinite(d.screenSize) &&
      ["LED", "LCD", "OLED"].includes(d.screenTech)
    );
    const invalidCount = rows.length - data.length;
    console.log("CSV rows:", rows.length, "Valid TV rows:", data.length, "Rejected:", invalidCount);
    console.table(data.slice(0, 5));
    d3.select("#data-status").text(`${data.length.toLocaleString()} TV records loaded · ${invalidCount} rejected`);

    initHistogram(data);
    initScatterplot(data); 
  })
  .catch(function (error) {
    console.error("Cannot load the TV CSV:", error);
    d3.select("#data-status").attr("class", "status error")
      .text("Unable to load CSV. Open index.html with VS Code Live Server and check the data folder.");
  });

function initHistogram(allData) {
  const technologies = ["All", "LED", "LCD", "OLED"];
  let selectedTech = "All";
  let minSize = 0;

  const buttons = d3.select("#histogram-filters")
    .selectAll("button")
    .data(technologies)
    .join("button")
    .attr("type", "button")
    .attr("class", "filter-button")
    .text(d => d)
    .on("click", function (event, technology) {
      selectedTech = technology;       
      updateHistogram();               
    });

  d3.select("#min-screen-size").on("change", function () {
    minSize = +this.value;               
    updateHistogram();
  });

  function updateHistogram() {
    const subset = allData.filter(d =>
      (selectedTech === "All" || d.screenTech === selectedTech) &&
      d.screenSize >= minSize
    );

    buttons.classed("active", d => d === selectedTech)
      .attr("aria-pressed", d => String(d === selectedTech));
    d3.select("#histogram-count")
      .text(`${subset.length.toLocaleString()} TVs`);
    drawHistogram(subset);
    console.log("Histogram filter:", selectedTech, "Minimum size:", minSize,
      "Matching TVs:", subset.length);
  }
  updateHistogram(); 
}

function drawHistogram(data) {
  const margin = { top: 25, right: 24, bottom: 68, left: 75 };
  const width = 960, height = 470;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const binGenerator = d3.bin()
    .value(d => d.energyConsumption)
    .domain([0, 2800])
    .thresholds(d3.range(0, 2801, 200));
  const bins = binGenerator(data);
  const totalBinned = d3.sum(bins, bin => bin.length);
  console.log("Histogram: bins =", bins.length, "records in bins =", totalBinned);
  if (totalBinned !== data.length) console.warn("Some values fall outside histogram domain!");

  const svg = d3.select("#histogram").selectAll("svg")
    .data([null]).join("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "img")
    .attr("aria-label", "Histogram showing the number of TV models in energy consumption bins");
  const chart = svg.selectAll("g.plot-area").data([null]).join("g")
    .attr("class", "plot-area")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const xScale = d3.scaleLinear().domain([0, 2800]).range([0, innerWidth]);
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(bins, b => b.length) || 1])
    .nice().range([innerHeight, 0]);

  const xAxis = d3.axisBottom(xScale)
    .tickValues(d3.range(0, 2801, 400)).tickFormat(d3.format("d"));
  const yAxis = d3.axisLeft(yScale).ticks(7).tickFormat(d3.format("d"));
  chart.selectAll("g.x-axis").data([null]).join("g")
    .attr("class", "axis x-axis")
    .attr("transform", `translate(0,${innerHeight})`).call(xAxis);
  chart.selectAll("g.y-axis").data([null]).join("g")
    .attr("class", "axis y-axis").call(yAxis);

  svg.selectAll("text.x-axis-label").data([null]).join("text")
    .attr("class", "axis-label x-axis-label")
    .attr("x", margin.left + innerWidth / 2).attr("y", height - 12)
    .attr("text-anchor", "middle")
    .text("Labelled energy consumption (kWh/year)");
  svg.selectAll("text.y-axis-label").data([null]).join("text")
    .attr("class", "axis-label y-axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + innerHeight / 2)).attr("y", 20)
    .attr("text-anchor", "middle")
    .text("Frequency (number of TVs)");

  chart.selectAll("rect.histogram-bar").data(bins, d => d.x0)
    .join("rect")
    .attr("class", "histogram-bar")
    .attr("x", d => xScale(d.x0))
    .attr("width", d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
    .attr("y", d => yScale(d.length))
    .attr("height", d => innerHeight - yScale(d.length))
    .on("pointermove", function (event, bin) {
      showTVTooltip(event,
        `<strong>${bin.x0}–${bin.x1} kWh/year</strong><br>${bin.length.toLocaleString()} TV records`);
    })
    .on("pointerleave", hideTVTooltip);
}

function showTVTooltip(event, html) {
  const tip = d3.select("#tooltip");
  tip.html(html).property("hidden", false);
  const node = tip.node();
  const left = Math.max(8, Math.min(event.clientX + 14, window.innerWidth - node.offsetWidth - 8));
  const top = Math.max(8, Math.min(event.clientY + 14, window.innerHeight - node.offsetHeight - 8));
  tip.style("left", `${left}px`).style("top", `${top}px`);
}
function hideTVTooltip() {
  d3.select("#tooltip").property("hidden", true);
}
