function attentionColor(weight) {
  if (weight < 0.1) return "var(--accent-info)";
  if (weight < 0.3) return "var(--accent-success)";
  if (weight < 0.6) return "var(--accent-warning)";
  return "var(--sol-orange)";
}

export function renderSelfAttention(d3, {
  tokens = [],
  matrix = [],
  activeQuery = 0,
  onSelectQuery = () => {}
} = {}) {
  const weights = matrix[activeQuery] || [];
  const count = tokens.length;
  const radius = 110;
  const centerX = 200;
  const centerY = 185;
  const width = 400;
  const height = 370;
  const position = (index) => {
    const angle = ((index / count) * 2 * Math.PI) - Math.PI / 2;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  const svg = d3.create("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("max-width", "460px")
    .style("height", "auto")
    .style("display", "block")
    .style("margin", "0 auto")
    .style("background", "var(--sol-base03)")
    .style("border-radius", "12px");

  tokens.forEach((_token, index) => {
    const weight = weights[index] || 0;
    if (weight <= 0.04) return;
    const point = position(index);
    svg.append("circle")
      .attr("cx", point.x)
      .attr("cy", point.y)
      .attr("r", 55 * weight + 10)
      .style("fill", attentionColor(weight))
      .attr("opacity", weight * 0.5);
  });

  const queryPosition = position(activeQuery);
  tokens.forEach((_token, index) => {
    if (index === activeQuery) return;
    const weight = weights[index] || 0;
    if (weight < 0.01) return;
    const point = position(index);
    svg.append("line")
      .attr("x1", queryPosition.x)
      .attr("y1", queryPosition.y)
      .attr("x2", point.x)
      .attr("y2", point.y)
      .style("stroke", attentionColor(weight))
      .attr("stroke-width", weight * 12 + 1)
      .attr("opacity", 0.8);

    const midX = (queryPosition.x + point.x) / 2;
    const midY = (queryPosition.y + point.y) / 2;
    svg.append("rect")
      .attr("x", midX - 16)
      .attr("y", midY - 8)
      .attr("width", 32)
      .attr("height", 16)
      .attr("rx", 4)
      .style("fill", "var(--sol-base02)")
      .attr("opacity", 0.9);
    svg.append("text")
      .attr("x", midX)
      .attr("y", midY + 1)
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .style("fill", attentionColor(weight))
      .attr("font-size", "9px")
      .attr("font-weight", "700")
      .style("font-family", "var(--font-code)")
      .text(`${(weight * 100).toFixed(0)}%`);
  });

  tokens.forEach((token, index) => {
    const point = position(index);
    const isQuery = index === activeQuery;
    const weight = weights[index] || 0;
    const nodeRadius = isQuery ? 30 : 22;
    const group = svg.append("g")
      .attr("transform", `translate(${point.x},${point.y})`)
      .style("cursor", "pointer");

    group.append("circle")
      .attr("r", nodeRadius)
      .style("fill", isQuery ? attentionColor(weight) : "var(--sol-base02)")
      .style("stroke", isQuery ? attentionColor(weight) : "var(--sol-base01)")
      .attr("stroke-width", 2);
    group.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .style("fill", isQuery ? "var(--sol-base3)" : "var(--sol-base1)")
      .attr("font-size", isQuery ? "13px" : "11px")
      .attr("font-weight", isQuery ? "800" : "500")
      .style("font-family", "var(--font-base)")
      .text(token.word);

    if (isQuery) {
      group.append("rect")
        .attr("x", -20)
        .attr("y", nodeRadius + 4)
        .attr("width", 40)
        .attr("height", 14)
        .attr("rx", 3)
        .style("fill", "var(--accent-danger)");
      group.append("text")
        .attr("text-anchor", "middle")
        .attr("y", nodeRadius + 15)
        .attr("dy", ".1em")
        .style("fill", "var(--sol-base3)")
        .attr("font-size", "8px")
        .attr("font-weight", "700")
        .text(`Self:${(weight * 100).toFixed(0)}%`);
    }

    group.on("click", () => onSelectQuery(index));
    group.on("mouseover", function() { d3.select(this).select("circle").attr("opacity", 0.75); });
    group.on("mouseout", function() { d3.select(this).select("circle").attr("opacity", 1); });
  });

  [
    ["Faible", "var(--accent-info)"],
    ["Moyenne", "var(--accent-success)"],
    ["Forte", "var(--sol-orange)"]
  ].forEach(([label, color], index) => {
    const x = 20 + index * 120;
    svg.append("circle").attr("cx", x + 6).attr("cy", height - 14).attr("r", 5).style("fill", color);
    svg.append("text")
      .attr("x", x + 16)
      .attr("y", height - 14)
      .attr("dy", ".35em")
      .style("fill", "var(--sol-base1)")
      .attr("font-size", "10px")
      .text(label);
  });

  return svg.node();
}
