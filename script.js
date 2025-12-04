const planetData = {
    Mercury: { info: "The smallest planet in the Solar System.", moons: [], color: 0x8c7853, size: 3.8, tilt: 0.034 },
    Venus: { info: "Venus has a thick atmosphere that traps heat.", moons: [], color: 0xffc649, size: 9.5, tilt: 3.09 },
    Earth: { info: "The only planet known to support life.", moons: ["Moon"], color: 0x4d94ff, size: 10, tilt: 0.409 },
    Mars: { info: "Mars is known as the Red Planet.", moons: ["Phobos", "Deimos"], color: 0xff6347, size: 5.3, tilt: 0.439 },
    Jupiter: { info: "The largest planet in the Solar System.", moons: ["Ganymede", "Europa", "Io", "Callisto", "Amalthea"], color: 0xc88b3a, size: 25, tilt: 0.054, hasStorms: true },
    Saturn: { info: "Famous for its large ring system.", moons: ["Titan", "Enceladus", "Mimas", "Rhea", "Iapetus"], color: 0xf4a460, size: 21, hasRings: true, tilt: 0.467 },
    Uranus: { info: "It rotates on its side!", moons: ["Titania", "Oberon", "Umbriel", "Ariel", "Miranda"], color: 0x87ceeb, size: 15, tilt: 1.708 },
    Neptune: { info: "Neptune has the strongest winds in the Solar System.", moons: ["Triton", "Proteus", "Nereid", "Larissa", "Galatea"], color: 0x4166ff, size: 14, tilt: 0.490 }
};

let scene, camera, renderer;
let planets = {};
let speedMultiplier = 1;
let autoRotate = true;
let showOrbits = true;
let freeLook = false;
let raycaster, mouse;
let controls = { forward: false, backward: false, left: false, right: false, up: false, down: false };
let rightMouseDown = false;
let previousMousePosition = { x: 0, y: 0 };
let orbitLines = [];

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
    scene.background = new THREE.Color(0x000000);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0, 150, 150);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Add stars background
    addStars();

    // Add Sun with improved visuals
    const sunGeometry = new THREE.SphereGeometry(20, 64, 64);
    const sunMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xfdb813,
        emissive: 0xfdb813,
        wireframe: false
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.userData.type = 'sun';
    scene.add(sun);

    // Add corona effect to sun
    const coronaGeometry = new THREE.SphereGeometry(22, 64, 64);
    const coronaMaterial = new THREE.MeshBasicMaterial({
        color: 0xff8800,
        transparent: true,
        opacity: 0.15
    });
    const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
    sun.add(corona);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x444444);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 2.5, 1000);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    // Create planets
    Object.keys(planetData).forEach(planetName => {
        createPlanet(planetName);
    });

    // Draw orbital paths
    drawOrbitalPaths();

    // Setup raycasting for mouse interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Event listeners
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('click', onMouseClick);
    window.addEventListener('wheel', onMouseWheel);
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Control panel listeners
    document.getElementById('speed-slider').addEventListener('input', (e) => {
        speedMultiplier = parseFloat(e.target.value);
        document.getElementById('speed-value').textContent = speedMultiplier.toFixed(1) + 'x';
    });

    document.getElementById('auto-rotate').addEventListener('change', (e) => {
        autoRotate = e.target.checked;
    });

    document.getElementById('show-orbits').addEventListener('change', (e) => {
        showOrbits = e.target.checked;
        orbitLines.forEach(line => line.visible = showOrbits);
    });

    document.getElementById('free-look').addEventListener('change', (e) => {
        freeLook = e.target.checked;
    });

    document.getElementById('reset-btn').addEventListener('click', resetCamera);
}

