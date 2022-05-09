var musicFile;
var fft;
var zoomFactor = 300;
function preload() {
    musicFile = loadSound('./music/industry_felix.mp3');
}

function setup() {

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        zoomFactor = 100;
    }
    let p = createP(zoomFactor);
    p.style('color', 'white');
    p.position(200, -10);
    window.addEventListener("orientationchange", () => {
        window.location.reload();
    }, true);
    createCanvas(windowWidth, windowHeight)
    fft = new p5.FFT();
    // test slider
    slider = createSlider(0, 255, 100);
    slider.position(225, 5);
    slider.style('width', '80px', 'color', 'red');

    //select music
    sel = createSelect();
    sel.position(10, 10);
    sel.option('Industry Baby-Felix');
    sel.option('Earth-Tilden Parc');
    // sel.selected('Earth-Tilden parc');
    sel.changed(changeMusicFile);
}
function draw() {
    let sliderValue = slider.value();
    zoomFactor = map(sliderValue, 0, 255, 50, 500);
    background(0);
    stroke(255)
    // stroke(`rgb(${parseInt(random(255))},${parseInt(random(255))},${parseInt(random(255))})`);
    // noFill();
    strokeWeight(2);
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
    console.log('ok');
    if (mouseButton !== RIGHT) {
        if (musicFile.isPlaying()) musicFile.pause(); else musicFile.play()
    }
}

function changeMusicFile() {
    musicFile.stop();
    musicFile = loadSound('./music/earth.mp3');
    if (musicFile) musicFile.play();
}
