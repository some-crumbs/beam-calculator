const state = {
    length: 6,
    units: "SI",
    supports: [],
    hinges: [],
    loads: [],
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
            out.textContent = "Error:\n" + err.detail
        } else if (Array.isArray(err.detail)) {
            out.textContent = "Error:\n" + err.detail[0].msg
        } else {
            out.textContent = "Error:\n" + err.message
            console.log(err)
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

    state.length = length.valueAsNumber;
    handlePositionSliders();
}
getLength();

function getSupport() {
    const support_pos = document.querySelector("#support_pos_x")
    const support_type = document.querySelector('input[name="support-type"]:checked')
    addSupport({ type: support_type.value, pos_x: support_pos.valueAsNumber });
}

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

document.querySelector("#calculate").addEventListener("click", onCalculate);
document.querySelector("#confirm_length").addEventListener("click", getLength);
document.querySelector("#add_support").addEventListener("click", getSupport);
document.querySelector("#add_load").addEventListener("click", getLoad);
document.querySelector("#add_hinge").addEventListener("click", getHinge);
document.querySelector("#clear_beam").addEventListener("click", clearBeam);

document.querySelectorAll(".slide_val").forEach(s => {
    s.addEventListener("input", showSlideValue);
});

document.querySelector("#load_type").addEventListener("change", handleVisibility);