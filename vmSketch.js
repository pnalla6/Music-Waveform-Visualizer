let zoomFactor = 300;
let rgb = false;
let shape = 3;
let circle_w = 100;
let circle_h = 300;
let stroke_weight = 0;
let particles = [];
let num_of_particles = 500;

function preload() {
    musicFile = loadSound(`./music/babydoll.mp3`);
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    angleMode(DEGREES);
    fft = new p5.FFT();
    fft.smooth(0.9); // Smooth out the FFT for more fluid visualization
    frameRate(60);

    slider = createSlider(0, 255, 100);
    slider.position(225, 5);
    slider.style('width', '80px');
    
    // Initial particle setup
    for (let i = 0; i < num_of_particles; i++) {
        particles.push(new Particle());
    }
}

function draw() {
    background(0);
    switch (shape) {
        case 1:
            circularSpectrum();
            break;
        case 2:
            linearSpectrum();
            break;
        case 3:
            starfield();
            break;
    }
}

// Function to play/pause the music
function playMusic() {
    if (musicFile.isPlaying()) {
        musicFile.pause();
    } else {
        musicFile.play();
    }
}

// Enhanced circular spectrum
function circularSpectrum() {
    strokeWeight(2);
    translate(width / 2, height / 2);
    let waveform = fft.waveform();
    let smoothedWaveForm = movingAverage(waveform, 20);

    stroke(255);
    noFill();
    beginShape();
    for (let i = 0; i < 360; i++) {
        let radius = map(smoothedWaveForm[i], -1, 1, circle_w, circle_h);
        let x = radius * cos(i);
        let y = radius * sin(i);
        vertex(x, y);
    }
    endShape();
}

// Starfield effect with zooming particles
function starfield() {
    translate(width / 2, height / 2);
    
    let smoothedWaveForm = movingAverage(fft.waveform(), 50);
    let spectrum = fft.analyze();
    
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].show(smoothedWaveForm[i] * zoomFactor, spectrum[i]);
    }
}

// Particle class for zooming effect
class Particle {
    constructor() {
        this.x = random(-width / 2, width / 2);
        this.y = random(-height / 2, height / 2);
        this.z = random(-width / 2, width / 2);
        this.r = random(2, 10.8);
        this.baseColor = color(255, 255, 255); // Golden color
        this.sparkle = random(100, 255);     // Random value for sparkle effect
        this.baseSpeed = random(0.2, 0.5);   // Slower base speed for particles
        this.speed = this.baseSpeed;          // Particle speed affected by the beat

        // Initialize random offsets for wandering
        this.offsetX = random(-1, 1);
        this.offsetY = random(-1, 1);
    }

    update() {
        // Get bass energy from FFT to sync the particle speed with beats
        let bassEnergy = fft.getEnergy("bass");

        // Map bass energy to particle speed, and lerp for smooth transitions
        let targetSpeed = map(bassEnergy, 0, 255, 0.2, 1); // Modulate speed based on bass
        this.speed = lerp(this.speed, targetSpeed, 0.05);  // Smoothly interpolate to new speed
        
        // Update the z-axis movement (zoom effect) based on speed
        this.z -= this.speed * 0.5; // Slower zoom effect

        // Wandering effect
        this.x += random(this.offsetX);
        // this.x += this.offsetX * 0.7;
        this.y += random(this.offsetY) * 0.7;

        // Check for boundaries to reverse direction
        if (this.x > width / 2 || this.x < -width / 2) {
            this.offsetX *= -1;
        }
        if (this.y > height / 2 || this.y < -height / 2) {
            this.offsetY *= -1;
        }

        // Mouse interaction: Move towards the mouse
        let mouseDist = dist(this.x, this.y, mouseX - width / 2, mouseY - height / 2);
        if (mouseDist < 150) { // If the mouse is within 150 pixels
            let angle = atan2(mouseY - height / 2, mouseX - width / 2);
            this.x += cos(angle) * 0.5; // Move towards mouse in the x direction
            this.y += sin(angle) * 0.5; // Move towards mouse in the y direction
        }

        // Respawn particles if they move out of view
        if (this.z < -width / 2) {
            this.z = random(-width / 2, width / 2);
            this.x = random(-width / 2, width / 2);
            this.y = random(-height / 2, height / 2);
            this.sparkle = random(100, 255); // Reset sparkle on respawn
        }
    }

    show(zoom, colorVal) {
        // Apply sparkle effect to base color
        let glitter = color(this.baseColor.levels[0] + random(-this.sparkle, this.sparkle), 
                            this.baseColor.levels[1] + random(-this.sparkle, this.sparkle), 
                            this.baseColor.levels[2] + random(-this.sparkle, this.sparkle));

        strokeWeight(map(zoom, 0, 255, 2, 10));
        stroke(glitter);
        fill(glitter);
        ellipse(this.x, this.y, this.r * zoom / 200);
    }
}

// Moving average for smoothing waveform
function movingAverage(data, N) {
    let result = [];
    let sum = 0;
    for (let i = 0; i < N; i++) sum += data[i];
    result[0] = sum / N;
    for (let i = N; i < data.length; i++) {
        sum = sum - data[i - N] + data[i];
        result.push(sum / N);
    }
    return result;
}