let musicFile;
// let songName = ['JindMahi_Nucleya', 'industry_felix', 'earth'];
let songName = ['am_i_dreaming', 'barbie_aqua', 'earth'];
let fft;
let checkbox;
let fileInput;
let zoomFactor = 300;
let rgb = false;
let shape = 3;
// let circle_w = 150;
// let circle_h = 350;
let circle_w = 100;
let circle_h = 300;
let stroke_weight = 0;
let particles = [];
let num_of_particles = 500;


function preload() {
    musicFile = loadSound(`./music/${songName[0]}.mp3`);
}

function setup() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        zoomFactor = 100;
        circle_w = 50;
        circle_h = 200;
        stroke_weight = 4.25;
        num_of_particles = 200;

        // adjust play icon
        select("#playIcon").position(183, 33);
    }
    window.addEventListener("orientationchange", () => {
        window.location.reload();
    }, true);
    angleMode(DEGREES);
    createCanvas(windowWidth, windowHeight)
    fft = new p5.FFT();
    fft.smooth(0);
    frameRate(60);



    slider = createSlider(0, 255, 100);
    slider.position(225, 5);
    slider.style('width', '80px', 'color', 'red');
    showZoomFactor();

    // music select
    sel = createSelect();
    sel.position(10, 10);
    sel.option('Am I Dreaming', 0);
    sel.option('Barbie Aqua', 1);
    sel.option('Earth-Tilden Parc', 2);
    sel.changed(changeMusicFile);

    // shape select
    sel1 = createSelect();
    sel1.position(138, 10);
    sel1.option('Circle Starfield', 3);
    sel1.option('Linear', 2);
    sel1.option('Circle', 1);
    sel1.changed(changeShape);

    // rgb mode
    checkbox = createCheckbox('RGB', false);
    checkbox.position(310, 6);
    checkbox.style('color', 'white');
    checkbox.changed(changeStroke);

    // user music file
    fileInput = createFileInput(handleFile);
    fileInput.position(10, 30);
    fileInput.style('width', '33vw');
    
    document.addEventListener("keydown", function(event) {
        if (event.keyCode === 32) { // keyCode 32 is the spacebar
            playMusic();
        }
    });

    // setup initial particles
    for (let i = 0; i < num_of_particles; i++) {
        particles.push(new Particle())
    }
}


// draw
function draw() {
    switch (shape) {
        case 1:
            circularSpectrum();
            break;
        case 2:
            linearSpectrum();
            break;
        case 3:
            Starfield();
            break;

        default:
            Starfield();
            break;
    }
}

// play/pause
function playMusic() {
    if (mouseButton !== RIGHT) {
        if (musicFile.isPlaying()) musicFile.pause(); else musicFile.play()
    }
}

// select user music
function changeMusicFile() {
    musicFile.stop();
    if (sel.value()) {
        musicFile = loadSound(`./music/${songName[sel.value()]}.mp3`);
    }
    if (musicFile) musicFile.play();
}

// change shape
function changeShape() {
    shape = parseInt(sel1.value());
}

// rgb mode
function changeStroke() {
    rgb = !rgb;
}

// load user music file
function handleFile(file) {
    if (file.type === 'audio') musicFile = loadSound(file); else musicFile = null;
}

function showZoomFactor() {
    let p = createP('');
    p.style('color', 'white');
    p.style('font-size', '0.7rem');
    p.position(190, 0);
}

// 1. linear Spectrum
function linearSpectrum() {
    let sliderValue = slider.value();
    zoomFactor = map(sliderValue, 0, 255, 50, 500);
    background(0);

    let waveform = fft.waveform();
    let smoothedWaveForm = movingAverage(waveform, 10); // Smooth the waveform

    strokeWeight(1.5);

    beginShape();
    for (var i = 0; i < width; i++) {
        // Map the waveform value to a valid RGB color range (0-255)
        let colorVal = map(smoothedWaveForm[i], -1, 1, 0, 255);
        if (rgb) {
            // Use the waveform value for the red channel, and random values for green and blue
            stroke(colorVal, Math.random() * 255, Math.random() * 255);
        } else {
            stroke(255);
        }
        let x = i;
        let y = smoothedWaveForm[floor(map(i, 0, windowWidth, 0, waveform.length))] * zoomFactor + windowHeight / 2.0;
        point(x, y);
    }
    endShape();
}



