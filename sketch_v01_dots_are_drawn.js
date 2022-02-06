var dots;
var rack;

const WIDTH = 600;
const HEIGHT = 600;
const PADDING = 150;
const RACK_WIDTH = 10;
const RACK_HEIGHT = 10;
const DOTS_DISTANCE = (WIDTH - (PADDING * 2)) / RACK_WIDTH;
const DOTS_RADIUS = DOTS_DISTANCE * 0.8;

function setup() {
  createCanvas(WIDTH, HEIGHT);

  dots = new Array(RACK_WIDTH * RACK_WIDTH);
  rack = new Array(RACK_HEIGHT);

  for (let index = 0; index < rack.length; index++) {
    rack[index] = new Array(RACK_WIDTH);
  }

  // Generate Dots
  generateFirstDot(createVector(0, 0), createVector(PADDING, PADDING));

  noLoop();
}

function draw() {
  background(220);
  dots.forEach(dot => {
    dot.draw();
  });
}

function generateFirstDot(rackPosition, position) {
  const dot = new Dot(rackPosition, position, 0);
  dot.generateNeighbors();
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
    var rackOffsets = [
      createVector(1, 1),
      createVector(1, 0),
      createVector(0, -1),
      createVector(-1, -1),
      createVector(-1, 0),
      createVector(0, 1),
    ]

    for (let index = 0; index < 6; index++) {
      const rackPosition = this.rackPosition.copy().add(rackOffsets[index]);
      console.log(`rackPosition [${index}]: ` + rackPosition);

      if(
        (rackPosition.x >= 0 && rackPosition.x < RACK_WIDTH) &&
        (rackPosition.y >= 0 && rackPosition.y < RACK_HEIGHT)
      ) {
        console.log(`Checking rack[${rackPosition.y}, ${rackPosition.x}]: `, rack[rackPosition.y][rackPosition.x]);

        if(rack[rackPosition.y][rackPosition.x] == null) {
          const angle = ((TWO_PI / 6) * index) + (TWO_PI / 12);
          const position = createVector(this.position.x + (sin(angle) * DOTS_DISTANCE), this.position.y + (cos(angle) * DOTS_DISTANCE));
          const dot = new Dot(rackPosition, position, this.inception + 1);
          rack[rackPosition.y][rackPosition.x] = dot;
          dot.generateNeighbors();
        }

        neighbors.push(rack[rackPosition.y][rackPosition.x]);
      }
    }
  }

  draw() {
    stroke("purple");
    strokeWeight(DOTS_RADIUS / 2);
    // console.log("Radius: " + DOTS_RADIUS / 2);
    point(this.position.x, this.position.y);
  }
}
