// --- GLOBALS ---
const NUM_PARTICLES = 2500;
let particles = [];

// UI elements
let playButton, switchSongButton;
let fft;
let musicFiles = []; // Array to hold multiple songs
let currentSongIndex = 0;
let crossfadeDuration = 3; // Duration of crossfade in seconds
let isCrossfading = false;

// 3D camera/space/starfield variables
let cam;
let baseSpeed = 150;
let currentSpeed = baseSpeed;
let targetSpeed = baseSpeed;
let cameraZ = 0;
let cameraX = 0;
let cameraY = 0;
let targetX = 0;
let targetY = 0;
let radius = 3000;

// --- Camera interaction variables ---
let camRotX = 0;
let camRotY = 0;
let targetCamRotX = 0;
let targetCamRotY = 0;
let isMouseDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// --- Camera orbit variables ---
let camAngleX = 0;
let camAngleY = 0;
let targetCamAngleX = 0.5;
let targetCamAngleY = 0.5;
let camRadius = 1200;
let isDragging = false;

// --- Mesh parameters ---
const MESH_ROWS = 32;
const MESH_COLS = 64;
let meshParticles = [];

// Flight path variables
let flightPath = {
    angle: 0,
    turbulence: 0,
    targetTurbulence: 0
};

// --- Add mesh music-reactive state ---
let meshMusicState = {bass: 0, mid: 0, treble: 0};

// --- Morph effect state ---
let morphing = false;
let morphStartTime = 0;
let morphDuration = 4.0; // seconds (longer for smoothness)
let morphHold = 0.5; // seconds to hold at max morph

