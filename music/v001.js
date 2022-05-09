var musicFile
var fft
function preload() {
    musicFile = loadSound('./music/industry_felix.mp3')
}

function setup() {
    createCanvas(windowWidth, windowHeight)
    fft = new p5.FFT()
}
function draw() {
    background(0)
    stroke(255)

    var wave = fft.waveform()
    beginShape()
    for (var i = 0; i < width; i++) {
        var index = floor(map(i, 0, width, 0, wave.length))

        var x = i
        var y = wave[index] * 300 + height / 2
        point(x, y)
    }
    endShape()
}

function touchStarted() {
    if (musicFile.isPlaying()) {
        musicFile.pause()
    }
    else {
        musicFile.play()

    }
}