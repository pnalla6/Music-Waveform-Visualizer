let musicFile;
let songName = ['JindMahi_Nucleya','industry_felix','earth'];
let fft;
let checkbox;
let fileInput;
let zoomFactor = 300;
let rgb = false;
let shape = 3;
let circle_w = 150;
let circle_h = 350;
let stroke_weight = 0;
let particles = [];


function preload() {
    musicFile = loadSound(`./music/${songName[0]}.mp3`);
}

function setup() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        zoomFactor = 100;
        circle_w = 50;
        circle_h = 200;
        stroke_weight = 4.25;
    }
    window.addEventListener("orientationchange", () => {
        window.location.reload();
    }, true);
    angleMode(DEGREES);
    createCanvas(windowWidth, windowHeight)
    fft = new p5.FFT();

    slider = createSlider(0, 255, 100);
    slider.position(225, 5);
    slider.style('width', '80px', 'color', 'red');
    showZoomFactor();

    // music select
    sel = createSelect();
    sel.position(10, 10);
    sel.option('Jind Mahi-Nucleya',0);
    sel.option('Industry Baby-Felix',1);
    sel.option('Earth-Tilden Parc',2);
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

    // setup initial particles
    for (let i = 0; i < 500; i++) {
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
            circleStarfield();
            break;

        default:
            circleStarfield();
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
    if(sel.value()){
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
    if (rgb) stroke(`rgb(${parseInt(random(255))},${parseInt(random(255))},${parseInt(random(255))})`); else stroke(255);
    strokeWeight(1.5);
    let waveForm = fft.waveform();
    beginShape();
    for (var i = 0; i < width; i++) {
        let x = i;
        let y = waveForm[floor(map(i, 0, windowWidth, 0, waveForm.length))] * zoomFactor + windowHeight / 2.0;
        point(x, y);
    }
    endShape();

}

// 2. circular Spectrum
function circularSpectrum() {
    stroke_weight=10;
    translate(width / 2, height / 2);
    let sliderValue = slider.value();
    zoomFactor = map(sliderValue, 0, 255, 50, 500);
    background(0);
    if (rgb) stroke(`rgb(${parseInt(random(255))},${parseInt(random(255))},${parseInt(random(255))})`); else stroke(255);
    strokeWeight(stroke_weight);
    let waveForm = fft.waveform();
    beginShape();
    for (var i = 0; i < 180; i++) {
        let x = i;
        let y = waveForm[floor(map(i, 0, 180, 0, waveForm.length - 1))] * zoomFactor + windowHeight / 2.0;
        let radius = map(waveForm[floor(map(i, 0, 180, 0, waveForm.length - 1))], -1, 1, circle_w, circle_h);
        point(radius * -sin(i), radius * -cos(i));
    }
    endShape();
    beginShape();
    for (var i = 0; i < 180; i++) {
        let x = i;
        let y = waveForm[floor(map(i, 0, 180, 0, waveForm.length - 1))] * zoomFactor + windowHeight / 2.0;
        let radius = map(waveForm[floor(map(i, 0, 180, 0, waveForm.length - 1))], -1, 1, circle_w, circle_h);
        point(radius * sin(i), radius * cos(i));
    }
    endShape();
}


// 3. circle starfield
function circleStarfield() {
    stroke_weight = 2;
    strokeWeight(stroke_weight)
    background(0);
    smooth();
    // orbitControl();
    // translate(-width / 2, -height / 2, 0);
    let spectrum = fft.analyze();
    let waveform = fft.waveform();
    let sliderValue = slider.value();
    zoomFactor = map(sliderValue, 0, 255, 6, 66);
    beginShape();
    for (let i = 0; i < particles.length; i++) {
        particles[i].createParticle();
        particles[i].moveParticle();
        particles[i].r = waveform[i] * zoomFactor;
        // particles[i].xSpeed = waveform[i]*zoomFactor;
        // particles[i].ySpeed = waveform[i]*zoomFactor;
    }
    endShape();

}

// resize canvas
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
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