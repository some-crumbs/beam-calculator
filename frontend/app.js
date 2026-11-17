const state = {
    length: 6,
    units: "SI",
    supports: [],
    hinges: [],
    loads: [],
};

const BEAM_Y = 128;
const LOAD_H = 32;

const LOAD_DRAWING = {
    point: drawPointLoad,
    uniform: drawUniformLoad,
    axial: drawAxialLoad,
    moment: drawMoment,
};

function addLoad(load) {
    state.loads.push(load);
    render();
}

function addSupport(support) {
    state.supports.push(support);
    render();
}

function addHinge(hinge) {
    state.hinges.push(hinge);
    render();
}

function removeLoad(i) {
    state.loads.splice(i, 1);
    render();
}

function render() {
    const out = document.getElementById("out");
    out.textContent = JSON.stringify(state, null, 2);
    renderSketch();
}

function renderSketch(){
    const sketch = document.getElementById("sketch");
    sketch.innerHTML = "";
    drawBeam(0, state.length, sketch);
    drawSupport(sketch);
    drawLoads(sketch);
    drawHinge(sketch);
}

async function solve(beam) {
    const result = await fetch("/solve", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify(beam),
    });
    const data = await result.json();
    if (!result.ok) throw data;
    return data;
}

async function onCalculate() {
    const out = document.querySelector("#out");
    out.textContent = "Solving…";
    try {
        const data = await solve(state);
        out.textContent = JSON.stringify(data.reactions, null, 2);
        drawGraphs(data);
    } catch (err) {
        if (typeof (err.detail) === "string") {
            out.textContent = "Error:\n" + err.detail;
        } else if (Array.isArray(err.detail)) {
            out.textContent = "Error:\n" + err.detail[0].msg;
        } else {
            out.textContent = "Error:\n" + err.message;
            console.error(err);
        }
    }
}

