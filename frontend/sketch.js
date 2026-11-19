const loadCount = { 
    point: 0, 
    uniform: 0, 
    moment: 0, 
    axial: 0 
};
const pointCount = {
    supports: 0,
    hinges: 0
};
const BEAM_Y = 128;
const LOAD_H = 32;
const MARGIN = 64;
const LOAD_DRAWING = {
    point: drawPointLoad,
    uniform: drawUniformLoad,
    axial: drawAxialLoad,
    moment: drawMoment,
};
const L_PREFIXES = {
    point: "P",
    uniform: "q",
    moment: "M",
    axial: "n"
};
const UNITS_SI = {
    point: "N",
    uniform: "N/m",
    moment: "Nm",
    axial: "N/m"
};
const UNITS_IMPERIAL = {
    point: "lbf",
    uniform: "lbf/ft",
    moment: "lbf*ft",
    axial: "lbf/ft"
};
let beamLength;

export function renderSketch(beam){
    beamLength = beam.length;
    const sketch = clearSketch("sketch");

    drawBeam(sketch, 0, beamLength);
    drawSupports(sketch, beam.supports);
    drawLoads(sketch, beam.loads);
    drawHinge(sketch, beam.hinges);
}

// ~~Element drawers~~
function drawBeam(sketch, x0, xE) {
    sketch.append(createSVG("line", {
        x1: metersToPixels(x0), y1: BEAM_Y, 
        x2: metersToPixels(xE), y2: BEAM_Y, 
        stroke: "black", "stroke-width": 8
    }));
}

function drawSupports(sketch, supports) {
    supports.forEach((support, i) => {

        const g = createSVG("g", {
            "data-list": "supports",
            "data-index": i,
        });

        let transform = `translate(${metersToPixels(support.pos_x)}, ${BEAM_Y})`;
        if (support.type === "fixed" && support.pos_x == beamLength) transform += " scale(-1, -1)";

        const shape = createSVG("g", { transform: transform });
        
        if (support.type === "pinned") drawPinned(shape);
   else if (support.type === "roller") drawRoller(shape);
   else if (support.type === "fixed") drawFixed(shape);

        sketch.append(g);
    });
}

function drawLoads(group, loads) {
    loads.forEach((load, i) => {
        const load_group = createSVG("g", {
            "data-list": "loads",
            "data-index": i,
        });
        LOAD_DRAWING[load.type](load_group, load);
        sketch.append(load_group);
    });
}

function drawHinge(sketch, hinges) {
    hinges.forEach((hinge, i) => {
        const hinge_group = createSVG("g", {
            transform: `translate(${metersToPixels(hinge.pos_x)}, ${BEAM_Y})`,
            "data-list": "hinges",
            "data-index": i,
        });
        hinge_group.append(createSVG("circle", {
            cx: 0, 
            cy: 0, 
            r: 6, 
            fill: "white", 
            stroke: "black"
        }));
        sketch.append(hinge_group);
    });
}

// ~~load-type specific drawers~~
function drawPointLoad(sketch, load) {
    let transform = `translate(${metersToPixels(load.pos_x)}, ${BEAM_Y}) rotate(${-(load.angle + 90)})`;
    if(load.force < 0) transform += " scale(1, -1)";

    sketch.setAttribute("transform", transform);
    sketch.append(createSVG("line", {
        x1: 0, 
        y1: 0, 
        x2: 0, 
        y2: -LOAD_H*2, 
        stroke: "black", 
        "stroke-width": 2
    }));
    sketch.append(createSVG("polygon", {
        points: "0,0 -3,-6 3,-6",
        fill: "black",
        stroke: "black",
    }));
}

function drawUniformLoad(sketch, load) {
    const w = metersToPixels(load.end_x, beamLength) - metersToPixels(load.start_x, beamLength);
    let transform = `translate(${metersToPixels(load.start_x, beamLength)}, ${BEAM_Y})`;
    if (load.q < 0) transform += " scale(1, -1)";
    sketch.setAttribute("transform", transform);
    sketch.append(createSVG("rect", {
        x: 0, 
        y: -LOAD_H, 
        width: w,
        height: LOAD_H,
        fill: "none",
        stroke: "black", 
        "stroke-width": 2,
    }));
    drawArrows(sketch, w);
}

function drawAxialLoad(sketch, load) {
    const w = metersToPixels(load.end) - metersToPixels(load.start_x);
    let transform;
    if (load.n < 0){
        transform = `translate(${metersToPixels(load.end_x)}, ${BEAM_Y}) scale(-1, 1)`;
    } else {
        transform = `translate(${metersToPixels(load.start_x)}, ${BEAM_Y})`;
    }
    sketch.setAttribute("transform", transform);
    sketch.append(createSVG("line", {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: -LOAD_H,
        stroke: "black",
        "stroke-width": 2,
    }));
    sketch.append(createSVG("line", {
        x1: w,
        y1: 0,
        x2: w,
        y2: -LOAD_H,
        stroke: "black",
        "stroke-width": 2,
    }))
    drawAxialArrows(sketch, w);
}

