var dots;
var rack;
var noiseEllipse;
var noiseSize;
var noisePosition;
var blendModeCode;

var dotsDistance;
var dotsRadius;
var noiseScale;

const PADDING = -10;
const RACK_WIDTH = 30;
const RACK_HEIGHT = 35;


function setup() {
  // createCanvas(WIDTH, HEIGHT);
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 1);
  frameRate(10);

  dotsDistance = (width - (PADDING * 2)) / RACK_WIDTH;
  dotsRadius = dotsDistance * 0.7;
  noiseScale = dotsRadius / 32;

  dots = new Array(RACK_WIDTH * RACK_WIDTH);
  rack = new Array(RACK_HEIGHT);
  blendModeCode = BLEND; // MULTIPLY;

  noiseEllipse = new NoiseGeneratorPointsPosition(2 * noiseScale, 0.1);
  noiseSize = new NoiseGeneratorPointsPosition(4 * noiseScale, 0.1 * noiseScale);
  noiseColor = new NoiseGeneratorPointsPosition(15 * noiseScale, 0.0001 * noiseScale);
  noisePositionOffset = 1 * noiseScale;
  noiseDrawingPosition = new NoiseGeneratorPointsPosition(10 * noiseScale, 0.1 * noiseScale);

  for (let index = 0; index < rack.length; index++) {
    rack[index] = new Array(RACK_WIDTH);
  }


  // Generate Dots
  generateFirstDot(createVector(0, 0), createVector(PADDING, PADDING));

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

  static drawNoisedEllipse(position, points, hight, width, angle, noiseSeed, color, blendModeCode, noiseGeneratorSize, noiseGeneratorPointsPosition){
    let angleStep = TWO_PI / points;
    let curvePoints = new Array(points);
    let index = 0;
    let noiseSize = noiseGeneratorSize.getVector(frameCount + noiseSeed);
    width += noiseSize.x;
    hight += noiseSize.y;


    // Calculate points
    for (let i = 0; i < TWO_PI; i += angleStep) {
      let noisePosition = noiseGeneratorPointsPosition.getVector(frameCount + noiseSeed + (i * 1000));
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
}

class NoiseGeneratorPointsPosition {
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
    var neighborsConf = [
      { rackOffsets: createVector(1, 1), angleIndex: 0},
      { rackOffsets: createVector(1, 0), angleIndex: 1},
      { rackOffsets: createVector(0, -1), angleIndex: 2},
      { rackOffsets: createVector(-1, -1), angleIndex: 3},
      { rackOffsets: createVector(-1, 0), angleIndex: 4},
      { rackOffsets: createVector(0, 1), angleIndex: 5}
    ]

    Utils.shuffleArray(neighborsConf) // to prevent position noise patterns

    for (let index = 0; index < 6; index++) {
      const rackPosition = this.rackPosition.copy().add(neighborsConf[index].rackOffsets);

      if(
        (rackPosition.x >= 0 && rackPosition.x < RACK_WIDTH) &&
        (rackPosition.y >= 0 && rackPosition.y < RACK_HEIGHT)
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
    const noiseSeed = (this.rackPosition.x + (this.rackPosition.y * RACK_WIDTH)) * 1000;
    const noisedPosition = noiseDrawingPosition.getVector(frameCount + noiseSeed);
    const noisedColor = noiseColor.get(frameCount * noiseSeed);

    _color = color(hue(_color), saturation(_color), brightness(_color) + noisedColor);


    noisedPosition.add(this.position);

    if(noisedPosition.x < PADDING) {
      noisedPosition.x = width - PADDING - (PADDING - noisedPosition.x);
    }

    Utils.drawNoisedEllipse(noisedPosition, 10, dotsRadius / 2, dotsRadius / 2, 0, noiseSeed, _color, blendModeCode, noiseSize, noiseEllipse);
    // fill("purple")
    // strokeWeight(dotsRadius / 2);
    // point(this.position.x, this.position.y);
  }
}