function plot(divId, x, y, type, color, invertY = false) {
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

function drawGraphs(data) {
    plot("plot_M", data.x, data.M, "moment", "#00ff00", true);
    plot("plot_S", data.x, data.V, "shear", "#ff0000");
    plot("plot_N", data.x, data.N, "normal", "#00f");
}

function getLength() {
    const length = document.querySelector("#length");
    const elements = [...state.supports, ...state.loads, ...state.hinges]

    if (!length.reportValidity()) return;

    const newLength = length.valueAsNumber;

    if (elements.some(el => (el.end_x ?? el.pos_x) > newLength)) {
        document.getElementById("out").textContent = "An element is out of the beam"
        return;
    }

    state.length = newLength;
    handlePositionSliders();
    render();
}
getLength();

function getSupport() {
    const support_pos = document.querySelector("#support_pos_x")
    const support_type = document.querySelector('input[name="support-type"]:checked')
    let pos = support_pos.valueAsNumber;
    if (support_type.value === "fixed") {
        pos = pos < state.length / 2 ? 0 : state.length;
    }
    addSupport({ type: support_type.value, pos_x: pos});
}

function snapFixedSupport() {
    const position = document.querySelector("#support_pos_x")
    const type = document.querySelector('input[name="support-type"]:checked')
    if (type.value === "fixed") {
        position.value = position.valueAsNumber < state.length / 2 ? 0 : state.length;
    }
    showSlideValue();
}
snapFixedSupport();

function getLoadType() {
    const loadType = document.getElementById("load_type").value;
    return loadType;
}

function getHinge() {
    const hinge_pos = document.getElementById("hinge_pos_x").valueAsNumber;
    let hinge = { pos_x: hinge_pos };
    addHinge(hinge);
}

function getLoad() {
    const loadType = getLoadType();
    let load;

    const value_fields = document.querySelector(`.fields[data-type="${loadType}"]`);
    const inputs = value_fields.querySelectorAll("input");
    const all_valid = [...inputs].every(i => i.reportValidity());
    if (!all_valid) return;

    switch (loadType) {
        case "point": {
            load = {
                type: loadType,
                pos_x: document.getElementById("load_pos_x").valueAsNumber,
                force: document.getElementById("force_value").valueAsNumber,
                angle: document.getElementById("force_angle").valueAsNumber,
            };
            break;
        }
        case "uniform": {
            const q0 = document.getElementById("q_start").valueAsNumber;
            const qE = document.getElementById("q_end").valueAsNumber;
            if (q0 >= qE) {
                document.querySelector("#out").textContent = "Początek obciązenia musi być przed jego końcem";
                return;
            }
            load = {
                type: loadType,
                start_x: q0,
                end_x: qE,
                q: document.getElementById("load_value").valueAsNumber,
            };
            break;
        }
        case "moment": {
            load = {
                type: loadType,
                pos_x: document.getElementById("moment_pos_x").valueAsNumber,
                moment: document.getElementById("moment_value").valueAsNumber,
            }
            break;
        }
        case "axial": {
            const a0 = document.getElementById("axial_q_start").valueAsNumber;
            const aE = document.getElementById("axial_q_end").valueAsNumber;
            if (a0 >= aE) {
                document.querySelector("#out").textContent = "Początek obciązenia musi być przed jego końcem";
                return;
            }
            load = {
                type: loadType,
                start_x: a0,
                end_x: aE,
                n: document.getElementById("axial_value").valueAsNumber,
            }
            break;
        }
        default: {
            return;
        }
    }
    addLoad(load);
}

function showSlideValue() {
    document.querySelectorAll('input[type="range"]').forEach(slider => {
        const out = document.getElementById(slider.dataset.output);
        out.textContent = slider.value;
    })
}
showSlideValue();

function handlePositionSliders() {
    document.querySelectorAll(".pos").forEach(s => {
        s.max = state.length
    })
    showSlideValue();
}

function handleVisibility() {
    const fields = document.querySelectorAll(".fields");
    const selected = document.querySelector("#load_type")
    fields.forEach(el => {
        el.hidden = el.dataset.type !== selected.value;
    });
}
handleVisibility();

function clearBeam() {
    state.supports = [];
    state.loads = [];
    state.hinges = [];
    render();
}

function metersToPixels(x) {
    const MARGIN = 64;
    let pixels;
    pixels = MARGIN + x / state.length * (800-2*MARGIN);
    return pixels;
}

function createSVG(tag, attributes) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const key in attributes) {
        el.setAttribute(key, attributes[key]);
    }
    return el;
}

function drawBeam(x0, xE, sketch) {
    sketch.append(createSVG("line", {x1: metersToPixels(x0), y1: BEAM_Y, x2: metersToPixels(xE), y2: BEAM_Y, stroke: "black", "stroke-width": 8}));
}

function drawSupport(sketch) {
    state.supports.forEach((support, i) => {
        let transform = `translate(${metersToPixels(support.pos_x)}, ${BEAM_Y})`;
        if (support.type === "fixed" && support.pos_x == state.length) {
            transform += " scale(-1, -1)";
        }
        const g = createSVG("g", {
            transform: transform,
            "data-list": "supports",
            "data-index": i,
        });
        if(support.type === "pinned") {
            drawPinned(g);
        } else if (support.type === "roller") {
            drawRoller(g);
        } else if(support.type === "fixed") {
            drawFixed(g);
        }
        sketch.append(g);
    });

}

