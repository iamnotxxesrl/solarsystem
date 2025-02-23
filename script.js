const planetData = {
    Mercury: { info: "The smallest planet in the Solar System.", moons: [] },
    Venus: { info: "Venus has a thick atmosphere that traps heat.", moons: [] },
    Earth: { info: "The only planet known to support life.", moons: ["Moon"] },
    Mars: { info: "Mars is known as the Red Planet.", moons: ["Phobos", "Deimos"] },
    Jupiter: { info: "The largest planet in the Solar System.", moons: ["Ganymede", "Europa", "Io", "Callisto", "Amalthea"] },
    Saturn: { info: "Famous for its large ring system.", moons: ["Titan", "Enceladus", "Mimas", "Rhea", "Iapetus"] },
    Uranus: { info: "It rotates on its side!", moons: ["Titania", "Oberon", "Umbriel", "Ariel", "Miranda"] },
    Neptune: { info: "Neptune has the strongest winds in the Solar System.", moons: ["Triton", "Proteus", "Nereid", "Larissa", "Galatea"] }
};

function showInfo(planet) {
    const infoBox = document.getElementById("info-box");
    document.getElementById("planet-name").innerText = planet;
    document.getElementById("planet-info").innerText = planetData[planet].info;

    const moonList = document.getElementById("moon-list");
    moonList.innerHTML = "";
    planetData[planet].moons.forEach(moon => {
        let li = document.createElement("li");
        li.innerText = moon;
        moonList.appendChild(li);
    });

    infoBox.style.display = "block";
}

function closeInfo() {
    document.getElementById("info-box").style.display = "none";
}
