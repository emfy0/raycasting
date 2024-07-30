const GAME = document.getElementById('game');
const CTX_2D = GAME.getContext('2d');

const GAME_WIDTH = 2000;
const GAME_HEIGHT = 2000;

const EPS = 1e-6;

const PLAYER_STEP_LEN = 0.5;

const SCENE = [
  [null, "red",   null, null, null, "orange", "yellow", null, null, null, null],
  [null, "green", null, null, null, null,     "blue",   null, null, null, null],
  [null, "green", null, null, null, null,     null,     null, null, null, null],
  [null, "green", null, null, null, null,     null,     null, null, null, null],
  [null, "green", null, null, null, null,     null,     null, null, null, null],
  [null, "green", null, null, null, null,     null,     null, null, null, null],
  [null, "green", null, null, null, null,     null,     null, null, null, null],
  [null, "green", null, null, null, null,     null,     null, null, null, null],
  [null, "green", null, null, null, null,     null,     null, null, null, null],
  [null, "red",   null, null, null, null,     null,     null, null, null, null],
  [null, "red",   null, null, null, null,     null,     null, null, null, "purple"],
]

const GRID_COLS = SCENE[0].length ;
const GRID_ROWS = SCENE.length;

const CELL_WIDTH = GAME_WIDTH / GRID_COLS;
const CELL_HEIGHT = GAME_HEIGHT / GRID_ROWS;

const SCREEN_WIDTH = 300;

const STRIP_WIDTH = GAME_WIDTH / SCREEN_WIDTH;

class Vec2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  };
  static fromAngle(angle) {
    return new Vec2(Math.cos(angle), Math.sin(angle));
  }
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
  array() {
    return [this.x, this.y];
  }
  dot(that) {
    return this.x * that.x + this.y * that.y;
  }
  lerp(that, t) {
    return that.sub(this).scale(t).add(this);
  }
}

const FOV = Math.PI * 0.5;
const NEAR_CLIPPING_PLANE = 1.0;

class Player {
  constructor(position, direction) {
    this.position = position;
    this.direction = direction;
  };
  lineOfSight() {
    return this.position.add(Vec2.fromAngle(this.direction).scale(EPS));
  }
  fov(length) {
    const left = this.position.add(
      Vec2.fromAngle(this.direction - Math.PI / 4).norm().scale(length)
    );
    const right = this.position.add(
      Vec2.fromAngle(this.direction + Math.PI / 4).norm().scale(length)
    );

    return [left, right];
  }
}

const MINIMAP_SIZE = new Vec2(3, 3);
const MINIMAP_POSITION = new Vec2(0.1, 0.1);

const GRID_SIZE = new Vec2(GRID_COLS, GRID_ROWS);

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
  CTX_2D.fillRect(0, 0, GRID_SIZE.x, GRID_SIZE.y);

  CTX_2D.lineWidth = 0.04;

  CTX_2D.strokeStyle = "#303030";
  for (let x = 0; x <= GRID_COLS; ++x) {
    drawLine(
      new Vec2(x, GRID_SIZE.y),
      new Vec2(x, 0)
    );
  }
  for (let y = 0; y <= GRID_ROWS; ++y) {
    drawLine(
      new Vec2(GRID_SIZE.x, y),
      new Vec2(0, y)
    );
  }

  for (let x = 0; x < GRID_COLS; ++x) {
    for (let y = 0; y < GRID_ROWS; ++y) {
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

function renderMinimap(player) {
  CTX_2D.save();

  CTX_2D.scale(CELL_WIDTH, CELL_HEIGHT)

  CTX_2D.translate(...MINIMAP_POSITION.array());
  CTX_2D.scale(...MINIMAP_SIZE.div(GRID_SIZE).array());

  drawGrid();
  CTX_2D.strokeStyle = 'magenta';
  drawCircle(player.position, 0.15, 'magenta');

  const [left, right] = player.fov(1.0);

  drawLine(player.position, left);
  drawLine(player.position, right);

  for (let x = 0; x < SCREEN_WIDTH; ++x) {
    const { result: rayPoint, resultCell: rayCell } = castRay(
      player.position, left.lerp(right, x / SCREEN_WIDTH)
    );

    if (!insideScene(rayCell)) { continue };

    const color = SCENE[rayCell.y][rayCell.x];

    if (color == null) { continue };

    drawLine(player.position, rayPoint);
  }

  CTX_2D.restore();
}

function insideScene(point) {
  return(
    point.x < GRID_COLS && point.x >= 0 &&
    point.y < GRID_ROWS && point.y >= 0
  );
}

function renderScene(player) {
  const [fovLeft, fovRight] = player.fov(EPS);

  for (let x = 0; x < SCREEN_WIDTH; ++x) {
    const { result: rayPoint, resultCell: rayCell } = castRay(
      player.position, fovLeft.lerp(fovRight, x / SCREEN_WIDTH)
    );

    if (!insideScene(rayCell)) { continue };

    const color = SCENE[rayCell.y][rayCell.x];

    if (color == null) { continue };

    const rayVector = rayPoint.sub(player.position);
    const directionVector = Vec2.fromAngle(player.direction)

    const stripHeight = GAME_HEIGHT / rayVector.dot(directionVector);

    CTX_2D.fillStyle = color;
    CTX_2D.fillRect(
      x * STRIP_WIDTH, (GAME_HEIGHT - stripHeight) * 0.5, STRIP_WIDTH, stripHeight
    );
  }
}

function castRay(from, to) {
  const result = rayStep(from, to);
  // CTX_2D.strokeStyle = 'blue';
  // drawCircle(result, 0.15, 'blue');

  const resultCell = pointCell(result);

  if (
    insideScene(resultCell) && SCENE[resultCell.y][resultCell.x] == null
  ) {
    return castRay(to, result);
  } else {
    return { result, resultCell }
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

function renderGame(player) {
  CTX_2D.fillStyle = "#181818";
  CTX_2D.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  renderScene(player);
  renderMinimap(player);
}

// -----

GAME.width = GAME_WIDTH;
GAME.height = GAME_HEIGHT;

const player = new Player(new Vec2(3.5, 3.5), 0);

renderGame(player);

window.addEventListener("keydown", (e) => {
  switch (e.code) {
    case 'KeyW': {
        player.position = player.position.add(
          Vec2.fromAngle(player.direction).scale(PLAYER_STEP_LEN)
        );
    } break;
    case 'KeyS': {
        player.position = player.position.sub(
          Vec2.fromAngle(player.direction).scale(PLAYER_STEP_LEN)
        );
    } break;
    case 'KeyA': {
        player.position = player.position.sub(
          Vec2.fromAngle(player.direction + Math.PI * 0.5).scale(PLAYER_STEP_LEN)
        );
    } break;
    case 'KeyD': {
        player.position = player.position
            .add(Vec2.fromAngle(player.direction + Math.PI * 0.5).scale(PLAYER_STEP_LEN));
    } break;
    case 'KeyL': {
        player.direction += Math.PI*0.1;
    } break;
    case 'KeyH': {
        player.direction -= Math.PI*0.1;
    } break;
    default: { return }
  }

  renderGame(player);
})