function drawFixed(g) {
    g.append(createSVG("line", {
        x1: 0,
        y1: 32,
        x2: 0,
        y2: -32,
        stroke: "black",
        "stroke-width": 2,
    }));
    g.append(createSVG("line", {x1: -8, y1: 32, x2: 0, y2: 24, stroke: "black", "stroke-width": 0.5}));
    g.append(createSVG("line", {x1: -8, y1: 24, x2: 0, y2: 16, stroke: "black", "stroke-width": 0.5}));
    g.append(createSVG("line", {x1: -8, y1: 16, x2: 0, y2: 8, stroke: "black", "stroke-width": 0.5}));
    g.append(createSVG("line", {x1: -8, y1: 8, x2: 0, y2: 0, stroke: "black", "stroke-width": 0.5}));
    g.append(createSVG("line", {x1: -8, y1: 0, x2: 0, y2: -8, stroke: "black", "stroke-width": 0.5}));
    g.append(createSVG("line", {x1: -8, y1: -8, x2: 0, y2: -16, stroke: "black", "stroke-width": 0.5}));
    g.append(createSVG("line", {x1: -8, y1: -16, x2: 0, y2: -24, stroke: "black", "stroke-width": 0.5}));
    g.append(createSVG("line", {x1: -8, y1: -24, x2: 0, y2: -32, stroke: "black", "stroke-width": 0.5}));
}

function drawRoller(g) {
    g.append(createSVG("polygon", {points: "0,4 -16,32 16,32", fill: "white", stroke: "black"}));
    g.append(createSVG("circle", {cx: 0, cy: 0, r: 6, fill: "white", stroke: "black"}));
    g.append(createSVG("circle", {cx: -12, cy: 36, r: 4, fill: "white", stroke: "black"}));
    g.append(createSVG("circle", {cx: 0, cy: 36, r: 4, fill: "white", stroke: "black"}));
    g.append(createSVG("circle", {cx: 12, cy: 36, r: 4, fill: "white", stroke: "black"}));
    g.append(createSVG("line", {x1: -22, y1: 40, x2: 22, y2: 40, stroke: "black"}));
}

function drawPinned(g) {
    g.append(createSVG("polygon", {points: "0,4 -16,32 16,32", fill: "white", stroke: "black"}));
    g.append(createSVG("circle", {cx: 0, cy: 0, r: 6, fill: "white", stroke: "black"}));
    g.append(createSVG("line", {x1: -22, y1: 32, x2: 22, y2: 32, stroke: "black"}));
    g.append(createSVG("line", {x1: -22, y1: 36, x2: 22, y2: 36, stroke: "black"}));
}

function drawHinge(sketch) {
    state.hinges.forEach((hinge, i) => {
        const g = createSVG("g", {
            transform: `translate(${metersToPixels(hinge.pos_x)}, ${BEAM_Y})`,
            "data-list": "hinges",
            "data-index": i,
        });
        g.append(createSVG("circle", {cx: 0, cy: 0, r: 6, fill: "white", stroke: "black"}));
        sketch.append(g);
    });
}

function drawPointLoad(g, load) {
    let transform = `translate(${metersToPixels(load.pos_x)}, ${BEAM_Y}) rotate(${-(load.angle + 90)})`;
    if(load.force < 0) transform += " scale(1, -1)";
    g.setAttribute("transform", transform);
    g.append(createSVG("line", {
        x1: 0, 
        y1: 0, 
        x2: 0, 
        y2: -LOAD_H*2, 
        stroke: "black", 
        "stroke-width": 2
    }));
    g.append(createSVG("polygon", {
        points: "0,0 -3,-6 3,-6",
        fill: "black",
        stroke: "black",
    }));
}

function drawUniformLoad(g, load) {
    const w = metersToPixels(load.end_x) - metersToPixels(load.start_x);
    const arrowCount = Math.max(2, Math.round(w/30));
    let transform = `translate(${metersToPixels(load.start_x)}, ${BEAM_Y})`;
    if (load.q < 0) transform += " scale(1, -1)";
    g.setAttribute("transform", transform);
    g.append(createSVG("rect", {
        x: 0, 
        y: -LOAD_H, 
        width: w,
        height: LOAD_H,
        fill: "none",
        stroke: "black", 
        "stroke-width": 2,
    }));
    drawArrows(arrowCount, g, w);
}

