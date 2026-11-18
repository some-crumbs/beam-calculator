const BEAM_Y = 128;
const LOAD_H = 32;

export const LOAD_DRAWING = {
    point: drawPointLoad,
    uniform: drawUniformLoad,
    axial: drawAxialLoad,
    moment: drawMoment,
};

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