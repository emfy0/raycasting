const GAME = document.getElementById('game');
const CTX_2D = GAME.getContext('2d');

const GAME_WIDTH = 1000;
const GAME_HEIGHT = 1000;

const GRID_COLS = 10;
const GRID_ROWS = 10;

const CELL_WIDTH = GAME_WIDTH / GRID_COLS;
const CELL_HEIGHT = GAME_HEIGHT / GRID_ROWS;

const EPS = 1e-6;

const SCENE = [
  [null, "green", null, null, null, null, null, null, null, null, null],
  [null, "green", null, null, null, null, null, null, null, null, null],
  [null, "green", null, null, null, null, null, null, null, null, null],
  [null, "green", null, null, null, null, null, null, null, null, null],
  [null, "green", null, null, null, null, null, null, null, null, null],
  [null, "green", null, null, null, null, null, null, null, null, null],
  [null, "green", null, null, null, null, null, null, null, null, null],
  [null, "green", null, null, null, null, null, null, null, null, null],
  [null, "green", null, null, null, null, null, null, null, null, null],
  [null, "green", null, null, null, null, null, null, null, null, null],
  [null, "green", null, null, null, null, null, null, null, null, null],
]

GAME.width = GAME_WIDTH;
GAME.height = GAME_HEIGHT;

CTX_2D.scale(CELL_WIDTH, CELL_HEIGHT)

class Vec2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  };
  div(that) {
    return new Vec2(this.x / that.x, this.y / that.y);
  }
  mul(that) {
    return new Vec2(this.x * that.x, this.y * that.y);
  }
  sub(that) {
    return new Vec2(this.x - that.x, this.y - that.y);
  }
  add(that) {
    return new Vec2(this.x + that.x, this.y + that.y);
  }
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  norm() {
    const l = this.length();
    return new Vec2(this.x / l, this.y / l);
  }
  scale(v) {
    return new Vec2(this.x * v, this.y * v);
  }
  distanceTo(that) {
    return that.sub(this).length();
  }
}

function drawLine(from, to) {
  CTX_2D.beginPath();
  CTX_2D.moveTo(from.x, from.y);
  CTX_2D.lineTo(to.x, to.y);
  CTX_2D.closePath();
  CTX_2D.stroke();
}

function drawCircle(position, radius, fillStyle = null) {
  CTX_2D.beginPath();
  CTX_2D.arc(position.x, position.y, radius, 0, 2 * Math.PI);

  if (fillStyle  != null) {
    CTX_2D.fillStyle = fillStyle;
    CTX_2D.fill();
  }

  CTX_2D.stroke();
}

function drawGrid() {
  CTX_2D.fillStyle = '#181818';
  CTX_2D.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  CTX_2D.lineWidth = 0.04;

  CTX_2D.strokeStyle = "#303030";
  for (let x = 0; x <= GRID_COLS; ++x) {
    drawLine(
      new Vec2(x, GAME_HEIGHT),
      new Vec2(x, 0)
    );
  }
  for (let y = 0; y <= GRID_ROWS; ++y) {
    drawLine(
      new Vec2(GAME_WIDTH, y),
      new Vec2(0, y)
    );
  }

  for (let x = 0; x <= GRID_COLS; ++x) {
    for (let y = 0; y <= GRID_ROWS; ++y) {
      if (SCENE[y][x] != null) {
        CTX_2D.fillStyle = SCENE[y][x];
        CTX_2D.fillRect(x, y, 1, 1);
      }
    }
  }

}

function closestOneDimensionGridBoundary(x1, dx) {
  if (dx == 0) return x1;

  if (dx > 0) {
    return Math.ceil(x1) + EPS;
  } else {
    return Math.floor(x1) - EPS;
  }
}

function pointCell(point) {
  return new Vec2(
    Math.floor(point.x),
    Math.floor(point.y),
  );
}

function castRay(from, to) {
    const result = rayStep(from, to);
    CTX_2D.strokeStyle = 'blue';
    drawCircle(result, 0.15, 'blue');

    const resultCell = pointCell(result);

    if (
      resultCell.x < GRID_COLS && resultCell.x >= 0 &&
      resultCell.y < GRID_ROWS && resultCell.y >= 0 &&
      SCENE[resultCell.y][resultCell.x] == null
    ) {
      castRay(to, result)
    }
}

function rayStep(start, end) {
  // y = kx + c
  // start = (x1, y1)
  // end = (x2, y2)

  // k = (y2 - y1) / (x2 - x1)
  // c = y1 - k * x1
  
  const delta = end.sub(start);

  if (delta.x == 0) {
    const yBoundary = closestOneDimensionGridBoundary(end.y, delta.y);
    return new Vec2(end.x, yBoundary);
  }

  const k = delta.y / delta.x;
  const c = end.y - k * end.x;

  const xBoundary = closestOneDimensionGridBoundary(end.x, delta.x);
  const yIntersection = k * xBoundary + c;

  const xSnaped = new Vec2(xBoundary, yIntersection);

  const yBoundary = closestOneDimensionGridBoundary(end.y, delta.y);
  const xIntersection = (yBoundary - c) / k;

  const ySnaped = new Vec2(xIntersection, yBoundary);

  return end.distanceTo(xSnaped) > end.distanceTo(ySnaped) ? ySnaped : xSnaped;
}

drawGrid();

const playerPosition = new Vec2(3.5, 3.5)

GAME.addEventListener('mousemove', (e) => {
  const mouse_position = new Vec2(e.offsetX, e.offsetY)
      .div(new Vec2(CELL_WIDTH, CELL_HEIGHT));

  drawGrid();

  CTX_2D.strokeStyle = 'lightgreen';
  drawLine(playerPosition, mouse_position);

  CTX_2D.strokeStyle = 'magenta';
  drawCircle(playerPosition, 0.15, 'magenta');

  CTX_2D.strokeStyle = 'green';
  drawCircle(mouse_position, 0.15, 'green');

  castRay(playerPosition, mouse_position);
})