// 2. circular Spectrum
function circularSpectrum() {
    stroke_weight = 10;
    translate(width / 2, height / 2);
    let sliderValue = slider.value();
    zoomFactor = map(sliderValue, 0, 255, 50, 500);
    background(0);
    // if (rgb) stroke(`rgb(${parseInt(random(255))},${parseInt(random(255))},${parseInt(random(255))})`); else stroke(255);
    strokeWeight(stroke_weight);
    let waveForm = fft.waveform();
    let smoothedWaveForm = movingAverage(waveForm, 20); // Smooth the waveform

    beginShape();
    for (var i = 0; i < 360; i++) {
        // Map the waveform value to a valid RGB color range (0-255)
        let colorVal = map(smoothedWaveForm[i], -1, 1, 0, 255);
        if (rgb) {
            // Use the waveform value for the red channel, and random values for green and blue
            stroke(colorVal, Math.random() * 255, Math.random() * 255);
        } else {
            stroke(255);
        }
        let x = i;
        let y = smoothedWaveForm[floor(map(i, 0, 360, 0, waveForm.length - 1))] * zoomFactor + windowHeight / 2.0;
        let radius = map(waveForm[floor(map(i, 0, 360, 0, waveForm.length - 1))], -1, 1, circle_w, circle_h);
        let averageRadius = (circle_w + circle_h) / 2; // average of circle_w and circle_h
        curveVertex(radius * cos(i), radius * sin(i));
    }
    endShape();
    // beginShape();
    // for (var i = 0; i < 180; i++) {
    //     let x = i;
    //     let y = waveForm[floor(map(i, 0, 180, 0, waveForm.length - 1))] * zoomFactor + windowHeight / 2.0;
    //     let radius = map(waveForm[floor(map(i, 0, 180, 0, waveForm.length - 1))], -1, 1, circle_w, circle_h);
    //     point(radius * sin(i), radius * cos(i));
    // }
    // endShape();
}


// 3. Starfield
function Starfield() {
    stroke_weight = 2;
    background(0);
    smooth();

    let spectrum = fft.analyze();
    let waveform = fft.waveform();
    let smoothedWaveForm = movingAverage(waveform, 50); // Smooth the waveform

    let sliderValue = slider.value();
    zoomFactor = map(sliderValue, 0, 255, 6, 66);

    // Get the average volume across all frequencies
    let avgFreqAmplitude = fft.getEnergy("bass", "treble") / 2;

    // Start rotation
    push();
    translate(width / 2, height / 2);
    rotate(frameCount * 0.01);

    for (let i = 0; i < particles.length; i++) {
        // Change particle radius based on smoothedWaveForm
        particles[i].r = smoothedWaveForm[i] * zoomFactor;

        // Change particle color based on its x and y positions
        let colorValX = map(particles[i].x, 0, width, 0, 255);
        let colorValY = map(particles[i].y, 0, height, 0, 255);
        if (rgb) {
            stroke(colorValX, colorValY, 255 - colorValX);
        }
        else {
            stroke(255);
        }

        // Change stroke weight based on average frequency amplitude
        strokeWeight(map(avgFreqAmplitude, 0, 255, 2, 10));

        // Particle creation and movement now happen around the center
        // particles[i].createParticle(width, height );
        // particles[i].moveParticle();
    }

    // End rotation
    pop();

    // Draw the remaining shapes normally
    beginShape();
    for (let i = 0; i < particles.length; i++) {
        particles[i].createParticle();
    }
    endShape();
}


// resize canvas
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

// moving average
function movingAverage(data, N) {
    var sum = 0;
    var result = [];

    for (var i = 0; i < N; i++)
        sum += data[i];

    result[0] = sum / N;

    for (var i = N; i < data.length; i++) {
        sum = sum - data[i - N] + data[i];
        result.push(sum / N);
    }

    return result;
}




// Particle Class
class Particle {
    constructor() {
        this.x = random(0, width);
        this.y = random(0, height);
        this.r = 6;
        this.xSpeed = random(-0.2, 0.2);
        this.ySpeed = random(-0.2, 0.2);
        // this.xSpeed = random(-1, 1);
        // this.ySpeed = random(-1, 1);
        this.currentColor = color(random(255), random(255), random(255));
        this.targetColor = color(random(255), random(255), random(255));
        this.colorChangeSpeed = 0.01; // speed of color change (adjust as needed)
    }

    // lerpColor
    lerpColor() {
        this.currentColor = lerpColor(this.currentColor, this.targetColor, this.colorChangeSpeed);
        let currentColorBrightness = brightness(this.currentColor);
        let targetColorBrightness = brightness(this.targetColor);
        if (abs(currentColorBrightness - targetColorBrightness) < 0.1) {
            this.targetColor = color(random(255), random(255), random(255));
        }
    }

    createParticle() {
        // noStroke();
        fill(0);
        // stroke(255);
        stroke(Math.random() * 255, Math.random() * 255, Math.random() * 255);
        // fill(Math.random() * 255, Math.random() * 255, Math.random() * 255)
        circle(this.x, this.y, this.r);
    }

    moveParticle() {
        if (this.x < 0 || this.x > width)
            this.xSpeed *= -1;
        if (this.y < 0 || this.y > height)
            this.ySpeed *= -1;
        this.x += this.xSpeed;
        this.y += this.ySpeed;
    }
}