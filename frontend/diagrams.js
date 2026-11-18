export function plot(divId, x, y, type, color, invertY = false) {
    const unit = (type === "moment") ? "N·m" : "N";
    const trace = {
        x: x,
        y: y,
        mode: "lines",
        fill: "tozeroy",
        line: { color: color },
        hovertemplate: `x = %{x:.3f} m<br>${type} = %{y:.2f} ${unit}<extra></extra>`,
    };

    const layout = {
        title: { text: type },
        height: 220,
        margin: { l: 60, r: 20, t: 40, b: 40 },
        xaxis: { title: { text: "x [m]" }, range: [0, x[x.length - 1]] },
        yaxis: { title: { text: unit }, autorange: invertY ? "reversed" : true },
    };
    Plotly.newPlot(divId, [trace], layout, { displayModeBar: false, responsive: true });
}

export function drawGraphs(data) {
    plot("plot_M", data.x, data.M, "moment", "#00ff00", true);
    plot("plot_S", data.x, data.V, "shear", "#ff0000");
    plot("plot_N", data.x, data.N, "normal", "#00f");
}