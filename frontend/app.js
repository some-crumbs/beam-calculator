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

function removeSupport(i) {
    state.supports.splice(i, 1);
    render();
}

function removeHinge(i) {
    state.hinges.splice(i, 1);
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

getLength();

function snapFixedSupport() {
    const position = document.querySelector("#support_pos_x")
    const type = document.querySelector('input[name="support-type"]:checked')
    if (type.value === "fixed") {
        position.value = position.valueAsNumber < state.length / 2 ? 0 : state.length;
    }
    showSlideValue();
}
snapFixedSupport();

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
document.querySelector("#support_pos_x").addEventListener("input", snapFixedSupport);

document.querySelector("#load_type").addEventListener("change", handleVisibility);
document.querySelectorAll(`input[name="support-type"]`).forEach( r => {
    r.addEventListener("change", snapFixedSupport);
});