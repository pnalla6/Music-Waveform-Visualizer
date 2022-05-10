let musicFile;
let fft;
let checkbox;
let fileInput;
let zoomFactor = 300;
let strokeValue = false;
let shape = true;
let circle_w = 150;
let circle_h = 350;
let stroke_weight = 10;

function preload() {
    musicFile = loadSound('./music/industry_felix.mp3');
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

    sel = createSelect();
    sel.position(10, 10);
    sel.option('Industry Baby-Felix');
    sel.option('Earth-Tilden Parc');
    sel.changed(changeMusicFile);

    sel1 = createSelect();
    sel1.position(138, 10);
    sel1.option('Linear');
    sel1.option('Circle');
    sel1.changed(changeShape);

    checkbox = createCheckbox('RGB', false);
    checkbox.position(310, 6);
    checkbox.style('color', 'white');
    checkbox.changed(changeStroke);

    fileInput = createFileInput(handleFile);
    fileInput.position(10, 30);
}
function draw() {
    if (shape) linearSpectrum(); else circularSpectrum();
}

function playMusic() {
    if (mouseButton !== RIGHT) {
        if (musicFile.isPlaying()) musicFile.pause(); else musicFile.play()
    }
}

function changeMusicFile() {
    musicFile.stop();
    musicFile = loadSound('./music/earth.mp3');
    if (musicFile) musicFile.play();
}

function changeShape() {
    shape = !shape;
}

function changeStroke() {
    strokeValue = !strokeValue;
}

function handleFile(file) {
    if (file.type === 'audio') musicFile = loadSound(file); else musicFile = null;
}

function showZoomFactor() {
    let p = createP('');
    p.style('color', 'white');
    p.style('font-size', '0.7rem');
    p.position(190, 0);
}

// linear Spectrum
function linearSpectrum() {
    let sliderValue = slider.value();
    zoomFactor = map(sliderValue, 0, 255, 50, 500);
    background(0);
    if (strokeValue) stroke(`rgb(${parseInt(random(255))},${parseInt(random(255))},${parseInt(random(255))})`); else stroke(255);
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

// circular Spectrum
function circularSpectrum() {
    translate(width / 2, height / 2);
    let sliderValue = slider.value();
    zoomFactor = map(sliderValue, 0, 255, 50, 500);
    background(0);
    if (strokeValue) stroke(`rgb(${parseInt(random(255))},${parseInt(random(255))},${parseInt(random(255))})`); else stroke(255);
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