const testBeam = {
    length: 6,
    units: "SI",
    supports: [
        {type: "pinned", pos_x: 0},
        {type: "roller", pos_x: 6}
    ],
    loads: [
        {type: "point", pos_x: 3, force: 1000}
    ],
};

async function solve(beam) {
    const result = await fetch("/solve", {
        method: "POST",
        headers: {"Content-type": "application/json" },
        body: JSON.stringify(beam),
    });
    const data = await result.json();
    if (!result.ok) throw data;
    return data;
}

async function onCalculate() {
    const out = document.querySelector("#out");
    out.textContent = "Liczę…";
    try {
        const data = await solve(testBeam);
        out.textContent = JSON.stringify(data.reactions, null, 2);
        drawGraphs(data);
    } catch (err) {
        out.textContent = "Błąd:\n" + JSON.stringify(err, null, 2)
    }
}

function plot(divId, x, y, type, color, invertY = false) {
    let unit = "";
    if(type == "shear" || type == "normal") units = "N"; else units = "Nm";
    const trace = {
        x: x,
        y: y,
        mode: "lines",
        fill: "tozeroy",
        line: {color: color},
        hovertemplate: `x = %{x:.3f} m<br>${name} = %{y:.2f} ${unit}<extra></extra>`,
    };

    const layout = {
        title: {text: type},
        height: 220,
        margin: {l: 60, r: 20, t: 40, b: 40},
        xaxis: {title:{text: "x [m]"}, range:[0, x[x.length - 1]]},
        yaxis: {title:{text: unit}, autorange: invertY ? "reversed" : true},
    };
    Plotly.newPlot(divId, [trace], layout, {displayModeBar: false, responsive: true});
}

function drawGraphs(data) {
    plot("moment", data.x, data.M, "moment", "#00ff00", true);
    plot("shear", data.x, data.V, "shear", "#ff0000");
    plot("normal", data.x, data.N, "normal", "#00f");
}

document.querySelector("#calculate").addEventListener("click", onCalculate);