function drawMoment(sketch, load) {
    let transform = `translate(${metersToPixels(load.pos_x, beamLength)}, ${BEAM_Y}) rotate(60)`;
    if(load.moment < 0) transform += " scale(1, -1)";

    sketch.setAttribute("transform", transform);
    sketch.append(createSVG("line", {
        x1: 0, 
        y1: 0, 
        x2: 0, 
        y2: -LOAD_H, 
        stroke: "black", 
        "stroke-width": 2
    }));
    sketch.append(createSVG("path", {
        d: `M ${-LOAD_H} 0 A ${LOAD_H} ${LOAD_H} 0 0 1 0 ${-LOAD_H+1}`,
        fill: "none",
        stroke: "black",
        "stroke-width": 2,
    }));
    sketch.append(createSVG("polygon", {
        points: `${-LOAD_H},0 ${-LOAD_H-3},-7 ${-LOAD_H+4},-6`,
        fill: "black",
        stroke: "black",
    }));
}

// ~~supports shapes~~
function drawFixed(sketch) {
    sketch.append(createSVG("line", {
        x1: 0,
        y1: 32,
        x2: 0,
        y2: -32,
        stroke: "black",
        "stroke-width": 2,
    }));
    for (let i=0; i < 4; i++) {
        sketch.append(createSVG("line", {x1: -8, y1: i*8, x2: 0, y2: (i-1)*8, stroke: "black", "stroke-width": 0.5}));
        sketch.append(createSVG("line", {x1: -8, y1: -(i-1)*8, x2: 0, y2: -i*8, stroke: "black", "stroke-width": 0.5}));
    }
}

function drawRoller(sketch) {
    sketch.append(createSVG("polygon", {points: "0,4 -16,32 16,32", fill: "white", stroke: "black"}));
    sketch.append(createSVG("circle", {cx: 0, cy: 0, r: 6, fill: "white", stroke: "black"}));
    sketch.append(createSVG("circle", {cx: -12, cy: 36, r: 4, fill: "white", stroke: "black"}));
    sketch.append(createSVG("circle", {cx: 0, cy: 36, r: 4, fill: "white", stroke: "black"}));
    sketch.append(createSVG("circle", {cx: 12, cy: 36, r: 4, fill: "white", stroke: "black"}));
    sketch.append(createSVG("line", {x1: -22, y1: 40, x2: 22, y2: 40, stroke: "black"}));
}

function drawPinned(sketch) {
    sketch.append(createSVG("polygon", {points: "0,4 -16,32 16,32", fill: "white", stroke: "black"}));
    sketch.append(createSVG("circle", {cx: 0, cy: 0, r: 6, fill: "white", stroke: "black"}));
    sketch.append(createSVG("line", {x1: -22, y1: 32, x2: 22, y2: 32, stroke: "black"}));
    sketch.append(createSVG("line", {x1: -22, y1: 36, x2: 22, y2: 36, stroke: "black"}));
}

// ~~helpers~~
function drawArrows(sketch, width) {
    const count = Math.max(2, Math.round(width / 30));
    for (let i = 0; i <= count; i++) {
        const x = i * width / count;
        sketch.append(createSVG("line", {
            x1: x,
            y1: 0,
            x2: x,
            y2: -LOAD_H,
            stroke: "black",
            "stroke-width": 1,
        }));
        sketch.append(createSVG("polygon", {
            points: `${x},0 ${x - 3},-6 ${x + 3},-6`,
            fill: "black",
            stroke: "black",
        }));     
    }
}

function drawAxialArrows(sketch, width) {
    const y = -LOAD_H * 0.8;
    const len = 10;
    const count = Math.max(2, Math.round(width / 15));
    for (let i = 0; i < count; i++) {
        const x = i * width / count;
        sketch.append(createSVG("line", {
            x1: x,
            y1: y,
            x2: x + len - 4,
            y2: y,
            stroke: "black",
            "stroke-width": 1.5,
        }));
        sketch.append(createSVG("polygon", {
            points: `${x + len},${y} ${x + len - 5},${y - 3} ${x + len - 5},${y + 3}`,
            fill: "black",
        }));
    }
}

function createSVG(tag, attributes) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const key in attributes) {
        el.setAttribute(key, attributes[key]);
    }
    return el;
}

function metersToPixels(x) {
    return (MARGIN + x / beamLength * (800-2*MARGIN));
}

function clearSketch(id) {
    const sketch = document.getElementById(id);
    sketch.innerHTML = "";
    return sketch;
}