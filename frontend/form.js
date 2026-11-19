function getLoadType() {
    const loadType = document.getElementById("load_type").value;
    return loadType;
}

export function getLength(supports, loads, hinges) {
    const length_container = document.querySelector("#length");
    const elements = [...supports, ...loads, ...hinges]

    
    const newLength = length_container.valueAsNumber;
    
    if (elements.some(el => (el.end_x ?? el.pos_x) > newLength)) {
        document.getElementById("out").textContent = "An element is out of the beam"
        return;
    }
    
    const length = newLength;

    if (!length_container.reportValidity()) return;
    return length;
}

export function getSupport(length) {
    const support_pos = document.querySelector("#support_pos_x")
    const support_type = document.querySelector('input[name="support-type"]:checked')
    let pos = support_pos.valueAsNumber;
    if (support_type.value === "fixed") {
        pos = pos < length / 2 ? 0 : length;
    }
    const support = {type: support_type.value, pos_x: pos};
    return support;
}

export function getLoad() {
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
    return load;
}

export function getHinge() {
    const hinge_pos = document.getElementById("hinge_pos_x").valueAsNumber;
    let hinge = { pos_x: hinge_pos };
    return hinge;
}

export function snapFixedSupport(length) {
    const position = document.querySelector("#support_pos_x")
    const type = document.querySelector('input[name="support-type"]:checked')
    if (type.value === "fixed") {
        position.value = position.valueAsNumber < length / 2 ? 0 : length;
    }
    showSlideValue();
}

export function showSlideValue() {
    document.querySelectorAll('input[type="range"]').forEach(slider => {
        const out = document.getElementById(slider.dataset.output);
        out.textContent = slider.value;
    })
}

export function handleVisibility() {
    const fields = document.querySelectorAll(".fields");
    const selected = document.querySelector("#load_type");
    fields.forEach(el => {
        el.hidden = el.dataset.type !== selected.value;
    });
}

export function handlePositionSliders(length) {
    document.querySelectorAll(".pos").forEach(s => {
        s.max = length;
    });
}
