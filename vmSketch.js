let zoomFactor = 300;
let rgb = false;
let shape = 3;
let circle_w = 100;
let circle_h = 300;
let stroke_weight = 0;
let particles = [];
let num_of_particles = 500;

function preload() {
    musicFile = loadSound(`./music/warriyo_mortals.mp3`);
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
        // if(){

            particles[i].show(smoothedWaveForm[i] * zoomFactor, spectrum[i*0.1]);
        // }
    }
}

// Particle class for zooming effect
// class Particle {
//     constructor() {
//         this.x = random(-width / 2, width / 2);
//         this.y = random(-height / 2, height / 2);
//         this.z = random(-width / 2, width / 2);
//         this.r = 1;
//         this.baseColor = color(255, 255, 255); // Golden color
//         this.sparkle = random(100, 255);     // Random value for sparkle effect
//         this.baseSpeed = random(0.2, 0.5);   // Slower base speed for particles
//         this.speed = this.baseSpeed;          // Particle speed affected by the beat

//         // Initialize random offsets for wandering
//         this.offsetX = random(-1, 1);
//         this.offsetY = random(-1, 1);
//     }

//     update() {
//         // Get bass energy from FFT to sync the particle speed with beats
//         let bassEnergy = fft.getEnergy("bass");

//         // Map bass energy to particle speed, and lerp for smooth transitions
//         let targetSpeed = map(bassEnergy, 0, 255, 0.2, 1); // Modulate speed based on bass
//         this.speed = lerp(this.speed, targetSpeed, 0.05);  // Smoothly interpolate to new speed
        
//         // Update the z-axis movement (zoom effect) based on speed
//         this.z -= this.speed * 0.5; // Slower zoom effect

//         // Wandering effect
//         this.x += random(this.offsetX);
//         this.y += random(this.offsetY) * 0.7;

//         // Check for boundaries to reverse direction
//         if (this.x > width / 2 || this.x < -width / 2) {
//             this.offsetX *= -1;
//         }
//         if (this.y > height / 2 || this.y < -height / 2) {
//             this.offsetY *= -1;
//         }

//         // Mouse interaction: Move towards the mouse
//         let mouseDist = dist(this.x, this.y, mouseX - width / 2, mouseY - height / 2);
//         if (mouseDist < 150) { // If the mouse is within 150 pixels
//             let angle = atan2(mouseY - height / 2, mouseX - width / 2);
//             this.x += cos(angle) * 0.9; // Move towards mouse in the x direction
//             this.y += sin(angle) * 0.9; // Move towards mouse in the y direction
//         }

//         // Respawn particles if they move out of view
//         if (this.z < -width / 2) {
//             this.z = random(-width / 2, width / 2);
//             this.x = random(-width / 2, width / 2);
//             this.y = random(-height / 2, height / 2);
//             this.sparkle = random(100, 255); // Reset sparkle on respawn
//         }
//     }

//     show(zoom, colorVal) {
//         // Introduce a condition to only make some particles sparkle
//         let shouldSparkle = random() < 0.1; // Adjust this value to change the sparkle density (0.1 means 10% sparkle)

//         let glitter;
//         if (shouldSparkle) {
//             // Apply sparkle effect to base color if should sparkle
//             glitter = color(this.baseColor.levels[0] + random(-this.sparkle, this.sparkle), 
//                             this.baseColor.levels[1] + random(-this.sparkle, this.sparkle), 
//                             this.baseColor.levels[2] + random(-this.sparkle, this.sparkle));
//         } else {
//             glitter = this.baseColor; // Regular color if not sparkling
//         }

//         strokeWeight(map(zoom, 0, 255, 2, 6));
//         stroke(glitter);
//         fill(glitter);
//         ellipse(this.x, this.y, this.r * zoom / 200);
//     }
// }

class Particle {
    constructor() {
        this.x = random(-width / 2, width / 2);
        this.y = random(-height / 2, height / 2);
        this.z = random(width / 2); // Depth starts positive to allow for zoom in
        this.r = 1;
        this.baseColor = color(255, 255, 255); // White color
        this.sparkle = random(100, 255);     // Random value for sparkle effect
        this.baseSpeed = random(0.2, 0.5);   // Initial slower speed for particles
        this.speed = this.baseSpeed;         // Current speed based on energy
        this.reverse = false;                // Indicates whether the particle is reversing
    }