function drawArrows(count, g, w) {
    for (let i = 0; i <= count; i++) {
        const x = i * w / count;
        g.append(createSVG("line", {
            x1: x,
            y1: 0,
            x2: x,
            y2: -LOAD_H,
            stroke: "black",
            "stroke-width": 1,
        }));
        g.append(createSVG("polygon", {
            points: `${x},0 ${x - 3},-6 ${x + 3},-6`,
            fill: "black",
            stroke: "black",
        }));     
    }
}

function drawAxialLoad(g, load) {
    const w = metersToPixels(load.end_x) - metersToPixels(load.start_x);
    let transform;
    if (load.n < 0){
        transform = `translate(${metersToPixels(load.end_x)}, ${BEAM_Y}) scale(-1, 1)`;
    } else {
        transform = `translate(${metersToPixels(load.start_x)}, ${BEAM_Y})`;
    }
    g.setAttribute("transform", transform);
    g.append(createSVG("line", {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: -LOAD_H,
        stroke: "black",
        "stroke-width": 2,
    }));
    g.append(createSVG("line", {
        x1: w,
        y1: 0,
        x2: w,
        y2: -LOAD_H,
        stroke: "black",
        "stroke-width": 2,
    }))
    drawAxialArrows(g, w);
}

function drawAxialArrows(g, width) {
    const y = -LOAD_H * 0.8;
    const len = 10;
    const count = Math.max(2, Math.round(width / 15));
    for (let i = 0; i < count; i++) {
        const x = i * width / count;
        g.append(createSVG("line", {
            x1: x,
            y1: y,
            x2: x + len - 4,
            y2: y,
            stroke: "black",
            "stroke-width": 1.5,
        }));
        g.append(createSVG("polygon", {
            points: `${x + len},${y} ${x + len - 5},${y - 3} ${x + len - 5},${y + 3}`,
            fill: "black",
        }));
    }
}

function drawMoment(g, load) {
    let transform = `translate(${metersToPixels(load.pos_x)}, ${BEAM_Y}) rotate(60)`;
    if(load.moment < 0) {
        transform += " scale(1, -1)";
    }
    g.setAttribute("transform", transform);
    g.append(createSVG("line", {
        x1: 0, 
        y1: 0, 
        x2: 0, 
        y2: -LOAD_H, 
        stroke: "black", 
        "stroke-width": 2
    }));
    g.append(createSVG("path", {
        d: `M ${-LOAD_H} 0 A ${LOAD_H} ${LOAD_H} 0 0 1 0 ${-LOAD_H+1}`,
        fill: "none",
        stroke: "black",
        "stroke-width": 2,
    }));
    g.append(createSVG("polygon", {
        points: `${-LOAD_H},0 ${-LOAD_H-3},-7 ${-LOAD_H+4},-6`,
        fill: "black",
        stroke: "black",
    }));
}

function drawLoads(sketch) {
    state.loads.forEach((load, i) => {
        const g = createSVG("g", {
            "data-list": "loads",
            "data-index": i,
        })
        LOAD_DRAWING[load.type](g, load);
        sketch.append(g);
    });
}

document.querySelector("#calculate").addEventListener("click", onCalculate);
document.querySelector("#confirm_length").addEventListener("click", getLength);
document.querySelector("#add_support").addEventListener("click", getSupport);
document.querySelector("#add_load").addEventListener("click", getLoad);
document.querySelector("#add_hinge").addEventListener("click", getHinge);
document.querySelector("#clear_beam").addEventListener("click", clearBeam);

document.querySelectorAll(".slide_val").forEach(s => {
    s.addEventListener("input", showSlideValue);
});
document.querySelector("#support_pos_x").addEventListener("input", snapFixedSupport);

document.querySelector("#load_type").addEventListener("change", handleVisibility);
document.querySelectorAll(`input[name="support-type"]`).forEach( r => {
    r.addEventListener("change", snapFixedSupport);
});