function preload() {
    const songPaths = [
        './music/the_way_i_are.mp3',
        './music/Parano.mp3',
        './music/king_shit.mp3',
        './music/babydoll.mp3',
        './music/warriyo_mortals.mp3',
        './music/am_i_dreaming.mp3',
        './music/million_dollar_baby.mp3',
    ];

    // Load songs into musicFiles array
    for (let path of songPaths) {
        let sound = loadSound(path);
        musicFiles.push(sound);
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    colorMode(HSB, 360, 255, 255, 255);
    angleMode(RADIANS);
    fft = new p5.FFT();
    fft.smooth(0.9);
    frameRate(60);
    // Always create meshParticles
    meshParticles = createGeodesicMesh(3, 400); // higher density

    // Create UI controls
    createUI();

    // Start playing the first song
    if (musicFiles.length > 0) {
        musicFiles[currentSongIndex].play();
        playButton.html('Pause');
    }

    // Create camera and set initial perspective
    cam = createCamera();
    perspective(PI/3, width/height, 1, radius * 2);
    strokeWeight(2);  // Larger points for stars
}

// --- Global mesh phase for smooth animation ---
let meshPhase = 0;

function draw() {
    // Soft vignette background
    push();
    resetMatrix();
    noStroke();
    for (let r = 0; r < width/2; r += 8) {
        fill(0, 0, 16, map(r, 0, width/2, 120, 0));
        ellipse(width/2, height/2, width-r, height-r);
    }
    pop();
    background(0, 0, 16, 255);
    let spectrum = fft.analyze();
    let bass = fft.getEnergy("bass");
    let mid = fft.getEnergy("mid");
    let treble = fft.getEnergy("treble");
    // Smoothly lerp music state for smooth motion
    meshMusicState.bass = easeLerp(meshMusicState.bass, bass, 0.06);
    meshMusicState.mid = easeLerp(meshMusicState.mid, mid, 0.06);
    meshMusicState.treble = easeLerp(meshMusicState.treble, treble, 0.06);
    // Camera inertia/orbit
    if (!isDragging) {
        targetCamAngleX += 0.0025;
        targetCamAngleY += 0.0012;
    }
    camAngleX = easeLerp(camAngleX, targetCamAngleX, 0.06);
    camAngleY = easeLerp(camAngleY, targetCamAngleY, 0.06);
    let camX = camRadius * sin(camAngleX) * cos(camAngleY);
    let camY = camRadius * sin(camAngleY);
    let camZ = camRadius * cos(camAngleX) * cos(camAngleY);
    camera(camX, camY, camZ, 0, 0, 0, 0, 1, 0);
    meshPhase += 0.012; // advance global phase smoothly
    let t = millis() * 0.001 + meshPhase;
    let globalScale = 1.0 + map(meshMusicState.bass, 0, 255, -0.18, 0.32) + 0.04*sin(t*0.5);
    // Morph effect logic
    let morphAmount = 0;
    if (morphing) {
        let now = millis() / 1000.0;
        let elapsed = now - morphStartTime;
        let half = (morphDuration - morphHold) / 2;
        if (elapsed < half) {
            // Ease in
            let p = constrain(elapsed / half, 0, 1);
            morphAmount = p*p*(3-2*p); // smoothstep
        } else if (elapsed < half + morphHold) {
            // Hold at max
            morphAmount = 1;
        } else if (elapsed < morphDuration) {
            // Ease out
            let p = constrain((elapsed - half - morphHold) / half, 0, 1);
            morphAmount = 1 - p*p*(3-2*p); // smoothstep out
        } else {
            morphing = false;
            morphAmount = 0;
        }
    }
    for (let i = 0; i < meshParticles.length; i++) {
        let p = meshParticles[i];
        if (!p || !p.base) continue;
        let latNorm = constrain((p.base.y/400 + 1) * 0.5, 0, 1);
        let bandIdx = floor(map(latNorm, 0, 1, 0, spectrum.length-1));
        let bandEnergy = spectrum[bandIdx] || 0;
        if (!isFinite(bandEnergy)) bandEnergy = 0;
        if (!p.energy) p.energy = bandEnergy;
        p.energy = easeLerp(p.energy, bandEnergy, 0.10);
        // Always use sphere, but morph during song change
        let pos = getSpherePosition(p, t, 400, morphAmount);
        let wave = sin(t*1.2 + pos.x*0.02 + pos.y*0.02 + pos.z*0.02 + (p.wave||0) + p.energy*0.02) * map(p.energy,0,255,30,90)
                 + sin(t*0.7 + pos.y*0.03 + pos.z*0.03) * map(p.energy,0,255,10,40);
        let jitter = sin(t*2.5 + pos.x*0.2 + pos.y*0.2 + pos.z*0.2 + p.energy*0.05) * map(p.energy,0,255,0,22);
        p.x = constrain((pos.x + (pos.x/400) * wave + (pos.x/400) * jitter) * globalScale, -9999, 9999);
        p.y = constrain((pos.y + (pos.y/400) * wave + (pos.y/400) * jitter) * globalScale, -9999, 9999);
        p.z = constrain((pos.z + (pos.z/400) * wave + (pos.z/400) * jitter) * globalScale, -9999, 9999);
        // Aesthetic color: vibrant, spatial, and music-reactive
        let spatial = (p.base.lat / Math.PI + p.base.lon / (2*Math.PI)) * 180;
        let timeFlow = (t * 30 + morphAmount * 120) % 360;
        let musicHue = 120 * pow(p.energy/255,1.5);
        p.hue = (spatial + timeFlow + musicHue) % 360;
        p.size = constrain(2.2 + 2.5*pow(p.energy/255,1.7), 2, 7);
    }
    // Draw mesh lines between close points
    blendMode(ADD);
    strokeWeight(1.2);
    for (let i = 0; i < meshParticles.length; i++) {
        let p1 = meshParticles[i];
        for (let j = i+1; j < meshParticles.length; j++) {
            let p2 = meshParticles[j];
            let d = dist(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
            if (d < 70) {
                let alpha = map(d, 0, 70, 120, 0);
                let hue = (p1.hue + p2.hue) * 0.5;
                stroke(hue, 180, 255, alpha);
                line(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
            }
        }
    }
    // Draw points with glow
    noStroke();
    for (let i = 0; i < meshParticles.length; i++) {
        let p = meshParticles[i];
        let glow = 180 + 60*sin(t + p.base.x*0.01 + p.base.y*0.01);
        fill(p.hue, 180, glow, 220);
        push(); translate(p.x, p.y, p.z); sphere(p.size); pop();
        // Soft outer glow
        fill(p.hue, 80, 255, 30);
        push(); translate(p.x, p.y, p.z); sphere(p.size*2.2); pop();
    }
    // Handle crossfading
    if (isCrossfading) handleCrossfade();
    // Fallback: if meshParticles is empty, draw a debug sphere
    if (!meshParticles || meshParticles.length === 0) {
        push();
        fill(200, 255, 255, 180);
        noStroke();
        sphere(300);
        pop();
        return;
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function mousePressed() {
    isDragging = true;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
}
function mouseReleased() { isDragging = false; }
function mouseDragged() {
    if (isDragging) {
        let dx = mouseX - lastMouseX;
        let dy = mouseY - lastMouseY;
        targetCamAngleX += dx * 0.01;
        targetCamAngleY = constrain(targetCamAngleY + dy * 0.01, -PI/2, PI/2);
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    }
}

// Play or pause the music
function playMusic() {
    let currentSong = musicFiles[currentSongIndex];
    if (currentSong.isPlaying()) {
        currentSong.pause();
        playButton.html('Play');
    } else {
        currentSong.play();
        playButton.html('Pause');
    }
}

// Switch to the next song with crossfade
function switchSong() {
    if (isCrossfading) return; // Prevent multiple crossfades at once

    let currentSong = musicFiles[currentSongIndex];
    currentSongIndex = (currentSongIndex + 1) % musicFiles.length;
    let nextSong = musicFiles[currentSongIndex];

    isCrossfading = true;

    // Set initial volumes
    currentSong.setVolume(1);
    nextSong.setVolume(0);
    nextSong.play();
    playButton.html('Pause');

    // Trigger morph effect
    triggerMorph();

    // Start crossfade timer
    crossfadeStartTime = millis();
}

let crossfadeStartTime = 0;

function handleCrossfade() {
    let elapsed = (millis() - crossfadeStartTime) / 900; // Convert to seconds
    let progress = elapsed / crossfadeDuration;

    if (progress >= 1) {
        // Crossfade complete
        let previousSongIndex = (currentSongIndex - 1 + musicFiles.length) % musicFiles.length;
        let previousSong = musicFiles[previousSongIndex];
        previousSong.stop();
        musicFiles[currentSongIndex].setVolume(1);
        isCrossfading = false;
    } else {
        // Update volumes for crossfade
        let previousSongIndex = (currentSongIndex - 1 + musicFiles.length) % musicFiles.length;
        let previousSong = musicFiles[previousSongIndex];
        let currentSong = musicFiles[currentSongIndex];

        let fadeOutVolume = map(progress, 0, 1, 1, 0);
        let fadeInVolume = map(progress, 0, 1, 0, 1);

        previousSong.setVolume(fadeOutVolume);
        currentSong.setVolume(fadeInVolume);
    }
}

// Create UI controls
function createUI() {
    // Create song switch button
    switchSongButton = createButton('Next Song');
    switchSongButton.position(10, 40);
    switchSongButton.style('background-color', 'rgba(0, 0, 0, 0.5)');
    switchSongButton.style('color', 'white');
    switchSongButton.style('border', '1px solid rgba(255, 255, 255, 0.7)');
    switchSongButton.mousePressed(switchSong);

    // Create play/pause button
    playButton = createButton('Play');
    playButton.position(10, 10);
    playButton.style('background-color', 'rgba(0, 0, 0, 0.5)');
    playButton.style('color', 'white');
    playButton.style('border', '1px solid rgba(255, 255, 255, 0.7)');
    playButton.mousePressed(playMusic);
}

function styleButton(btn) {
    btn.style('background', 'rgba(0,0,0,0.5)');
    btn.style('color', 'white');
    btn.style('border', '1px solid rgba(255,255,255,0.7)');
    btn.style('padding', '5px');
}

// Helper function to get smoothed waveform
function getSmoothedWaveform(smoothing) {
    const waveform = fft.waveform();
    return movingAverage(waveform, smoothing);
}

// Particle class for starfield effect
class Particle {
    constructor() {
        this.reset();
        this.z = random(-radius, 0);
    }

    reset() {
        let angle = random(TWO_PI);
        let rad = random(100, 1200); // wider field
        this.x = cos(angle) * rad;
        this.y = sin(angle) * rad;
        this.z = radius;
        this.size = random(0.7, 1.7);
        this.baseSize = this.size;
        this.hue = random(200, 260); // blue-violet range
        this.brightness = random(180, 255);
        this.alpha = random(120, 200);
        this.speedMultiplier = random(0.7, 1.3);
        this.sideSpeed = random(-0.3, 0.3);
        this.verticalSpeed = random(-0.3, 0.3);
        this.trail = [];
        this.maxTrailLength = floor(random(8, 18));
    }

    update(bass, mid, treble) {
        let speedMultiplier = map(bass, 0, 255, 0.5, 2);
        let speed = currentSpeed * speedMultiplier * this.speedMultiplier;

        if (frameCount % 2 === 0) {
            this.trail.unshift({x: this.x, y: this.y, z: this.z});
            if (this.trail.length > this.maxTrailLength) {
                this.trail.pop();
            }
        }

        let turbulence = map(mid, 0, 255, 0, 1.2);
        this.x += this.sideSpeed * turbulence;
        this.y += this.verticalSpeed * turbulence;
        this.z -= speed;

        if (this.z < -1000) {
            this.reset();
        }

        let distFromCamera = abs(this.z - cameraZ);
        let normalizedDist = constrain(map(distFromCamera, 0, radius, 1, 0), 0, 1);

        let trebleSize = map(treble, 0, 255, 0, 1.2);
        this.size = this.baseSize * normalizedDist + trebleSize;

        let audioBrightness = map(mid + treble, 0, 510, 0, 80);
        this.brightness = map(normalizedDist, 0, 1, 255, 80) + audioBrightness;
        this.alpha = map(normalizedDist, 0, 1, 200, 0);
    }

    display() {
        colorMode(HSB, 360, 255, 255, 255);
        // Draw trails with glow
        for (let i = 0; i < this.trail.length; i++) {
            let pos = this.trail[i];
            let trailAlpha = map(i, 0, this.trail.length, this.alpha * 0.25, 0);
            stroke(this.hue, 80, this.brightness, trailAlpha);
            strokeWeight(map(i, 0, this.trail.length, this.size * 1.2, this.size * 0.2));
            point(pos.x, pos.y, pos.z);
        }

        // Draw main particle with glow
        stroke(this.hue, 60, this.brightness, this.alpha);
        strokeWeight(this.size * 2.2);
        point(this.x, this.y, this.z);
        stroke(this.hue, 0, 255, this.alpha * 0.7);
        strokeWeight(this.size * 0.7);
        point(this.x, this.y, this.z);
        colorMode(RGB, 255);
    }
}

// Moving average function for smoothing
function movingAverage(data, N) {
    if (data.length === 0) return [];

    const result = [];
    let sum = 0;
    N = Math.min(N, data.length);

    for (let i = 0; i < N; i++) {
        sum += data[i];
    }
    result.push(sum / N);

    for (let i = N; i < data.length; i++) {
        sum = sum - data[i - N] + data[i];
        result.push(sum / N);
    }

    return result;
}

// --- Geodesic sphere mesh generation ---
function getTargetPosition(p, shape, t, radius) {
    // Defensive: fallback to sphere if anything is missing
    if (!p || !p.base) return {x: 0, y: 0, z: 0};
    try {
        switch(shape) {
            case 'sphere':
                return {
                    x: p.base.x,
                    y: p.base.y,
                    z: p.base.z
                };
            case 'torus': {
                let angle = Math.atan2(p.base.z, p.base.x);
                let r = radius * 0.7;
                let tubeRadius = radius * 0.3;
                return {
                    x: (r + tubeRadius * Math.cos(angle * 3 + t)) * Math.cos(angle),
                    y: tubeRadius * Math.sin(angle * 3 + t),
                    z: (r + tubeRadius * Math.cos(angle * 3 + t)) * Math.sin(angle)
                };
            }
            case 'cube': {
                let size = radius * 0.8;
                return {
                    x: size * Math.sign(p.base.x),
                    y: size * Math.sign(p.base.y),
                    z: size * Math.sign(p.base.z)
                };
            }
            case 'spiral': {
                let spiralAngle = Math.atan2(p.base.z, p.base.x);
                let heightFactor = p.base.y / radius;
                return {
                    x: (radius * 0.8 * (1 - Math.abs(heightFactor))) * Math.cos(spiralAngle + heightFactor * 8 + t),
                    y: p.base.y,
                    z: (radius * 0.8 * (1 - Math.abs(heightFactor))) * Math.sin(spiralAngle + heightFactor * 8 + t)
                };
            }
            default:
                return {
                    x: p.base.x,
                    y: p.base.y,
                    z: p.base.z
                };
        }
    } catch (e) {
        // fallback to sphere
        return {
            x: p.base.x,
            y: p.base.y,
            z: p.base.z
        };
    }
}

function createGeodesicMesh(subdivisions, radius) {
    // Generate geodesic mesh vertices
    let points = [];
    let phi = (1 + sqrt(5)) / 2; // golden ratio
    
    // Create initial icosahedron vertices
    let verts = [
        [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
        [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
        [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
    ];
    verts = verts.map(v => {
        let mag = sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
        return [v[0]/mag, v[1]/mag, v[2]/mag];
    });
    let faces = [
        [0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],
        [1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
        [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],
        [4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]
    ];
    // Subdivide faces
    function midpoint(a, b) {
        return [(a[0]+b[0])/2, (a[1]+b[1])/2, (a[2]+b[2])/2];
    }
    let cache = {};
    function getMid(a, b) {
        let key = a < b ? a+','+b : b+','+a;
        if (cache[key]) return cache[key];
        let m = midpoint(verts[a], verts[b]);
        let mag = sqrt(m[0]*m[0]+m[1]*m[1]+m[2]*m[2]);
        m = [m[0]/mag, m[1]/mag, m[2]/mag];
        verts.push(m);
        cache[key] = verts.length-1;
        return verts.length-1;
    }
    for (let s=0; s<subdivisions; s++) {
        let faces2 = [];
        for (let f of faces) {
            let a = f[0], b = f[1], c = f[2];
            let ab = getMid(a,b), bc = getMid(b,c), ca = getMid(c,a);
            faces2.push([a,ab,ca],[b,bc,ab],[c,ca,bc],[ab,bc,ca]);
        }
        faces = faces2;
    }
    // Remove duplicate verts
    let unique = [];
    let mapIdx = {};
    for (let v of verts) {
        let key = v.map(x=>x.toFixed(5)).join(',');
        if (!(key in mapIdx)) {
            mapIdx[key] = unique.length;
            unique.push(v);
        }
    }
    // Build meshParticles
    let mesh = [];
    for (let v of unique) {
        // Calculate spherical coordinates
        let x = v[0], y = v[1], z = v[2];
        let r = Math.sqrt(x*x + y*y + z*z);
        let lat = Math.acos(y / r); // polar angle
        let lon = Math.atan2(z, x); // azimuthal angle
        mesh.push({
            base: {x: x*radius, y: y*radius, z: z*radius, lat, lon},
            x: x*radius, y: y*radius, z: z*radius,
            wave: random(TWO_PI),
            hue: random(180,320)
        });
    }
    return mesh;
}

// --- Utility: cubic easing for extra smoothness ---
function easeLerp(a, b, t) {
    t = constrain(t, 0, 1);
    t = t*t*(3-2*t); // smoothstep
    return a + (b-a)*t;
}

// --- Morph effect state ---
// (removed duplicate declarations)

function triggerMorph() {
    morphing = true;
    morphStartTime = millis() / 1000.0;
}

function getSpherePosition(p, t, radius, morphAmount) {
    // morphAmount: 0 = normal, 1 = fully morphed
    // We'll do a crazy smooth effect: pulse, twist, and ripple
    let base = p.base;
    let r = radius + 60 * Math.sin(t + base.x * 0.01 + base.y * 0.01 + base.z * 0.01) * morphAmount;
    let twist = morphAmount * Math.sin(t * 2 + base.y * 0.02) * 0.7;
    let ripple = morphAmount * Math.sin(t * 3 + base.x * 0.03 + base.z * 0.03) * 0.5;
    let x = r * Math.sin(base.lat + twist) * Math.cos(base.lon + ripple);
    let y = r * Math.cos(base.lat + twist);
    let z = r * Math.sin(base.lat + twist) * Math.sin(base.lon + ripple);
    return {x, y, z};
}