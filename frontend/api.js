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

