var dots; // All the generated Dots
var rack; // The rack to keep track of which tiles/dots have been generated

// Perlin Noise Generators
var noiseEllipse;
var noiseSize;
var noisePosition;
var noiseTimeBetweenDots;

// Some settings
var blendModeCode;
var dotsDistance;
var dotsRadius;
var noiseScale;
var padding;
var rackWidth;
var rackHeight;

var p5Div;

// For the incremental dots addition animation
var drawnDotIndex = 0;
var timeBetweenDrawnDots = 0.01;
var nextDrawnDotAt;


function setup() {
  p5Div = document.getElementById("p5-div");
  const p5Canvas = createCanvas(Utils.elementWidth(p5Div), Utils.elementHeight(p5Div));
  p5Canvas.parent(p5Div);
  colorMode(HSB, 360, 100, 100, 1);
  frameRate(10);

  // Dimensions calculations
  padding = 25;
  rackWidth = Math.floor((width - (padding * 2)) * 0.04);
  rackHeight = Math.floor((height - (padding * 2)) * 0.0475);
  dotsDistance = (width - (padding * 2)) / rackWidth;
  dotsRadius = dotsDistance * 0.7;
  noiseScale = dotsRadius / 32;

  // Init Arrays
  dots = [];
  rack = new Array(rackHeight);
  for (let index = 0; index < rack.length; index++) {
    rack[index] = new Array(rackWidth);
  }

  blendModeCode = BLEND; // MULTIPLY;

  // Init Noise Generators
  noiseEllipse = new NoiseGenerator(2 * noiseScale, 0.1 * noiseScale);
  noiseSize = new NoiseGenerator(4 * noiseScale, 0.1 * noiseScale);
  noiseColor = new NoiseGenerator(15 * noiseScale, 0.1);
  noisePositionOffset = 1 * noiseScale;
  noiseDrawingPosition = new NoiseGenerator(10 * noiseScale, 0.1 * noiseScale);
  noiseTimeBetweenDots = new NoiseGenerator(0.5, 1);


  // Generate Dots
  generateFirstDot(createVector(0, 0), createVector(padding, padding));

  // Set up dots addition timer
  nextDrawnDotAt = Date.now();

  // noLoop();
}

function draw() {
  background(220);
  dots.slice(0, drawnDotIndex).forEach(dot => {
    dot.draw();
  });

  // Next drawn Dot?
  if(Date.now() > nextDrawnDotAt) {
    drawnDotIndex ++;
    nextDrawnDotAt = Date.now() + ((timeBetweenDrawnDots + noiseTimeBetweenDots.get(frameCount)) * 1000);
  }
}

function generateFirstDot(rackPosition, position) {
  const dot = new Dot(rackPosition, position, 0);
  dot.generateNeighbors();
}

// Utils library
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

  // Draws an ellipse/circle but with some degree of deformation
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

  // Calculate the Width in pixels of a Dom element
  static elementWidth(element) {
    return (
      element.clientWidth -
      parseFloat(window.getComputedStyle(element, null).getPropertyValue("padding-left")) -
      parseFloat(window.getComputedStyle(element, null).getPropertyValue("padding-right"))
    )
  }

  // Calculate the Height in pixels of a Dom element
  static elementHeight(element) {
    return (
      element.clientHeight -
      parseFloat(window.getComputedStyle(element, null).getPropertyValue("padding-top")) -
      parseFloat(window.getComputedStyle(element, null).getPropertyValue("padding-bottom"))
    )
  }
}

// Wrapper over `noise` function
// Params:
// - scale: the finale value will be between -scale and scale
// - speed: how many increments per frame into the noise texture
// - seed: in case you want to control de initial randomness
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

// The Dot class
class Dot {
  // - rackPosition: the position in the rack tiles, only used to know what Dots have been generated
  // - position: the position in the screen
  // - inception: just for debug
  constructor(rackPosition, position, inception) {
    this.rackPosition = rackPosition;
    this.position = position;
    this.neighbors = [];
    this.inception = inception;

    dots.push(this);
    rack[this.rackPosition.y][this.rackPosition.x] = this;
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

      // Only if Dot is not in the rack already
      if(
        (rackPosition.x >= 0 && rackPosition.x < rackWidth) &&
        (rackPosition.y >= 0 && rackPosition.y < rackHeight)
      ) {
        if(rack[rackPosition.y][rackPosition.x] == null) {
          const angle = ((TWO_PI / 6) * neighborsConf[index].angleIndex) + (TWO_PI / 12);
          const position = createVector(this.position.x + (sin(angle) * dotsDistance), this.position.y + (cos(angle) * dotsDistance));
          const noisePosition = Utils.vectorRandomNoise(noisePositionOffset);
          position.add(noisePosition);

          // generate Dot
          const dot = new Dot(rackPosition, position, this.inception + 1);

          // generate Neighbors
          dot.generateNeighbors();
        }

        // The neighbors property is actually not used
        neighbors.push(rack[rackPosition.y][rackPosition.x]);
      }
    }
  }

  draw() {
    var _color = color(201, 60, 80);

    // Unique noise seed per Dot
    const noiseSeed = (this.rackPosition.x + (this.rackPosition.y * rackWidth)) * 1000;

    // Some noise in the position
    const noisedPosition = noiseDrawingPosition.getVector(frameCount + noiseSeed);
    noisedPosition.add(this.position);

    // Some noise in the brightness of the color
    const noisedColor = noiseColor.get(frameCount + noiseSeed);
    _color = color(hue(_color), saturation(_color), brightness(_color) + noisedColor);

    Utils.drawNoisedEllipse(noisedPosition, 10, dotsRadius / 2, dotsRadius / 2, 0, noiseSeed, _color, blendModeCode, noiseSize, noiseEllipse);
  }
}
