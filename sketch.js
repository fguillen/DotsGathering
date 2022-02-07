var dots;
var rack;
var noiseEllipse;
var noiseSize;
var noisePosition;
var blendModeCode;

var dotsDistance;
var dotsRadius;
var noiseScale;

var padding = 10;
var rackWidth = 40;
var rackHeight = 10;

var p5Div;


function setup() {
  // createCanvas(WIDTH, HEIGHT);
  p5Div = document.getElementById("p5-div");
  console.log("Utils.elementWidth(p5Div): " + Utils.elementWidth(p5Div));
  console.log("Utils.elementHeight(p5Div): " + Utils.elementHeight(p5Div));
  const p5Canvas = createCanvas(Utils.elementWidth(p5Div), Utils.elementHeight(p5Div));
  p5Canvas.parent(p5Div);
  colorMode(HSB, 360, 100, 100, 1);
  frameRate(10);

  padding = 50;
  rackWidth = Math.floor((width - (padding * 2)) * 0.04);
  rackHeight = Math.floor((height - (padding * 2)) * 0.0475);

  dotsDistance = (width - (padding * 2)) / rackWidth;
  dotsRadius = dotsDistance * 0.7;
  noiseScale = dotsRadius / 32;

  dots = new Array(rackWidth * rackHeight);
  rack = new Array(rackHeight);
  blendModeCode = BLEND; // MULTIPLY;

  noiseEllipse = new NoiseGenerator(2 * noiseScale, 0.1 * noiseScale);
  noiseSize = new NoiseGenerator(4 * noiseScale, 0.1 * noiseScale);
  noiseColor = new NoiseGenerator(15 * noiseScale, 0.1);
  noisePositionOffset = 1 * noiseScale;
  noiseDrawingPosition = new NoiseGenerator(10 * noiseScale, 0.1 * noiseScale);

  for (let index = 0; index < rack.length; index++) {
    rack[index] = new Array(rackWidth);
  }


  // Generate Dots
  generateFirstDot(createVector(0, 0), createVector(padding, padding));

  // noLoop();
}

function draw() {
  background(220);
  dots.forEach(dot => {
    dot.draw();
  });
}

function generateFirstDot(rackPosition, position) {
  const dot = new Dot(rackPosition, position, 0);
  rack[0][0] = dot;
  dot.generateNeighbors();
}

class Utils {
  static vectorNoise(noisePosition, offset) {
    const velocity = 0;

    const x = map((noise(noisePosition.x * velocity)), 0, 1, -offset, offset);
    const y = map((noise(noisePosition.y * velocity)), 0, 1, -offset, offset);

    return createVector(x, y);
  }

  static vectorRandomNoise(offset) {
    const x = map(Math.random(), 0, 1, -offset, offset);
    const y = map(Math.random(), 0, 1, -offset, offset);

    return createVector(x, y);
  }

  static randomNoise(offset) {
    return map(Math.random(), 0, 1, -offset, offset);
  }

  static shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
  }

  // From here: https://stackoverflow.com/a/7616484/316700
  static hash(string) {
    var result = 0, i, chr;
    if (string.length === 0) return result;
    for (i = 0; i < string.length; i++) {
      chr   = string.charCodeAt(i);
      result  = ((result << 5) - result) + chr;
      result |= 0; // Convert to 32bit integer
    }
    return result;
  };

  static drawNoisedEllipse(position, points, hight, width, angle, noiseSeed, color, blendModeCode, noiseGeneratorSize, noiseGenerator){
    let angleStep = TWO_PI / points;
    let curvePoints = new Array(points);
    let index = 0;
    let noiseSize = noiseGeneratorSize.getVector(frameCount + noiseSeed);
    width += noiseSize.x;
    hight += noiseSize.y;


    // Calculate points
    for (let i = 0; i < TWO_PI; i += angleStep) {
      let noisePosition = noiseGenerator.getVector(frameCount + noiseSeed + (i * 1000));
      let sx = (cos(i) * hight) + noisePosition.x;
      let sy = (sin(i) * width) + noisePosition.y;

      curvePoints[index] = createVector(sx, sy);
      index ++;
    }

    // Draw curve
    push();
    fill(color);
    blendMode(blendModeCode);
    noStroke();
    translate(position.x, position.y);
    rotate(angle);
    beginShape();
    curveVertex(curvePoints[curvePoints.length-1].x, curvePoints[curvePoints.length-1].y);

    for (let i = 0; i < curvePoints.length; i++) {
      curveVertex(curvePoints[i].x, curvePoints[i].y);
    }
    curveVertex(curvePoints[0].x, curvePoints[0].y);
    curveVertex(curvePoints[1].x, curvePoints[1].y);
    endShape();
    pop();
  }

  static elementWidth(element) {
    return (
      element.clientWidth -
      parseFloat(window.getComputedStyle(element, null).getPropertyValue("padding-left")) -
      parseFloat(window.getComputedStyle(element, null).getPropertyValue("padding-right"))
    )
  }

  static elementHeight(element) {
    return (
      element.clientHeight -
      parseFloat(window.getComputedStyle(element, null).getPropertyValue("padding-top")) -
      parseFloat(window.getComputedStyle(element, null).getPropertyValue("padding-bottom"))
    )
  }
}

