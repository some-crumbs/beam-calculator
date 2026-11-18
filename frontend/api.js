export async function solve(beam) {
    const result = await fetch("/solve", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify(beam),
    });
    const data = await result.json();
    if (!result.ok) throw data;
    return data;
}

export async function onCalculate() {
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