function drawOrbitalPaths() {
    Object.keys(orbitalData).forEach(planetName => {
        const orbital = orbitalData[planetName];
        const geometry = new THREE.BufferGeometry();
        const points = [];

        for (let i = 0; i <= 64; i++) {
            const angle = (i / 64) * Math.PI * 2;
            points.push(
                Math.cos(angle) * orbital.distance,
                0,
                Math.sin(angle) * orbital.distance
            );
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
        const material = new THREE.LineBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.3 });
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        orbitLines.push(line);
    });
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
    const geometry = new THREE.IcosahedronGeometry(data.size, 64);
    
    // Create texture with procedural patterns
    const canvas = createPlanetTexture(name);
    const texture = new THREE.CanvasTexture(canvas);
    
    const material = new THREE.MeshPhongMaterial({
        map: texture,
        shininess: 10,
        emissive: 0x111111,
        emissiveIntensity: 0.2,
        side: THREE.FrontSide
    });

    const planet = new THREE.Mesh(geometry, material);
    planet.castShadow = true;
    planet.receiveShadow = true;
    planet.userData.name = name;
    planet.userData.type = 'planet';
    planet.userData.angle = Math.random() * Math.PI * 2;
    planet.rotation.x = data.tilt;

    scene.add(planet);
    planets[name] = planet;

    // Add Saturn's rings
    if (data.hasRings) {
        const ringGeometry = new THREE.TorusGeometry(data.size * 1.8, data.size * 0.8, 32, 100);
        const ringMaterial = new THREE.MeshPhongMaterial({
            color: 0xb8860b,
            side: THREE.DoubleSide,
            shininess: 0,
            emissive: 0x444444
        });
        const rings = new THREE.Mesh(ringGeometry, ringMaterial);
        rings.rotation.x = Math.PI / 6.5;
        planet.add(rings);
    }
}

function createPlanetTexture(name) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    const data = planetData[name];

    // Fill with main color
    ctx.fillStyle = '#' + data.color.toString(16).padStart(6, '0');
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add planet-specific patterns
    if (name === 'Earth') {
        addEarthTexture(ctx, canvas);
    } else if (name === 'Jupiter') {
        addJupiterTexture(ctx, canvas);
    } else if (name === 'Saturn') {
        addSaturnTexture(ctx, canvas);
    } else if (name === 'Mars') {
        addMarsTexture(ctx, canvas);
    } else if (name === 'Venus') {
        addVenusTexture(ctx, canvas);
    } else if (name === 'Mercury') {
        addMercuryTexture(ctx, canvas);
    } else if (name === 'Uranus') {
        addUranusTexture(ctx, canvas);
    } else if (name === 'Neptune') {
        addNeptuneTexture(ctx, canvas);
    }

    // Add noise texture
    addNoiseTexture(ctx, canvas);

    return canvas;
}

function addEarthTexture(ctx, canvas) {
    // Add continents (simplified)
    ctx.fillStyle = 'rgba(0, 100, 0, 0.6)';
    for (let i = 0; i < 5; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 80 + 40;
        ctx.beginPath();
        ctx.ellipse(x, y, size, size * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }
}

function addJupiterTexture(ctx, canvas) {
    // Add bands
    ctx.strokeStyle = 'rgba(200, 120, 50, 0.4)';
    ctx.lineWidth = 20;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * canvas.height / 5 + 30);
        ctx.bezierCurveTo(canvas.width * 0.25, i * canvas.height / 5 + 40, canvas.width * 0.75, i * canvas.height / 5 + 20, canvas.width, i * canvas.height / 5 + 30);
        ctx.stroke();
    }
}

function addSaturnTexture(ctx, canvas) {
    // Add bands
    ctx.strokeStyle = 'rgba(200, 150, 80, 0.3)';
    ctx.lineWidth = 15;
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (i + 1) * canvas.height / 5);
        ctx.lineTo(canvas.width, (i + 1) * canvas.height / 5);
        ctx.stroke();
    }
}

function addMarsTexture(ctx, canvas) {
    // Add cratering effect
    ctx.fillStyle = 'rgba(139, 60, 40, 0.5)';
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 15 + 5;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

function addVenusTexture(ctx, canvas) {
    // Add swirling clouds
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.3)';
    ctx.lineWidth = 10;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 3 + i * 40);
        ctx.bezierCurveTo(canvas.width * 0.25, canvas.height / 3 + i * 40 + 20, canvas.width * 0.75, canvas.height / 3 + i * 40 - 20, canvas.width, canvas.height / 3 + i * 40);
        ctx.stroke();
    }
}

