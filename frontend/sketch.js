const BEAM_Y = 128;
const LOAD_H = 32;

const LOAD_DRAWING = {
    point: drawPointLoad,
    uniform: drawUniformLoad,
    axial: drawAxialLoad,
    moment: drawMoment,
};

export function renderSketch(beam){
    const sketch = clearSketch("sketch");

    drawBeam(sketch, 0, beam.length);
    drawSupports(sketch, beam.supports, beam.length);
    drawLoads(sketch, beam.loads, beam.length);
    drawHinge(sketch, beam.hinges, beam.length);
}

function createSVG(tag, attributes) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const key in attributes) {
        el.setAttribute(key, attributes[key]);
    }
    return el;
}

function metersToPixels(x, length) {
    const MARGIN = 64;
    return (MARGIN + x / length * (800-2*MARGIN));
}

function clearSketch(id) {
    const sketch = document.getElementById(id);
    sketch.innerHTML = "";
    return sketch;
}

function drawBeam(sketch, x0, xE) {
    sketch.append(createSVG("line", {
        x1: metersToPixels(x0, xE), 
        y1: BEAM_Y, x2: metersToPixels(xE, xE), 
        y2: BEAM_Y, 
        stroke: "black", 
        "stroke-width": 8
    }));
}

function drawSupports(sketch, supports, length) {
    supports.forEach((support, i) => {
        let transform = `translate(${metersToPixels(support.pos_x, length)}, ${BEAM_Y})`;
        if (support.type === "fixed" && support.pos_x == length) {
            transform += " scale(-1, -1)";
        }
        const support_group = createSVG("g", {
            transform: transform,
            "data-list": "supports",
            "data-index": i,
        });
        if(support.type === "pinned") {
            drawPinned(support_group);
        } else if (support.type === "roller") {
            drawRoller(support_group);
        } else if(support.type === "fixed") {
            drawFixed(support_group);
        }
        sketch.append(support_group);
    });
}

function drawLoads(sketch, loads, length) {
    loads.forEach((load, i) => {
        const load_group = createSVG("g", {
            "data-list": "loads",
            "data-index": i,
        })
        LOAD_DRAWING[load.type](load_group, load, length);
        sketch.append(load_group);
    });
}

function drawHinge(sketch, hinges, length) {
    hinges.forEach((hinge, i) => {
        const hinge_group = createSVG("g", {
            transform: `translate(${metersToPixels(hinge.pos_x, length)}, ${BEAM_Y})`,
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

function drawPointLoad(g, load, length) {
    let transform = `translate(${metersToPixels(load.pos_x, length)}, ${BEAM_Y}) rotate(${-(load.angle + 90)})`;
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

function drawUniformLoad(g, load, length) {
    const w = metersToPixels(load.end_x, length) - metersToPixels(load.start_x, length);
    const arrowCount = Math.max(2, Math.round(w/30));
    let transform = `translate(${metersToPixels(load.start_x, length)}, ${BEAM_Y})`;
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

function drawAxialLoad(g, load, length) {
    const w = metersToPixels(load.end_x, length) - metersToPixels(load.start_x, length);
    let transform;
    if (load.n < 0){
        transform = `translate(${metersToPixels(load.end_x, length)}, ${BEAM_Y}) scale(-1, 1)`;
    } else {
        transform = `translate(${metersToPixels(load.start_x, length)}, ${BEAM_Y})`;
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

function drawMoment(g, load, length) {
    let transform = `translate(${metersToPixels(load.pos_x, length)}, ${BEAM_Y}) rotate(60)`;
    if(load.moment < 0) transform += " scale(1, -1)";

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

// ~~supports hardcoded~~
function drawFixed(g) {
    g.append(createSVG("line", {
        x1: 0,
        y1: 32,
        x2: 0,
        y2: -32,
        stroke: "black",
        "stroke-width": 2,
    }));
    for (let i=0; i < 4; i++) {
        g.append(createSVG("line", {x1: -8, y1: i*8, x2: 0, y2: (i-1)*8, stroke: "black", "stroke-width": 0.5}));
        g.append(createSVG("line", {x1: -8, y1: -(i-1)*8, x2: 0, y2: -i*8, stroke: "black", "stroke-width": 0.5}));
    }
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