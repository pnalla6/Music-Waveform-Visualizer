var musicFile;
var fft;
var zoomFactor = 300;
let checkbox;
var strokeValue = false;

function preload() {
    musicFile = loadSound('./music/industry_felix.mp3');
}

function setup() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        zoomFactor = 100;
    }
    window.addEventListener("orientationchange", () => {
        window.location.reload();
    }, true);
    createCanvas(windowWidth, windowHeight)
    fft = new p5.FFT();
    // test slider
    slider = createSlider(0, 255, 100);
    slider.position(225, 5);
    slider.style('width', '80px', 'color', 'red');
    showZoomFactor();
    //select music
    sel = createSelect();
    sel.position(10, 10);
    sel.option('Industry Baby-Felix');
    sel.option('Earth-Tilden Parc');
    // sel.selected('Earth-Tilden parc');
    sel.changed(changeMusicFile);

    //change stroke value
    checkbox = createCheckbox('go rainbow!', false);
    checkbox.position(310, 6);
    checkbox.style('color', 'white');
    checkbox.changed(changeStroke);
}
function draw() {
    let sliderValue = slider.value();
    zoomFactor = map(sliderValue, 0, 255, 50, 500);
    background(0);
    if (strokeValue) stroke(`rgb(${parseInt(random(255))},${parseInt(random(255))},${parseInt(random(255))})`); else stroke(255);
    strokeWeight(1.3);
    var waveForm = fft.waveform();
    beginShape();
    for (var i = 0; i < width; i++) {
        var x = i;
        var y = waveForm[floor(map(i, 0, windowWidth, 0, waveForm.length))] * zoomFactor + windowHeight / 2.0;
        point(x, y);
    }
    endShape();

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

function changeStroke() {
    strokeValue = !strokeValue;
}

function showZoomFactor() {
    let p = createP('zfactor');
    p.style('color', 'white');
    p.style('font-size', '0.7rem');
    p.position(190, 0);
}