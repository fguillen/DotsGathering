var dots;
var rack;
var noiseEllipse;
var noiseSize;
var noisePosition;

const WIDTH = 600;
const HEIGHT = 600;
const PADDING = 150;
const RACK_WIDTH = 10;
const RACK_HEIGHT = 10;
const DOTS_DISTANCE = (WIDTH - (PADDING * 2)) / RACK_WIDTH;
const DOTS_RADIUS = DOTS_DISTANCE * 0.8;

function setup() {
  createCanvas(WIDTH, HEIGHT);
  colorMode(HSB, 360, 100, 100, 1);
  frameRate(10);

  dots = new Array(RACK_WIDTH * RACK_WIDTH);
  rack = new Array(RACK_HEIGHT);
  noiseEllipse = new NoiseGeneratorPointsPosition(2, 0.1);
  noiseSize = new NoiseGeneratorPointsPosition(4, 0.1);
  noisePositionOffset = 2;
  noiseDrawingPosition = new NoiseGeneratorPointsPosition(10, 0.1);

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
    console.log(`Creating Dot at [${inception}] - [${rackPosition.x}, ${rackPosition.y}] - [${position.x}, ${position.y}]`);
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
      console.log(`rackPosition [${index}]: ` + rackPosition);

      if(
        (rackPosition.x >= 0 && rackPosition.x < RACK_WIDTH) &&
        (rackPosition.y >= 0 && rackPosition.y < RACK_HEIGHT)
      ) {
        console.log(`Checking rack[${rackPosition.y}, ${rackPosition.x}]: `, rack[rackPosition.y][rackPosition.x]);

        if(rack[rackPosition.y][rackPosition.x] == null) {
          const angle = ((TWO_PI / 6) * neighborsConf[index].angleIndex) + (TWO_PI / 12);
          const position = createVector(this.position.x + (sin(angle) * DOTS_DISTANCE), this.position.y + (cos(angle) * DOTS_DISTANCE));
          console.log("originalPosition: " + position);
          const noisePosition = Utils.vectorRandomNoise(noisePositionOffset);
          console.log("rackPosition: " + rackPosition + ", noisePosition: " + noisePosition);
          position.add(noisePosition);
          console.log("noisedPosition: " + position);
          const dot = new Dot(rackPosition, position, this.inception + 1);
          rack[rackPosition.y][rackPosition.x] = dot;
          dot.generateNeighbors();
        }

        neighbors.push(rack[rackPosition.y][rackPosition.x]);
      }
    }
  }

  draw() {
    const _color = color(195, 41, 96);
    const noiseSeed = this.rackPosition.x + (this.rackPosition.y * RACK_WIDTH);
    const noisedPosition = noiseDrawingPosition.getVector(frameCount + noiseSeed);
    noisedPosition.add(this.position);

    Utils.drawNoisedEllipse(noisedPosition, 10, DOTS_RADIUS / 2, DOTS_RADIUS / 2, 0, noiseSeed, _color, MULTIPLY, noiseSize, noiseEllipse);
    // fill("purple")
    // strokeWeight(DOTS_RADIUS / 2);
    // point(this.position.x, this.position.y);
  }
}