function addMercuryTexture(ctx, canvas) {
    // Add surface details
    ctx.fillStyle = 'rgba(100, 100, 100, 0.4)';
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 8 + 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

function addUranusTexture(ctx, canvas) {
    // Add atmospheric bands
    ctx.strokeStyle = 'rgba(150, 200, 220, 0.2)';
    ctx.lineWidth = 8;
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * canvas.height / 6);
        ctx.lineTo(canvas.width, i * canvas.height / 6);
        ctx.stroke();
    }
}

function addNeptuneTexture(ctx, canvas) {
    // Add storm details
    ctx.fillStyle = 'rgba(100, 150, 200, 0.3)';
    ctx.fillRect(canvas.width * 0.6, canvas.height * 0.3, canvas.width * 0.3, canvas.height * 0.3);
    ctx.strokeStyle = 'rgba(150, 200, 255, 0.4)';
    ctx.lineWidth = 6;
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (i + 1) * canvas.height / 5);
        ctx.lineTo(canvas.width, (i + 1) * canvas.height / 5);
        ctx.stroke();
    }
}

function addNoiseTexture(ctx, canvas) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 30;
        data[i] += noise;
        data[i + 1] += noise;
        data[i + 2] += noise;
    }
    ctx.putImageData(imageData, 0, 0);
}

function resetCamera() {
    camera.position.set(0, 150, 150);
    camera.lookAt(0, 0, 0);
}

function onMouseDown(event) {
    if (event.button === 2) { // Right mouse button
        rightMouseDown = true;
        previousMousePosition = { x: event.clientX, y: event.clientY };
    }
}

function onMouseUp(event) {
    if (event.button === 2) {
        rightMouseDown = false;
    }
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (rightMouseDown && !freeLook) {
        const deltaX = event.clientX - previousMousePosition.x;
        const deltaY = event.clientY - previousMousePosition.y;
        
        const radius = camera.position.length();
        const theta = Math.atan2(camera.position.z, camera.position.x);
        const phi = Math.acos(camera.position.y / radius);
        
        const newTheta = theta - deltaX * 0.01;
        const newPhi = Math.max(0.1, Math.min(Math.PI - 0.1, phi + deltaY * 0.01));
        
        camera.position.x = radius * Math.sin(newPhi) * Math.cos(newTheta);
        camera.position.y = radius * Math.cos(newPhi);
        camera.position.z = radius * Math.sin(newPhi) * Math.sin(newTheta);
        camera.lookAt(0, 0, 0);
    }
    
    previousMousePosition = { x: event.clientX, y: event.clientY };

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
    if (event.button !== 0) return; // Left click only
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(Object.values(planets));

    if (intersects.length > 0) {
        const planet = intersects[0].object;
        showInfo(planet.userData.name);
    }
}

function onMouseWheel(event) {
    event.preventDefault();
    const direction = camera.position.clone().normalize();
    const distance = camera.position.length();
    const newDistance = Math.max(50, Math.min(500, distance + event.deltaY * 0.1));
    camera.position.copy(direction.multiplyScalar(newDistance));
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
    if (!freeLook) return;
    switch(event.key.toLowerCase()) {
        case 'w': controls.forward = true; break;
        case 'a': controls.left = true; break;
        case 's': controls.backward = true; break;
        case 'd': controls.right = true; break;
        case ' ': controls.up = true; break;
        case 'shift': controls.down = true; break;
    }
}

function onKeyUp(event) {
    switch(event.key.toLowerCase()) {
        case 'w': controls.forward = false; break;
        case 'a': controls.left = false; break;
        case 's': controls.backward = false; break;
        case 'd': controls.right = false; break;
        case ' ': controls.up = false; break;
        case 'shift': controls.down = false; break;
    }
}

function updateFreeLookCamera() {
    const speed = 0.5;
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0);

    if (controls.forward) camera.position.addScaledVector(forward, speed);
    if (controls.backward) camera.position.addScaledVector(forward, -speed);
    if (controls.right) camera.position.addScaledVector(right, speed);
    if (controls.left) camera.position.addScaledVector(right, -speed);
    if (controls.up) camera.position.addScaledVector(up, speed);
    if (controls.down) camera.position.addScaledVector(up, -speed);
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
        planet.rotation.z += 0.01 * speedMultiplier;
    });

    // Update free look camera
    if (freeLook) {
        updateFreeLookCamera();
    } else if (autoRotate) {
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