class NoiseGenerator {
  constructor(scale, speed, seed = "") {
    this.scale = scale;
    this.speed = speed;
    this.seed = Math.abs(Utils.hash(seed));
    this.seed2 = this.seed + 1_000;
  }

  get(position) {
    return this.mappedNoise((position * this.speed) + this.seed) * this.scale;
  }

  getVector(position) {
    return createVector(this.get(position), this.get(position + this.seed2));
  }

  mappedNoise(value) {
    let n = noise(value);
    return map(n, 0, 1, -1, 1);
  }
}

class Dot {
  constructor(rackPosition, position, inception) {
    this.rackPosition = rackPosition;
    this.position = position;
    this.neighbors = [];
    this.inception = inception;

    dots.push(this);
  }

  generateNeighbors() {
    var neighbors = [];
    var neighborsConf;

    // rack has hexagonal tiles
    // If the row is even the neighbors rack indexes have one configuration
    if(this.rackPosition.y % 2 == 0){
      neighborsConf = [
        { rackOffsets: createVector(1, 1), angleIndex: 0},
        { rackOffsets: createVector(1, 0), angleIndex: 1},
        { rackOffsets: createVector(+1, -1), angleIndex: 2},
        { rackOffsets: createVector(0, -1), angleIndex: 3},
        { rackOffsets: createVector(-1, 0), angleIndex: 4},
        { rackOffsets: createVector(0, 1), angleIndex: 5}
      ]

    // If the row is even the neighbors rack indexes have *another* configuration
    } else {
      neighborsConf = [
        { rackOffsets: createVector(0, 1), angleIndex: 0},
        { rackOffsets: createVector(1, 0), angleIndex: 1},
        { rackOffsets: createVector(0, -1), angleIndex: 2},
        { rackOffsets: createVector(-1, -1), angleIndex: 3},
        { rackOffsets: createVector(-1, 0), angleIndex: 4},
        { rackOffsets: createVector(-1, 1), angleIndex: 5}
      ]
    }

    Utils.shuffleArray(neighborsConf) // to prevent position noise patterns

    for (let index = 0; index < 6; index++) {
      const rackPosition = this.rackPosition.copy().add(neighborsConf[index].rackOffsets);

      if(
        (rackPosition.x >= 0 && rackPosition.x < rackWidth) &&
        (rackPosition.y >= 0 && rackPosition.y < rackHeight)
      ) {
        if(rack[rackPosition.y][rackPosition.x] == null) {
          const angle = ((TWO_PI / 6) * neighborsConf[index].angleIndex) + (TWO_PI / 12);
          const position = createVector(this.position.x + (sin(angle) * dotsDistance), this.position.y + (cos(angle) * dotsDistance));
          const noisePosition = Utils.vectorRandomNoise(noisePositionOffset);
          position.add(noisePosition);
          const dot = new Dot(rackPosition, position, this.inception + 1);
          rack[rackPosition.y][rackPosition.x] = dot;
          dot.generateNeighbors();
        }

        neighbors.push(rack[rackPosition.y][rackPosition.x]);
      }
    }
  }

  draw() {
    var _color = color(201, 60, 80);
    const noiseSeed = (this.rackPosition.x + (this.rackPosition.y * rackWidth)) * 1000;
    const noisedPosition = noiseDrawingPosition.getVector(frameCount + noiseSeed);
    const noisedColor = noiseColor.get(frameCount + noiseSeed);

    _color = color(hue(_color), saturation(_color), brightness(_color) + noisedColor);


    noisedPosition.add(this.position);

    // // Borders round robin
    // if(noisedPosition.x < padding) {
    //   noisedPosition.x = width - padding - (padding - noisedPosition.x);
    // }

    Utils.drawNoisedEllipse(noisedPosition, 10, dotsRadius / 2, dotsRadius / 2, 0, noiseSeed, _color, blendModeCode, noiseSize, noiseEllipse);
    // fill("purple")
    // strokeWeight(dotsRadius / 2);
    // point(this.position.x, this.position.y);
  }
}
