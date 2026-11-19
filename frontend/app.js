import { solve } from "./api.js";
import { getLength, getSupport, getLoad, getHinge } from "./form.js";
import { snapFixedSupport, showSlideValue, handleVisibility, handlePositionSliders } from "./form.js";
import { drawGraphs } from "./diagrams.js";
import { renderSketch } from "./sketch.js";

const state = {
    length: 6,
    units: "SI",
    supports: [],
    hinges: [],
    loads: [],
};

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

function removeSupport(i) {
    state.supports.splice(i, 1);
    render();
}

function removeHinge(i) {
    state.hinges.splice(i, 1);
    render();
}

function clearBeam() {
    state.supports = [];
    state.loads = [];
    state.hinges = [];
    render();
}

function render() {
    snapFixedSupport(state.length);
    handlePositionSliders(state.length);
    showSlideValue();
    handleVisibility();
    const out = document.getElementById("out");
    out.textContent = JSON.stringify(state, null, 2);
    renderSketch(state);
}

function init_onclicks() {
    document.querySelector("#calculate").addEventListener("click", onCalculate);
    document.querySelector("#confirm_length").addEventListener("click", () => {
        const length = getLength(state.supports, state.loads, state.hinges);
        if (length) state.length = length;
        render();
    });
    document.querySelector("#add_support").addEventListener("click", () => {
        const support = getSupport(state.length);
        if (support) addSupport(support);
    });
    document.querySelector("#add_load").addEventListener("click", () => {
        const load = getLoad();
        if (load) addLoad(load);
    });
    document.querySelector("#add_hinge").addEventListener("click", () => {
        const hinge = getHinge();
        if (hinge) addHinge(hinge);
    });
    document.querySelector("#clear_beam").addEventListener("click", clearBeam);
}

function init_onchanges() {
    document.querySelector("#load_type").addEventListener("change", handleVisibility);
    document.querySelectorAll(`input[name="support-type"]`).forEach( r => {
        r.addEventListener("change", () => snapFixedSupport(state.length));
    });
}

function init_oninputs() {
    document.querySelectorAll(".slide_val").forEach(s => {
        s.addEventListener("input", showSlideValue);
    });
    document.querySelector("#support_pos_x").addEventListener("input", () => snapFixedSupport(state.length));
}

function init() {
    getLength(state.supports, state.loads, state.hinges);
    init_onclicks();
    init_onchanges();
    init_oninputs();
    // ~~initial calling of the frontend~~
    render();
}

init();