    update() {
        // Get energy levels from FFT for bass frequencies
        let bassEnergy = fft.getEnergy("bass");

        // If bass energy is below a threshold, reverse movement (particles move backward)
        if (bassEnergy < 80) {
            this.reverse = true;
        } else {
            this.reverse = false;
        }

        // When bass is low, particles slow down or reverse
        if (this.reverse) {
            // Reverse movement when bass is low, making particles move backward
            let reverseSpeed = map(bassEnergy, 0, 80, -0.1, 0); // Slower, reverse movement
            this.speed = lerp(this.speed, reverseSpeed, 0.05); // Smooth transition to reverse speed
        } else {
            // When bass is high, speed up
            let targetSpeed = map(bassEnergy, 80, 255, 0.1, 2); // Faster when bass is high
            this.speed = lerp(this.speed, targetSpeed, 0.5); // Smooth transition to faster speed
        }

        // Update z-axis movement (zoom effect)
        this.z -= this.speed * 10; // Increase factor to make zoom more pronounced

        // Reset particle when it moves too close or too far
        if (this.z < 1 || this.z > width) {
            this.z = random(width / 2, width); // Respawn at a random depth
            this.x = random(-width / 2, width / 2); // Reset x position
            this.y = random(-height / 2, height / 2); // Reset y position
            this.sparkle = random(100, 255); // Reset sparkle on respawn
        }
    }

    show() {
        // Scale the position and size of the particle based on its depth (z)
        let sx = map(this.x / this.z, 0, 1, 0, width);
        let sy = map(this.y / this.z, 0, 1, 0, height);
        let r = map(this.z, 0, width / 2, 8, 0); // Size based on depth, particles closer to the screen are larger

        // Sparkle condition (only some particles)
        let shouldSparkle = random() < 0.1; // 10% chance to sparkle

        let glitter;
        if (shouldSparkle) {
            // Apply sparkle effect to base color if sparkling
            glitter = color(this.baseColor.levels[0] + random(-this.sparkle, this.sparkle), 
                            this.baseColor.levels[1] + random(-this.sparkle, this.sparkle), 
                            this.baseColor.levels[2] + random(-this.sparkle, this.sparkle));
        } else {
            glitter = this.baseColor; // Regular color if not sparkling
        }

        // Draw the particle
        noStroke();
        fill(glitter);
        ellipse(sx, sy, r); // Draw ellipse at scaled position with size based on depth
    }
}

// class Particle {
//     constructor() {
//         this.x = random(-width / 2, width / 2);
//         this.y = random(-height / 2, height / 2);
//         this.z = random(width / 2); // Depth starts positive to allow for zoom in
//         this.r = 1;
//         this.baseColor = color(255, 255, 255); // White color
//         this.sparkle = random(100, 255);     // Random value for sparkle effect
//         this.baseSpeed = random(0.2, 0.5);   // Slower base speed for particles
//         this.speed = this.baseSpeed;          // Particle speed affected by the beat
//         this.reverse = false;                // Track reverse state
//     }

//     update() {
//         // Get energy levels from FFT for bass, mid, and treble frequencies
//         let midEnergy = fft.getEnergy("mid");
//         let trebleEnergy = fft.getEnergy("treble");
//         let bassEnergy = fft.getEnergy("bass");

//         // Calculate overall energy to detect strong beats
//         let totalEnergy = bassEnergy + trebleEnergy + midEnergy;

//         // Set reverse movement based on bass energy: reverse when low, forward when high
        
//         if (bassEnergy < 10) { // Threshold for reversing on low bass
//             this.reverse = true;
//         } else if (bassEnergy > 150) { // Threshold for speeding up on high bass
//             this.reverse = false;
//         }
//         // console.log(bassEnergy, trebleEnergy, midEnergy);

//         // Map bass energy to particle speed, slowing down when reverse is active
//         let targetSpeed = this.reverse ? -0.2 : map(totalEnergy, 0, 255, 0.1, 1);
//         this.speed = lerp(this.speed, targetSpeed, 0.05); // Smooth transition between speeds
        
//         // Update the z-axis movement (zoom effect), reverse or forward based on the state
//         this.z += this.speed * 10; // If reverse is true, z increases (goes backward)

//         // Reset particle when it moves too close or too far
//         if (this.z < 1 || this.z > width) { 
//             this.z = random(width / 2, width); // Respawn at a random depth
//             this.x = random(-width / 2, width / 2); // Reset x position
//             this.y = random(-height / 2, height / 2); // Reset y position
//             this.sparkle = random(100, 255); // Reset sparkle on respawn
//         }
//     }

//     show() {
//         // Scale the position and size of the particle based on its depth (z)
//         let sx = map(this.x / this.z, 0, 1, 0, width);
//         let sy = map(this.y / this.z, 0, 1, 0, height);
//         let r = map(this.z, 0, width / 2, 8, 0); // Size based on depth, particles closer to the screen are larger

//         // Sparkle condition (only some particles)
//         let shouldSparkle = random() < 0.1; // 10% chance to sparkle

//         let glitter;
//         if (shouldSparkle) {
//             // Apply sparkle effect to base color if sparkling
//             glitter = color(this.baseColor.levels[0] + random(-this.sparkle, this.sparkle), 
//                             this.baseColor.levels[1] + random(-this.sparkle, this.sparkle), 
//                             this.baseColor.levels[2] + random(-this.sparkle, this.sparkle));
//         } else {
//             glitter = this.baseColor; // Regular color if not sparkling
//         }

//         // Draw the particle
//         noStroke();
//         fill(glitter);
//         ellipse(sx, sy, r); // Draw ellipse at scaled position with size based on depth
//     }
// }

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