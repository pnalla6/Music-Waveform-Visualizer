// Number of particles
const NUM_PARTICLES = 500;
let particles = [];

// UI elements
let shapeButton, switchSongButton, playButton;
let fft;
let musicFiles = []; // Array to hold multiple songs
let currentSongIndex = 0;
let crossfadeDuration = 3; // Duration of crossfade in seconds
let isCrossfading = false;

// Array of shape functions
let shapeFunctions;
let currentShapeIndex = 0;

function preload() {
    const songPaths = [
        './music/king_shit.mp3',
        './music/babydoll.mp3',
        './music/warriyo_mortals.mp3',
        './music/am_i_dreaming.mp3',
    ];

    // Load songs into musicFiles array
    for (let path of songPaths) {
        let sound = loadSound(path);
        musicFiles.push(sound);
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    angleMode(RADIANS);
    fft = new p5.FFT();
    fft.smooth(0.9);
    frameRate(60);

    // Initialize particles
    for (let i = 0; i < NUM_PARTICLES; i++) {
        particles.push(new Particle());
    }

    // Create UI controls
    createUI();

    // Initialize shape functions
    shapeFunctions = [linearSpectrum, drawHeart, drawFlower, drawButterfly, starfield];

    // Start playing the first song
    if (musicFiles.length > 0) {
        musicFiles[currentSongIndex].play();
        playButton.html('Pause');
    }
}

function draw() {
    background(0);
    translate(width / 2, height / 2);

    // Analyze music spectrum
    fft.analyze();

    // Call the current shape function
    const currentFunction = shapeFunctions[currentShapeIndex % shapeFunctions.length];
    if (currentFunction) {
        currentFunction();
    }

    // Handle crossfading
    if (isCrossfading) {
        handleCrossfade();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
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
    // Shape Switch Button
    shapeButton = createButton('Switch Shape');
    shapeButton.position(10, 55);
    shapeButton.mousePressed(switchShape);
    styleButton(shapeButton);

    const shapeNames = ['Linear Spectrum', 'Heart', 'Flower', 'Butterfly', 'Starfield'];
    createDiv('Current Shape: ' + shapeNames[currentShapeIndex % shapeNames.length])
        .position(10, 80)
        .id('shapeName')
        .style('color', 'white')
        .style('background', 'rgba(0,0,0,0.5)')
        .style('padding', '5px');

    // Switch Song Button
    switchSongButton = createButton('Switch Song');
    switchSongButton.position(10, 105);
    switchSongButton.mousePressed(switchSong);
    styleButton(switchSongButton);

    // Play/Pause Button
    playButton = createButton('Pause');
    playButton.position(10, 130);
    playButton.mousePressed(playMusic);
    styleButton(playButton);
}

function styleButton(btn) {
    btn.style('background', 'rgba(0,0,0,0.5)');
    btn.style('color', 'white');
    btn.style('border', '1px solid rgba(255,255,255,0.7)');
    btn.style('padding', '5px');
}

function switchShape() {
    currentShapeIndex++;
    const shapeNames = ['Linear Spectrum', 'Heart', 'Flower', 'Butterfly', 'Starfield'];
    select('#shapeName').html('Current Shape: ' + shapeNames[currentShapeIndex % shapeNames.length]);
}

// Helper function to get smoothed waveform
function getSmoothedWaveform(smoothing) {
    const waveform = fft.waveform();
    return movingAverage(waveform, smoothing);
}

// Draw a heart shape synchronized with music
function drawHeart() {
    const bassEnergy = fft.getEnergy('bass');
    const dynamicStroke = map(bassEnergy, 0, 255, 1, 3); // Dynamically adjust stroke weight based on music energy

    strokeWeight(dynamicStroke);
    stroke(255, 105, 180);
    noFill();

    const smoothedWaveform = getSmoothedWaveform(10);
    const totalPoints = 360;

    beginShape();
    for (let i = 0; i <= totalPoints; i++) {
        const t = map(i, 0, totalPoints, -PI, PI);
        const index = floor(map(i, 0, totalPoints, 0, smoothedWaveform.length - 1));
        const scaleFactor = map(smoothedWaveform[index], -1, 1, 0.8, 1.2);

        const x = 16 * pow(sin(t), 3) * scaleFactor * 15;
        const y = -(13 * cos(t) - 5 * cos(2 * t) - 2 * cos(3 * t) - cos(4 * t)) * scaleFactor * 15;

        curveVertex(x, y);
    }
    endShape(CLOSE);
}

// Draw a flower shape synchronized with music
function drawFlower() {
    strokeWeight(2);
    stroke(255, 182, 193);
    noFill();

    const smoothedWaveform = getSmoothedWaveform(10);
    const petals = 6;
    const totalPoints = 360;

    beginShape();
    for (let i = 0; i <= totalPoints; i++) {
        const angle = map(i, 0, totalPoints, 0, TWO_PI);
        const index = floor(map(i, 0, totalPoints, 0, smoothedWaveform.length - 1));
        const scaleFactor = map(smoothedWaveform[index], -1, 1, 0.8, 1.2);

        const r = 150 * scaleFactor * sin(petals * angle);
        const x = r * cos(angle);
        const y = r * sin(angle);

        curveVertex(x, y);
    }
    endShape(CLOSE);
}

// Draw a butterfly shape synchronized with music
function drawButterfly() {
    strokeWeight(2);
    stroke(219, 112, 147);
    noFill();

    const smoothedWaveform = getSmoothedWaveform(10);
    const totalPoints = 360;

    beginShape();
    for (let i = 0; i <= totalPoints; i++) {
        const t = map(i, 0, totalPoints, -PI, PI);
        const index = floor(map(i, 0, totalPoints, 0, smoothedWaveform.length - 1));
        const scaleFactor = map(smoothedWaveform[index], -1, 1, 0.8, 1.2);

        const expCosT = exp(cos(t));
        const sinT = sin(t);
        const cosT = cos(t);
        const sinT12 = sin(t / 12);
        const commonTerm = expCosT - 2 * cos(4 * t) - pow(sinT12, 5);

        const x = sinT * commonTerm * 50 * scaleFactor;
        const y = -cosT * commonTerm * 50 * scaleFactor;

        curveVertex(x, y);
    }
    endShape(CLOSE);
}

// Linear Spectrum Visualization
function linearSpectrum() {
    strokeWeight(1.5);
    stroke(200, 200, 255);
    noFill();

    const smoothedWaveform = getSmoothedWaveform(300);

    beginShape();
    for (let i = 0; i < smoothedWaveform.length; i += 4) {
        const x = map(i, 0, smoothedWaveform.length - 1, -width / 2, width / 2);
        const y = map(smoothedWaveform[i], -1, 1, height / 6, -height / 6);

        curveVertex(x, y);
    }
    endShape();
}

// Starfield effect with particles
function starfield() {
    for (const particle of particles) {
        particle.update();
        particle.show();
    }
}

// Particle class for starfield effect
class Particle {
    constructor() {
        this.x = random(-width / 2, width / 2);
        this.y = random(-height / 2, height / 2);
        this.z = random(width / 2);
        this.baseColor = color(255, 255, 255);
        this.sparkle = random(100, 255);
        this.speed = random(0.2, 0.5);
        this.bassEnergyAvg = 0;
        this.energyDecayRate = 0.05;
    }

    update() {
        const bassEnergy = fft.getEnergy('bass');
        this.bassEnergyAvg = lerp(this.bassEnergyAvg, bassEnergy, this.energyDecayRate);
        const energyThreshold = this.bassEnergyAvg;

        const reverse = bassEnergy < energyThreshold;
        const targetSpeed = reverse
            ? map(bassEnergy, 0, energyThreshold, -0.2, 0)
            : map(bassEnergy, energyThreshold, 255, 0.05, 1.5);
        this.speed = lerp(this.speed, targetSpeed, reverse ? 0.6 : 0.3);

        this.z -= this.speed * 20;

        if (this.z < 1 || this.z > width) {
            this.resetPosition();
        }
    }

    resetPosition() {
        this.z = random(width / 2, width);
        this.x = random(-width / 2, width / 2);
        this.y = random(-height / 2, height / 2);
        this.sparkle = random(100, 255);
    }

    show() {
        const sx = map(this.x / this.z, 0, 1, 0, width);
        const sy = map(this.y / this.z, 0, 1, 0, height);
        const r = map(this.z, 0, width / 2, 8, 0);

        const shouldSparkle = random() < 0.1;
        const glitterColor = shouldSparkle
            ? color(
                this.baseColor.levels[0] + random(-this.sparkle, this.sparkle),
                this.baseColor.levels[1] + random(-this.sparkle, this.sparkle),
                this.baseColor.levels[2] + random(-this.sparkle, this.sparkle)
            )
            : this.baseColor;

        noStroke();
        fill(glitterColor);
        ellipse(sx, sy, r);
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