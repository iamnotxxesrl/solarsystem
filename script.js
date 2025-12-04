const planetData = {
    Mercury: { info: "The smallest planet in the Solar System.", moons: [], color: 0x8c7853, size: 3.8 },
    Venus: { info: "Venus has a thick atmosphere that traps heat.", moons: [], color: 0xffa500, size: 9.5 },
    Earth: { info: "The only planet known to support life.", moons: ["Moon"], color: 0x4169e1, size: 10 },
    Mars: { info: "Mars is known as the Red Planet.", moons: ["Phobos", "Deimos"], color: 0xcd5c5c, size: 5.3 },
    Jupiter: { info: "The largest planet in the Solar System.", moons: ["Ganymede", "Europa", "Io", "Callisto", "Amalthea"], color: 0xdaa520, size: 25 },
    Saturn: { info: "Famous for its large ring system.", moons: ["Titan", "Enceladus", "Mimas", "Rhea", "Iapetus"], color: 0xf4a460, size: 21, hasRings: true },
    Uranus: { info: "It rotates on its side!", moons: ["Titania", "Oberon", "Umbriel", "Ariel", "Miranda"], color: 0x87ceeb, size: 15 },
    Neptune: { info: "Neptune has the strongest winds in the Solar System.", moons: ["Triton", "Proteus", "Nereid", "Larissa", "Galatea"], color: 0x4169e1, size: 14 }
};

let scene, camera, renderer;
let planets = {};
let speedMultiplier = 1;
let autoRotate = true;
let raycaster, mouse;

// Orbital data: distance from sun in AU scaled for visual effect
const orbitalData = {
    Mercury: { distance: 40, speed: 0.04 },
    Venus: { distance: 60, speed: 0.015 },
    Earth: { distance: 85, speed: 0.01 },
    Mars: { distance: 110, speed: 0.008 },
    Jupiter: { distance: 160, speed: 0.002 },
    Saturn: { distance: 210, speed: 0.0009 },
    Uranus: { distance: 260, speed: 0.0004 },
    Neptune: { distance: 310, speed: 0.0001 }
};

function initScene() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0, 150, 150);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Add stars background
    addStars();

    // Add Sun
    const sunGeometry = new THREE.SphereGeometry(20, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xfdb813,
        emissive: 0xfdb813
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.userData.type = 'sun';
    scene.add(sun);

    // Add glow effect to sun
    const glowGeometry = new THREE.SphereGeometry(22, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.2
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    sun.add(glow);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 2, 500);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Create planets
    Object.keys(planetData).forEach(planetName => {
        createPlanet(planetName);
    });

    // Setup raycasting for mouse interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Event listeners
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onMouseClick);
    window.addEventListener('resize', onWindowResize);

    // Control panel listeners
    document.getElementById('speed-slider').addEventListener('input', (e) => {
        speedMultiplier = parseFloat(e.target.value);
        document.getElementById('speed-value').textContent = speedMultiplier.toFixed(1) + 'x';
    });

    document.getElementById('auto-rotate').addEventListener('change', (e) => {
        autoRotate = e.target.checked;
    });

    document.getElementById('reset-btn').addEventListener('click', resetCamera);
}

function addStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.7,
        sizeAttenuation: true
    });

    const starsVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(starsVertices), 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

function createPlanet(name) {
    const data = planetData[name];
    const geometry = new THREE.SphereGeometry(data.size, 32, 32);
    const material = new THREE.MeshPhongMaterial({
        color: data.color,
        shininess: 5,
        emissive: data.color,
        emissiveIntensity: 0.1
    });

    const planet = new THREE.Mesh(geometry, material);
    planet.castShadow = true;
    planet.receiveShadow = true;
    planet.userData.name = name;
    planet.userData.type = 'planet';
    planet.userData.angle = Math.random() * Math.PI * 2;

    scene.add(planet);
    planets[name] = planet;

    // Add Saturn's rings
    if (data.hasRings) {
        const ringGeometry = new THREE.TorusGeometry(data.size * 1.8, data.size * 0.8, 32, 100);
        const ringMaterial = new THREE.MeshPhongMaterial({
            color: 0xb8860b,
            side: THREE.DoubleSide,
            shininess: 0
        });
        const rings = new THREE.Mesh(ringGeometry, ringMaterial);
        rings.rotation.x = Math.PI / 6;
        planet.add(rings);
    }
}

function resetCamera() {
    camera.position.lerp(new THREE.Vector3(0, 150, 150), 0.1);
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(Object.values(planets));

    const tooltip = document.getElementById('tooltip');
    if (intersects.length > 0) {
        const object = intersects[0].object;
        tooltip.textContent = object.userData.name || 'Sun';
        tooltip.style.left = event.clientX + 10 + 'px';
        tooltip.style.top = event.clientY + 10 + 'px';
        tooltip.style.display = 'block';
        document.body.style.cursor = 'pointer';
    } else {
        tooltip.style.display = 'none';
        document.body.style.cursor = 'default';
    }
}

function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(Object.values(planets));

    if (intersects.length > 0) {
        const planet = intersects[0].object;
        showInfo(planet.userData.name);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function showInfo(planetName) {
    const data = planetData[planetName];
    document.getElementById("planet-name").innerText = planetName;
    document.getElementById("planet-info").innerText = data.info;

    const moonList = document.getElementById("moon-list");
    moonList.innerHTML = "";
    data.moons.forEach(moon => {
        let li = document.createElement("li");
        li.innerText = moon;
        moonList.appendChild(li);
    });

    document.getElementById("info-box").style.display = "block";
}

function closeInfo() {
    document.getElementById("info-box").style.display = "none";
}

function animate() {
    requestAnimationFrame(animate);

    // Update planet positions and rotations
    Object.keys(planets).forEach(name => {
        const planet = planets[name];
        const orbital = orbitalData[name];

        // Orbital motion
        planet.userData.angle += orbital.speed * speedMultiplier;
        planet.position.x = Math.cos(planet.userData.angle) * orbital.distance;
        planet.position.z = Math.sin(planet.userData.angle) * orbital.distance;

        // Rotation
        planet.rotation.y += 0.01 * speedMultiplier;
    });

    // Auto camera rotation
    if (autoRotate) {
        const time = Date.now() * 0.00001;
        camera.position.x = Math.cos(time) * 200;
        camera.position.z = Math.sin(time) * 200;
        camera.lookAt(0, 0, 0);
    }

    renderer.render(scene, camera);
}

// Start the application
window.addEventListener('DOMContentLoaded', () => {
    initScene();
    animate();
});
