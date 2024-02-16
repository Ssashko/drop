const Color = {
  red: "#fc0317",
  green: "#1d9106",
  blue: "#067391",
  darkGreen: "#0e2e13",
  grey: "#7c7c7d",
  white: "#ffffff",
  black: "#000",
};

let lastCallback = null;

function SetTerminateCallback(callback) {
  lastCallback = callback;
  document.getElementById("terminate-loader").onclick = (e) => {
    console.log("Terminated");
    callback(e);
  };
}

function calcDistance(point1, point2) {
  return Math.sqrt(
    (point1.x - point2.x) * (point1.x - point2.x)
    + (point1.y - point2.y) * (point1.y - point2.y)
  );
}

class QuadrangleBuildSettings {
  constructor() {
    this.restrictions = {
      rightAngle: getRangeById("right-angle-range").map(toRadians),
      bottomAngle: getRangeById("bot-angle-range").map(toRadians),
      leftAngle: getRangeById("left-angle-range").map(toRadians),
      topAngle: getRangeById("top-angle-range").map(toRadians),
      Yangle: getRangeById("yangle-angle-range").map(toRadians)
    }
    this.useClassicRhombus = document.getElementById("classic-rhombus").checked;
    this.useGeometricMethod = document.getElementById("geometric-method").checked;
    this.numerical = {
      directMethod: {
        enabled: document.getElementById("numerical-method").checked,
        step: Number.parseFloat(document.getElementById("step-numerical-method").value),
        speedType: document.querySelector('input[name="numeric-method-type"]:checked').value == "fast-standard-numeric"
          ? "fast" : "standard"
      },
      deltoidMethod: {
        enabled: document.getElementById("deltoid-numeric").checked,
        step: Number.parseFloat(document.getElementById("step-deltoid-numeric").value)
      }
    }
  }
}

class Loader {
  constructor() {
    this.status = 0;
    this.time = Date.now();
    this.start_time = null;
    this.velocity = 0;
  }
  showLoader() {
    this.#updateLoader();

    document.getElementById("loader").style.display = "flex";
    document.getElementById("time-left").innerText = "-";
  }
  hideLoader() {
    this.start_time = null;
    this.velocity = 0;
    document.getElementById("loader").style.display = "none";
    document.getElementById("time-left").innerText = "-";
  }
  #updateLoader() {
    document.getElementById("loader-value").innerText = Math.round(this.status);
  }
  #setTimer() {
    let velocity = this.status / ((this.time - this.start_time) / 1000);
    let leftStatus = 100 - this.status;
    let left_time = Math.round(leftStatus / velocity);
    let result = ""
    if (Math.floor(left_time / 3600) != 0)
      result += Math.floor(left_time / 3600) + " год, ";
    left_time %= 3600;
    if (Math.floor(left_time / 60) != 0)
      result += Math.floor(left_time / 60) + " хв, ";
    left_time %= 60;
    result += left_time + " сек.";

    document.getElementById("time-left").innerText = result;
  }

  updateStatus(value) {
    if (this.start_time == null)
      this.start_time = Date.now();
    this.time = Date.now();
    this.status = value;
    this.#updateLoader();
    if ((this.time - this.start_time) % 3000 > 2500)
      this.#setTimer();
  }
}
let loader = new Loader(0, 100);
class PointsCloud {
  constructor() {
    this._points = [];
  }

  getPoints() {
    return this._points;
  }

  genRandPoints() {
    // const count = Math.ceil(Math.random() * 7) + 2;
    const count = 3;
    for (let i = 0; i < count; i++)
      this._points.push(this.genRandPoint());
  }

  genRandPoint() {
    return Point.create(
      (Math.random() > 0.5 ? -1 : 1) * Math.random() / 5,
      (Math.random() > 0.5 ? -1 : 1) * Math.random() / 5
    );
  }

  add(normalCoords) {
    this._points.push(Point.create(normalCoords));
  }

  remove(index) {
    this._points.splice(index, 1);
  }

  movePoint(index, newNormalPoint) {
    this._points[index].x = newNormalPoint.x;
    this._points[index].y = newNormalPoint.y;
  }
}

class QuadrangleCut {
  constructor(normalOffset) {
    this.offset = normalOffset;
  }

  changeOffset(offset) {
    this.offset = offset;
  }

  async reloadCut(roundedConvexHull, settings) {
    this.task = new Task(roundedConvexHull, this.offset, settings, loader);
    await this.task.exec();
    this._vertices = this.task.getCut().getListVertices();
  }

  getVertices() {
    return this._vertices;
  }

  moveVertex(index, newPoint) {
    this._vertices[index] = newPoint;
  }

  hasSelfIntersection() {
    const countOfVertices = this._vertices.length;
    for (let firstSideIndex = 0; firstSideIndex < this._vertices.length; firstSideIndex++) {
      for (let secondSideIndex = firstSideIndex + 2; secondSideIndex < firstSideIndex + countOfVertices - 1; secondSideIndex++) {
        if (this.doesTwoSegmentsIntersect(firstSideIndex, secondSideIndex) == 1) {
          return true;
        }
      }
    }
    return false;
  }

  doesTwoSegmentsIntersect(firstSideIndex, secondSideIndex) {
    const countOfVertices = this._vertices.length;
    const firstSegment = {
      startPoint: this._vertices[firstSideIndex % countOfVertices],
      endPoint: this._vertices[(firstSideIndex + 1) % countOfVertices]
    }
    const secondSegment = {
      startPoint: this._vertices[secondSideIndex % countOfVertices],
      endPoint: this._vertices[(secondSideIndex + 1) % countOfVertices]
    }
    const matrix = [
      [firstSegment.endPoint.x - firstSegment.startPoint.x, firstSegment.endPoint.y - firstSegment.startPoint.y],
      [secondSegment.startPoint.x - secondSegment.endPoint.x, secondSegment.startPoint.y - secondSegment.endPoint.y]
    ]
    const matrixDeterminant = determinant(matrix);
    if (Math.abs(matrixDeterminant) < Number.EPSILON) {
      return -1
    }

    const invertedMatrix = invert(matrix)
    const t = (secondSegment.startPoint.x - firstSegment.startPoint.x) * invertedMatrix[0][0] +
      (secondSegment.startPoint.y - firstSegment.startPoint.y) * invertedMatrix[1][0]
    const tau = (secondSegment.startPoint.x - firstSegment.startPoint.x) * invertedMatrix[0][1] +
      (secondSegment.startPoint.y - firstSegment.startPoint.y) * invertedMatrix[1][1]
    return 0 <= t && t <= 1 && 0 <= tau && tau <= 1
  }

  getMaxCoord(points) {
    let max = points[0].x;
    points.forEach(element => {
      max = Math.max(element.x, element.y, max);
    });
    return max;
  }

  getMinCoord(points) {
    let min = points[0].x;
    points.forEach(element => {
      min = Math.min(element.x, element.y, min);
    });
    return min;
  }

  getRestCut() {
    let pol = Polygon.create(this._vertices);
    let min_i = 0;
    pol.getListVertices().forEach((el, i) => {
      if (pol.getVertex(min_i).y > el.y)
        min_i = i;
    })
    let q0 = Point.create(pol.getVertex(min_i - 2));
    let q1 = Point.create(pol.getVertex(min_i - 1));
    let q2 = Point.create(pol.getVertex(min_i));
    let q3 = Point.create(pol.getVertex(min_i + 1));

    let v1 = Vector.create(q1.x - q2.x, q1.y - q2.y);
    let v2 = Vector.create(q3.x - q2.x, q3.y - q2.y);
    if (!(Math.abs(v1.length - v2.length) < 10e-3))
      return null;
    let angle = Vector.angleBetween(v1, v2);
    return [q3.rotate(q2, angle), q0.rotate(q2, angle), q1.rotate(q2, angle)];
  }

  isValid(roundedConvexHull) {
    return isRoundedConvexHullInsideQuadrangle(this._vertices, roundedConvexHull)
      && !this.hasSelfIntersection();
  }
}

class Scene {
  static LineTypes = {
    Solid: 0,
    Dashed: 1,
  };

  static Modes = {
    PointsCloudEditing: 0,
    QuadrangleEditing: 1,
  };

  constructor() {
    this.konvaStrategy = {
      'layers': {
        'background': new Konva.Layer(),
        'middle': new Konva.Layer(),
        'front': new Konva.Layer(),
      },
      'changeableObjectsStorage': {
        'gridLines': [],
        'pointsCloud': [],
        'quadrangle': {
          'lines': [],
          'vertices': [],
        },
        'innerConvexHull': null,
        'roundedOuterConvexHull': {
          'lines': [],
          'arcs': [],
        },
        'flapLines': [],
        'metrics': {
          'quadrangleAngles': [],
          'quadrangleLinesLength': [],
          'flapAngle': {
            'wedge': null,
            'text': null,
          },
          'flapLinesLength': [],
          'axesLabels': {
            'top': null,
            'left': null,
            'right': null
          }
        },
        'cursorDistances': {
          'horizontal': {
            'line': null,
            'text': null,
          },
          'vertical': {
            'line': null,
            'text': null,
          }
        },
        'horizontalAxis': {
          'line': null,
          'divisions': {
            7: [],
            5: [],
          },
        }
      }
    }
    this.extends = {
      'viewport': {
        w: window.innerWidth - 10,
        h: window.innerHeight - 10,
      },
      'normal': {
        w: 3,
        h: 2,
      },
      toViewport(normalX, normalY) {
        const v = this.viewport;
        const n = this.normal;
        let resultPoint = null;
        if (v.w / v.h >= n.w / n.h) {
          const offset = (v.w - n.w * v.h / n.h) / 2;
          resultPoint = { x: offset + (normalX + 1) * v.h / n.h, y: (1 - normalY) * v.h / n.h };
        }
        else {
          const offset = (v.h - n.h * v.w / n.w) / 2;
          resultPoint = { x: (normalX + 1) * v.w / n.w, y: offset + (1 - normalY) * v.w / n.w };
        }
        return resultPoint;
      },
      toNormal(viewportX, viewportY) {
        const v = this.viewport;
        const n = this.normal;
        if (v.w / v.h >= n.w / n.h) {
          const offset = (v.w - n.w * v.h / n.h) / 2;
          return { x: (viewportX - offset) * n.h / v.h - 1, y: 1 - viewportY * n.h / v.h };
        }
        const offset = (v.h - n.h * v.w / n.w) / 2;
        return { x: n.w / v.w * viewportX - 1, y: (offset - viewportY) * n.w / v.w + 1 };
      },
      getNormalRectangle() {
        const topLeftPoint = this.toNormal(0, 0);
        const bottomRightPoint = this.toNormal(this.viewport.w, this.viewport.h);
        return {
          'left': topLeftPoint.x,
          'top': topLeftPoint.y,
          'right': bottomRightPoint.x,
          'bottom': bottomRightPoint.y,
        };
      },
      unitsCoef() {
        if (this.viewport.w / this.viewport.h >= this.normal.w / this.normal.h) {
          return this.viewport.h / this.normal.h;
        }
        return this.viewport.w / this.normal.w;
      }
    }
    this.textView = {
      "viewportOffset": 5,
      "avgViewportWidth": 40,
      "avgViewportHeight": 10,
    };

    this.currentMode = Scene.Modes.PointsCloudEditing;
    this.settings = new Settings(this);
    this.pointsCloud = new PointsCloud();
    this.pointsCloud.genRandPoints();
    this.axisNormalOffset = 0.07;
    this.axisData = {
      "vertical": {
        "viewportLength": (this.extends.normal.h - 2 * this.axisNormalOffset) * this.extends.unitsCoef(),
        "start": this.extends.toViewport(0, 1 - this.axisNormalOffset),
      },
      "horizontal": {
        "viewportLength": (this.extends.normal.w - 3 * this.axisNormalOffset) * this.extends.unitsCoef(),
        "start": this.extends.toViewport(-1 + this.axisNormalOffset, -1 + this.axisNormalOffset),
      },
    };
    const verticalAxisNormalLength = this.extends.normal.h - 2 * this.axisNormalOffset;
    this.normalOffset = 0.4 * verticalAxisNormalLength / this.settings["axis-length"];
    this.quadrangleCut = new QuadrangleCut(this.normalOffset);
    this.isHorizontalAxisSelected = false;
    this.hasBeenClickTouched = false;
    this.pointHasBeenDeleted = false;
  }

  async constructorShard() {
    const innerConvexHull = ConvexHull.create(this.pointsCloud.getPoints()).getPolygon();
    this.normalRoundedConvexHull = new RoundedConvexHull(innerConvexHull, this.normalOffset);
    await this.quadrangleCut.reloadCut(
      this.normalRoundedConvexHull,
      new QuadrangleBuildSettings()
    );
    this.setKonvaInitialObjects();
    this.target = null;
  }
  setKonvaInitialObjects() {
    let stage = new Konva.Stage({
      container: 'viewport',
      width: this.extends.viewport.w,
      height: this.extends.viewport.h,
    });

    for (const layer in this.konvaStrategy.layers) {
      stage.add(this.konvaStrategy.layers[layer]);
    }

    this.setBackground();
    this.setAxes();
    const innerConvexHull = this.setConvexHull(Color.blue);
    this.setRoundedOuterConvexHull(innerConvexHull, Color.grey);
    this.setCursor();
    this.setPointsCloud();
    this.setQuadrangleCutMetrics();
    this.setQuadrangleCut();
    this.setFlap();
  }

  generateBackgroundGrid(normalStep) {
    const layer = this.konvaStrategy.layers.background;
    const w = this.extends.viewport.w;
    const h = this.extends.viewport.h;
    const viewportStep = normalStep * this.extends.unitsCoef();
    const o = this.extends.toViewport(0, 0);
    let gridLines = this.konvaStrategy.changeableObjectsStorage.gridLines;
    for (let i = 0; o.x + i * viewportStep <= w; i++) {
      var gridLine = new Konva.Line({
        points: [o.x + i * viewportStep, 0, o.x + i * viewportStep, h],
        stroke: Color.grey,
        strokeWidth: 1,
      });
      layer.add(gridLine);
      gridLines.push(gridLine);
    }
    for (let i = 1; o.x - i * viewportStep >= 0; i++) {
      var gridLine = new Konva.Line({
        points: [o.x - i * viewportStep, 0, o.x - i * viewportStep, h],
        stroke: Color.grey,
        strokeWidth: 1,
      });
      layer.add(gridLine);
      gridLines.push(gridLine);
    }
    for (let i = 0; o.y + i * viewportStep <= h; i++) {
      var gridLine = new Konva.Line({
        points: [0, o.y + i * viewportStep, w, o.y + i * viewportStep],
        stroke: Color.grey,
        strokeWidth: 1,
      });
      layer.add(gridLine);
      gridLines.push(gridLine);
    }
    for (let i = 1; o.y - i * viewportStep >= 0; i++) {
      layer.add(gridLine);
      var gridLine = new Konva.Line({
        points: [0, o.y - i * viewportStep, w, o.y - i * viewportStep],
        stroke: Color.grey,
        strokeWidth: 1,
      });
      layer.add(gridLine);
      gridLines.push(gridLine);
    }
  }

  setBackground() {
    this.konvaStrategy.layers.background.add(
      new Konva.Rect({
        x: 0,
        y: 0,
        width: this.extends.viewport.w,
        height: this.extends.viewport.h,
        // fill: 'white',
        stroke: 'black',
        strokeWidth: 2,
      })
    );
    this.generateBackgroundGrid(this.settings["grid-step"]);
  }

  setAxes() {
    const layer = this.konvaStrategy.layers.middle;
    const axesLabels = this.konvaStrategy.changeableObjectsStorage.metrics.axesLabels;
    let data = this.axisData;
    var verticalAxis = new Konva.Line({
      points: [
        data.vertical.start.x, data.vertical.start.y,
        data.vertical.start.x, data.vertical.start.y + data.vertical.viewportLength
      ],
      stroke: Color.black,
      strokeWidth: 3,
    });
    layer.add(verticalAxis);
    let divisions = {
      7: [0, 0.5, 1],
      5: [1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6, 1]
    };
    for (let key in divisions) {
      const divisionWidth = Number.parseInt(key) * this.extends.unitsCoef() / 400;
      for (let position of divisions[key]) {
        let division = new Konva.Line({
          points: [
            data.vertical.start.x - divisionWidth, data.vertical.start.y + data.vertical.viewportLength * position,
            data.vertical.start.x + divisionWidth, data.vertical.start.y + data.vertical.viewportLength * position
          ],
          stroke: Color.black,
          strokeWidth: divisionWidth,
        });
        layer.add(division);
      }
    }
    let fontHeight = Math.round(this.extends.unitsCoef() * (this.axisNormalOffset - 0.02));
    let fontWidth = 2.25 * fontHeight;
    axesLabels.top = new Konva.Text({
      x: data.vertical.start.x - fontWidth / 2,
      y: data.vertical.start.y - fontHeight - 5,
      text: `${this.settings["axis-length"]} см`,
      fontSize: fontHeight,
      fontFamily: 'Calibri',
      fill: 'black',
    });
    layer.add(axesLabels.top);

    var horizontalAxis = new Konva.Line({
      points: [
        data.horizontal.start.x, data.horizontal.start.y,
        data.horizontal.start.x + data.horizontal.viewportLength, data.horizontal.start.y
      ],
      stroke: Color.black,
      strokeWidth: 3,
    });
    layer.add(horizontalAxis);
    this.konvaStrategy.changeableObjectsStorage.horizontalAxis.line = horizontalAxis;
    divisions = {
      7: [0, 2 / 6, 4 / 6, 1],
      5: [2 / 18, 4 / 18, 8 / 18, 10 / 18, 14 / 18, 16 / 18]
    };
    for (let key in divisions) {
      const divisionHeight = Number.parseInt(key) * this.extends.unitsCoef() / 400;
      for (let position of divisions[key]) {
        let division = new Konva.Line({
          points: [
            data.horizontal.start.x + data.horizontal.viewportLength * position, data.horizontal.start.y - divisionHeight,
            data.horizontal.start.x + data.horizontal.viewportLength * position, data.horizontal.start.y + divisionHeight
          ],
          stroke: Color.black,
          strokeWidth: divisionHeight,
        });
        layer.add(division);
        this.konvaStrategy.changeableObjectsStorage.horizontalAxis.divisions[key].push(division);
      }
    }
    var v = this.settings["axis-length"];
    axesLabels.right = new Konva.Text({
      x: data.horizontal.start.x + data.horizontal.viewportLength - fontWidth / 2,
      y: data.horizontal.start.y - fontHeight - 5,
      text: `${v.toFixed(0)} см`,
      fontSize: fontHeight,
      fontFamily: 'Calibri',
      fill: 'black',
    });
    layer.add(axesLabels.right);
    axesLabels.left = axesLabels.right.clone();
    axesLabels.left.x(data.horizontal.start.x - fontWidth / 3);
    v = this.settings["axis-length"] / 2;
    axesLabels.left.text(`${v.toFixed(0)} см`);
    layer.add(axesLabels.left);
  }

  dragWholeHorizontalAxisObjects(e) {
    const viewportMouseCoords = this.extractViewportCoords(e);
    const verticalAxisData = this.axisData.vertical;
    const limitsPx = {
      min: verticalAxisData.start.y,
      max: verticalAxisData.start.y + verticalAxisData.viewportLength,
    };
    if (viewportMouseCoords.y <= limitsPx.min || viewportMouseCoords.y >= limitsPx.max) {
      console.log("dragWholeHorizontalAxisObjects: mouse over limits");
      return;
    }
    const horizontalAxis = this.konvaStrategy.changeableObjectsStorage.horizontalAxis;
    let points = horizontalAxis.line.points();
    points[1] = viewportMouseCoords.y;
    points[3] = viewportMouseCoords.y;
    horizontalAxis.line.points(points);
    horizontalAxis.line.draw();
    for (let key in horizontalAxis.divisions) {
      const divisionHeight = Number.parseInt(key) * this.extends.unitsCoef() / 400;
      for (const division of horizontalAxis.divisions[key]) {
        points = division.points();
        points[1] = viewportMouseCoords.y - divisionHeight;
        points[3] = viewportMouseCoords.y + divisionHeight;
        division.points(points);
        division.draw();
      }
    }
    const metrics = this.konvaStrategy.changeableObjectsStorage.metrics.axesLabels;
    let fontHeight = Math.round(this.extends.unitsCoef() * (this.axisNormalOffset - 0.02));
    metrics.left.y(viewportMouseCoords.y - fontHeight - 5);
    metrics.left.draw();
    metrics.right.y(viewportMouseCoords.y - fontHeight - 5);
    metrics.right.draw();
    this.axisData.horizontal.start.y = viewportMouseCoords.y;
  }

  setConvexHull(color) {
    const storage = this.konvaStrategy.changeableObjectsStorage;
    const convhull = ConvexHull.create(this.pointsCloud.getPoints()).getPolygon();

    let vertices = convhull.getListVertices().map(vertex => this.extends.toViewport(vertex.x, vertex.y));
    let points = [];
    for (const vertex of vertices) {
      points.push(vertex.x);
      points.push(vertex.y);
    }
    storage.innerConvexHull = new Konva.Line({
      points: points,
      stroke: color,
      strokeWidth: this.settings['lines-width'] * 0.5,
      closed: true,
      visible: false,
    });
    this.konvaStrategy.layers.background.add(storage.innerConvexHull);
    return convhull;
  }

  setRoundedOuterConvexHull(innerConvexHull, color) {
    const representation = this.konvaStrategy.changeableObjectsStorage.roundedOuterConvexHull;
    const roundedConvexHull = this.normalRoundedConvexHull = new RoundedConvexHull(innerConvexHull, this.normalOffset);
    for (let i = 0; i < roundedConvexHull.segments.length; i++) {
      const segment = roundedConvexHull.segments[i];
      const viewportStartPoint = this.extends.toViewport(segment.startPoint.x, segment.startPoint.y);
      const viewportEndPoint = this.extends.toViewport(segment.endPoint.x, segment.endPoint.y);
      const line = new Konva.Line({
        points: [
          viewportStartPoint.x, viewportStartPoint.y,
          viewportEndPoint.x, viewportEndPoint.y,
        ],
        stroke: color,
        strokeWidth: this.settings['lines-width'] * 0.5,
        visible: false,
      })
      representation.lines.push(line);
      this.konvaStrategy.layers.middle.add(line);

      const arcPoints = roundedConvexHull.arcs[(i + 1) % roundedConvexHull.arcs.length];
      const radius = Math.sqrt(
        (arcPoints.startPoint.x - arcPoints.center.x) * (arcPoints.startPoint.x - arcPoints.center.x)
        + (arcPoints.startPoint.y - arcPoints.center.y) * (arcPoints.startPoint.y - arcPoints.center.y)
      ) * this.extends.unitsCoef();
      const viewportCenter = this.extends.toViewport(arcPoints.center.x, arcPoints.center.y);
      const v1 = {
        x: arcPoints.startPoint.x - arcPoints.center.x,
        y: arcPoints.startPoint.y - arcPoints.center.y,
      };
      const v2 = {
        x: arcPoints.endPoint.x - arcPoints.center.x,
        y: arcPoints.endPoint.y - arcPoints.center.y,
      };
      const angle = calcAngle360Between(v1, v2);
      const rotation = -Math.atan2(v2.y, v2.x) * 180 / Math.PI;
      const arc = new Konva.Arc({
        x: viewportCenter.x,
        y: viewportCenter.y,
        innerRadius: radius,
        outerRadius: radius,
        angle: angle,
        rotation: rotation,
        stroke: Color.grey,
        strokeWidth: this.settings['lines-width'] * 0.5,
        visible: false,
        // fill: 'yellow',
      });
      representation.arcs.push(arc);
      this.konvaStrategy.layers.background.add(arc);
    }
  }

  setPointsCloud() {
    this.pointsCloud.getPoints().forEach(normalCoords => {
      let viewportCoords = this.extends.toViewport(normalCoords.x, normalCoords.y);
      this.buildPointCloudRepresentation(viewportCoords);
    });
    let viewport = document.getElementById("viewport");
    viewport.addEventListener("mousedown", (e) => this.handleClickTouch(e));
    viewport.addEventListener("touchstart", (e) => this.handleClickTouch(e));
    viewport.addEventListener("mousemove", (e) => this.onViewportMouseTouchMove(e));
    viewport.addEventListener("touchmove", (e) => this.onViewportMouseTouchMove(e));
    document.getElementById("trash-can-icon").addEventListener("mouseup", (e) => this.deleteTargetPointCloud(e));
    viewport.addEventListener("mouseup", (e) => this.onViewportMouseUpTouchEnd(e));
    viewport.addEventListener("touchend", (e) => this.onViewportMouseUpTouchEnd(e));
  }

  buildPointCloudRepresentation(viewportCoords) {
    const point = new Konva.Circle({
      x: viewportCoords.x,
      y: viewportCoords.y,
      radius: this.settings["input-points-radius"],
      fill: Color.blue,
      stroke: 'black',
      strokeWidth: 1,
      // draggable: true,
    });
    point.on("mousedown touchstart", (e) => this.onExistingPointClickTouch(e));
    this.konvaStrategy.layers.front.add(point);
    this.konvaStrategy.changeableObjectsStorage.pointsCloud.push(point);

    // const offsetRadius = this.quadrangleCut.offset * this.extends.unitsCoef();
    // const offsetCircle = new Konva.Circle({
    //   x: viewportCoords.x,
    //   y: viewportCoords.y,
    //   radius: this.settings["input-points-radius"] + offsetRadius - 7,
    //   fill: Color.blue,
    //   opacity: 0.25,
    //   // stroke: 'black',
    //   // strokeWidth: 1,
    // });
    // this.konvaStrategy.layers.middle.add(offsetCircle);

    return point;
  }

  handleClickTouch(e) {
    if (this.currentMode == Scene.Modes.QuadrangleEditing)
      return;

    this.hasBeenClickTouched = true;
    if (this.target == null) {
      if (this.horizontalAxisHasBeenSelected(e)) {
        console.log(`horizontal axis has been selected`);
        this.isHorizontalAxisSelected = true;
        return;
      }
      this.addPoint(e);
      this.hasBeenClickTouched = false;
    }
    console.log(`An existing point has been moved`);
  }

  horizontalAxisHasBeenSelected(e) {
    const viewportMouseCoords = this.extractViewportCoords(e);
    const axisOffsetPx = 10;
    return Math.abs(viewportMouseCoords.y - this.axisData.horizontal.start.y) < axisOffsetPx;
  }

  extractViewportCoords(e) {
    let viewportCoords = { x: undefined, y: undefined };
    if (e instanceof MouseEvent) {
      viewportCoords.x = e.offsetX;
      viewportCoords.y = e.offsetY;
    }
    else if (e instanceof TouchEvent) {
      viewportCoords.x = e.touches[0].clientX;
      viewportCoords.y = e.touches[0].clientY;
    }
    else {
      console.log("Unexpected event", e);
    }
    return viewportCoords;
  }

  addPoint(e) {
    const viewportCoords = this.extractViewportCoords(e);
    this.buildPointCloudRepresentation(viewportCoords);
    this.pointsCloud.add(
      this.extends.toNormal(viewportCoords.x, viewportCoords.y)
    )
    console.log("Point has been added ", viewportCoords);
    return;
  }

  onExistingPointClickTouch(e) {
    if (this.currentMode == Scene.Modes.QuadrangleEditing)
      return;

    this.target = this.findPointCloud(e.currentTarget);
    console.log(`Point has been found ${this.target}`);
    if (this.target == null)
      return;

    let point = this.konvaStrategy.changeableObjectsStorage.pointsCloud[this.target];
    if (e.evt instanceof MouseEvent) {
      this.movePoint(point, { x: e.evt.offsetX, y: e.evt.offsetY });
    }
    else if (e.evt instanceof TouchEvent) {
      var rect = document.getElementById("viewport").getBoundingClientRect();
      this.movePoint(point, { x: e.evt.touches[0].pageX - rect.left, y: e.evt.touches[0].pageY - rect.top });
    }
    else {
      console.log("Unexpected event ", e.evt);
    }
  }

  findPointCloud(point) {
    let targetIndex = 0;
    const pointsCloud = this.konvaStrategy.changeableObjectsStorage.pointsCloud;
    while (pointsCloud[targetIndex] != point) {
      targetIndex++;
      if (targetIndex >= pointsCloud.length) {
        console.log("Point does not found");
        return null;
      }
    }
    return targetIndex;
  }

  onViewportMouseTouchMove(e) {
    if (this.pointHasBeenDeleted) {
      this.pointHasBeenDeleted = false;
      return;
    }

    if (!this.hasBeenClickTouched)
      return;

    if (this.currentMode == Scene.Modes.QuadrangleEditing)
      return;
    else if (this.target == null && !this.isHorizontalAxisSelected) {
      this.addPoint(e);
      return;
    }
    else if (this.target == null && this.isHorizontalAxisSelected) {
      this.dragWholeHorizontalAxisObjects(e);
      return;
    }

    let point = this.konvaStrategy.changeableObjectsStorage.pointsCloud[this.target];
    if (e instanceof MouseEvent) {
      this.movePoint(point, { x: e.offsetX, y: e.offsetY });
    }
    else if (e instanceof TouchEvent) {
      var rect = document.getElementById("viewport").getBoundingClientRect();
      this.movePoint(point, { x: e.touches[0].pageX - rect.left, y: e.touches[0].pageY - rect.top });
    }
    else {
      console.log("Unexpected event ", e.evt);
    }
  }

  movePoint(point, newViewportCoords) {
    point.x(newViewportCoords.x);
    point.y(newViewportCoords.y);
    point.draw();
  }

  onViewportMouseUpTouchEnd(e) {
    const newCoords = { x: undefined, y: undefined };
    if (e instanceof TouchEvent) {
      newCoords.x = e.changedTouches[0].pageX;
      newCoords.y = e.changedTouches[0].pageY
    }
    else if (e instanceof MouseEvent) {
      newCoords.x = e.pageX;
      newCoords.x = e.pageY;
    }
    const isInsideTrashCan = (x, y) => {
      const trashCan = document.getElementById("trash-can-icon");
      return x > trashCan.x && x < trashCan.x + trashCan.width
        && y > trashCan.y && y < trashCan.y + trashCan.height;
    }
    if (isInsideTrashCan(newCoords.x, newCoords.y)) {
      this.deleteTargetPointCloud(e);
      return;
    }

    this.hasBeenClickTouched = false;
    this.isHorizontalAxisSelected = false;
    if (this.target == null || this.currentMode == Scene.Modes.QuadrangleEditing)
      return;

    const circle = this.konvaStrategy.changeableObjectsStorage.pointsCloud[this.target];
    this.pointsCloud.movePoint(this.target, this.extends.toNormal(circle.x(), circle.y()));
    this.target = null;
  }

  deleteTargetPointCloud(e) {
    if (this.target == null)
      return;

    const pointsCloud = this.konvaStrategy.changeableObjectsStorage.pointsCloud;
    const point = pointsCloud[this.target];
    point.destroy();
    this.konvaStrategy.layers.front.draw();
    pointsCloud.splice(this.target, 1);
    this.pointsCloud.remove(this.target);
    this.target = null;
    this.pointHasBeenDeleted = true;
    this.hasBeenClickTouched = false;
    console.log("Point has been removed");
  }

  setCursor() {
    viewport.classList.add("crosshair-cursor");
    let cursorDistances = this.konvaStrategy.changeableObjectsStorage.cursorDistances;
    cursorDistances.vertical.line = new Konva.Line({
      stroke: 'black',
      strokeWidth: 1,
      dash: [10, 10],
    });
    cursorDistances.vertical.text = new Konva.Text({
      fontSize: 14,
      fill: 'gray',
      fontStyle: 'bold',
    });
    cursorDistances.horizontal.line = cursorDistances.vertical.line.clone();
    cursorDistances.horizontal.text = cursorDistances.vertical.text.clone();
    for (let distance in cursorDistances) {
      for (let objType in cursorDistances[distance]) {
        const obj = cursorDistances[distance][objType];
        this.konvaStrategy.layers.middle.add(obj);
      }
    }
    viewport.addEventListener("mousemove", (e) => this.onCursorMove(e));
  }

  onCursorMove(e) {
    const distanceCoef = this.settings["axis-length"] / this.axisData.vertical.viewportLength;
    const axisCenter = this.extends.toViewport(0, -1 + this.axisNormalOffset);
    axisCenter.y = this.axisData.horizontal.start.y;
    const visible = this.settings["are-metrics-shown"] && this.currentMode == Scene.Modes.PointsCloudEditing;
    let cursorDistances = this.konvaStrategy.changeableObjectsStorage.cursorDistances;
    cursorDistances.vertical.line.points([
      e.offsetX, e.offsetY,
      e.offsetX, axisCenter.y,
    ]);
    cursorDistances.vertical.line.visible(visible);
    cursorDistances.vertical.line.draw();
    cursorDistances.vertical.text.x(e.offsetX + 5);
    cursorDistances.vertical.text.y((axisCenter.y + e.offsetY - this.textView.avgViewportHeight) / 2);
    cursorDistances.vertical.text.text(`${(Math.abs(e.offsetY - axisCenter.y) * distanceCoef).toFixed(1)} см`);
    cursorDistances.vertical.text.visible(visible);
    cursorDistances.vertical.text.draw();

    cursorDistances.horizontal.line.points([
      e.offsetX, e.offsetY,
      axisCenter.x, e.offsetY,
    ]);
    cursorDistances.horizontal.line.visible(visible);
    cursorDistances.horizontal.line.draw();
    cursorDistances.horizontal.text.x((axisCenter.x + e.offsetX - this.textView.avgViewportWidth) / 2);
    cursorDistances.horizontal.text.y(e.offsetY + 5);
    cursorDistances.horizontal.text.text(`${(Math.abs(e.offsetX - axisCenter.x) * distanceCoef).toFixed(1)} см`);
    cursorDistances.horizontal.text.visible(visible);
    cursorDistances.horizontal.text.draw();
  }

  setQuadrangleCutMetrics() {
    const normalVertices = this.quadrangleCut.getVertices();
    const viewportVertices = normalVertices.map(vertex => this.extends.toViewport(vertex.x, vertex.y));
    const quadrangleLinesLength = this.konvaStrategy.changeableObjectsStorage.metrics.quadrangleLinesLength;
    for (let i = normalVertices.length - 1; i < 2 * normalVertices.length - 1; i++) {
      const anglePoints = [];
      for (let j = 0; j < 3; j++) {
        anglePoints.push(normalVertices[(i - 1 + j) % normalVertices.length]);
      }
      this.setAngle(anglePoints[0], anglePoints[1], anglePoints[2]);

      const lengthMetric = this.setLengthMetric(viewportVertices[i % viewportVertices.length], viewportVertices[(i + 1) % viewportVertices.length]);
      quadrangleLinesLength.push(lengthMetric);
    }
  }

  setLengthMetric(startPoint, endPoint) {
    const data = this.buildLengthMetricData(startPoint, endPoint);
    const arrowLine = new Konva.Arrow({
      points: data.points,
      fill: 'black',
      stroke: 'black',
      strokeWidth: 1,
      pointerAtBeginning: true,
      pointerAtEnding: true,
      pointerLength: 10,
      pointerWidth: 10,
      visible: false,
    });
    const text = new Konva.Text({
      x: data.textAnchor.x,
      y: data.textAnchor.y,
      text: data.textValue,
      fontSize: 14,
      fontStyle: 'bold',
      fill: 'gray',
      visible: false,
    });
    this.konvaStrategy.layers.background.add(arrowLine, text);
    return {
      "arrowLine": arrowLine,
      "text": text,
    };
  }

  buildLengthMetricData(startPoint, endPoint) {
    const vector = { x: startPoint.y - endPoint.y, y: endPoint.x - startPoint.x };
    const a = this.settings["quadrangle-vertices-radius"] * 2;
    const d = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    vector.x *= a / d;
    vector.y *= a / d;
    const points = [
      startPoint.x + vector.x, startPoint.y + vector.y,
      endPoint.x + vector.x, endPoint.y + vector.y
    ];
    const offset = 5;
    const distance = Math.sqrt((points[2] - points[0]) * (points[2] - points[0]) + (points[3] - points[1]) * (points[3] - points[1]))
      / this.extends.unitsCoef() * this.settings["axis-length"];
    return {
      "points": points,
      "textValue": `${distance.toFixed(1)} см`,
      "textAnchor": {
        x: (points[0] + points[2]) / 2 + (vector.x < 0 ? -offset - this.textView["avgViewportWidth"] : offset),
        y: (points[1] + points[3]) / 2 + (vector.y < 0 ? -offset - this.textView["avgViewportHeight"] : offset)
      }
    }
  }

  setAngle(a, b, c) {
    const angle = new ViewportAngle(a, b, c);
    let wedgeParams = angle.getWedgeParams();
    wedgeParams.radius *= this.extends.unitsCoef();
    const wedgeCenter = this.extends.toViewport(wedgeParams.x, wedgeParams.y);
    wedgeParams.x = wedgeCenter.x;
    wedgeParams.y = wedgeCenter.y;
    wedgeParams.visible = false;
    const wedge = new Konva.Wedge(wedgeParams);
    const angleTextParams = angle.getTextParams();
    const viewportAnchor = this.extends.toViewport(angleTextParams.x, angleTextParams.y);
    angleTextParams.x = viewportAnchor.x;
    angleTextParams.y = viewportAnchor.y;
    angleTextParams.visible = false;
    const text = new Konva.Text(angleTextParams);
    this.konvaStrategy.layers.front.add(wedge, text);
    this.konvaStrategy.changeableObjectsStorage.metrics.quadrangleAngles.push({
      wedge: wedge,
      text: text
    });
  }

  setQuadrangleCut() {
    let vertices = this.quadrangleCut.getVertices().map(vertex => this.extends.toViewport(vertex.x, vertex.y));
    const frontLayer = this.konvaStrategy.layers.front;
    const middleLayer = this.konvaStrategy.layers.middle;
    const quadrangleRepresentation = this.konvaStrategy.changeableObjectsStorage.quadrangle;
    for (let i = vertices.length - 1; i < 2 * vertices.length - 1; i++) {
      var startVertex = vertices[i % vertices.length];
      var endVertex = vertices[(i + 1) % vertices.length];
      var quadrangleSide = new Konva.Line({
        points: [
          startVertex.x, startVertex.y,
          endVertex.x, endVertex.y
        ],
        stroke: Color.green,
        strokeWidth: this.settings["lines-width"],
        visible: false
      });
      quadrangleRepresentation.lines.push(quadrangleSide);
      middleLayer.add(quadrangleSide);
    }

    for (let i = 0; i < vertices.length; i++) {
      var vertex = vertices[i];
      var circle = new Konva.Circle({
        x: vertex.x,
        y: vertex.y,
        radius: this.settings["quadrangle-vertices-radius"],
        fill: Color.darkGreen,
        stroke: 'black',
        strokeWidth: 1,
        draggable: true,
        visible: false
      });
      circle.on("dragstart", () => this.target = i);
      circle.on("dragmove", (e) => this.onVertexMove(e));
      circle.on("dragend", () => this.target = null);
      quadrangleRepresentation.vertices.push(circle);
      frontLayer.add(circle);
    }
  }

  onVertexMove(e) {
    if (this.target == null)
      return;

    const quadrangleRepresentation = this.konvaStrategy.changeableObjectsStorage.quadrangle;
    const vertices = quadrangleRepresentation.vertices;
    const lines = quadrangleRepresentation.lines;
    const targetCircle = vertices[this.target];
    const firstLine = lines[this.target];
    const firstLinePoints = firstLine.points();
    const secondLine = lines[(this.target + 1) % lines.length];
    const secondLinePoints = secondLine.points();
    firstLine.points([firstLinePoints[0], firstLinePoints[1], targetCircle.x(), targetCircle.y()]);
    firstLine.draw();
    secondLine.points([targetCircle.x(), targetCircle.y(), secondLinePoints[2], secondLinePoints[3]]);
    secondLine.draw();
    const normalVertex = this.extends.toNormal(targetCircle.x(), targetCircle.y());
    this.quadrangleCut.moveVertex(this.target, normalVertex);
    this.updateVertexDistances(firstLine.points(), secondLine.points());

    const lineColor = this.quadrangleCut.isValid(this.normalRoundedConvexHull) ? Color.green : Color.red;
    for (const line of lines) {
      line.stroke(lineColor);
      line.draw();
    }
    for (const vertex of vertices)
      vertex.draw();

    this.updateAngles();
    this.updateFlap(true);
  }

  updateAngles() {
    const vertices = this.quadrangleCut.getVertices();
    const quadrangleAngles = this.konvaStrategy.changeableObjectsStorage.metrics.quadrangleAngles;
    const start = vertices.length;
    for (let i = start; i < start + vertices.length; i++) {
      this.updateAngle(
        quadrangleAngles[i % vertices.length],
        new ViewportAngle(
          vertices[(i - 1) % vertices.length],
          vertices[i % vertices.length],
          vertices[(i + 1) % vertices.length],
        )
      );
    }
    this.konvaStrategy.layers.middle.draw();
  }

  updateAngle(targetAngle, newViewportAngle) {
    const wedgeParams = newViewportAngle.getWedgeParams();
    wedgeParams.radius *= this.viewportSide;
    const wedgeCenter = this.extends.toViewport(wedgeParams.x, wedgeParams.y);
    const wedge = targetAngle.wedge;
    wedge.x(wedgeCenter.x);
    wedge.y(wedgeCenter.y);
    wedge.angle(wedgeParams.angle);
    wedge.rotation(wedgeParams.rotation);
    wedge.visible(this.settings["are-metrics-shown"] && this.currentMode == Scene.Modes.QuadrangleEditing);

    const angleTextParams = newViewportAngle.getTextParams()
    const viewportAnchor = this.extends.toViewport(angleTextParams.x, angleTextParams.y);
    let text = targetAngle.text;
    text.x(viewportAnchor.x);
    text.y(viewportAnchor.y);
    text.text(angleTextParams.text);
    text.visible(this.settings["are-metrics-shown"] && this.currentMode == Scene.Modes.QuadrangleEditing);
  }

  updateFlap(updatePosition) {
    const normalPoints = this.quadrangleCut.getRestCut();
    const color = normalPoints == null ? Color.red : Color.blue;
    const flapLines = this.konvaStrategy.changeableObjectsStorage.flapLines;
    const metrics = this.konvaStrategy.changeableObjectsStorage.metrics;
    const visible = this.settings["are-metrics-shown"] && this.currentMode == Scene.Modes.QuadrangleEditing;
    for (let i = 0; i < flapLines.length; i++) {
      flapLines[i].stroke(color);
      flapLines[i].visible(this.currentMode == Scene.Modes.QuadrangleEditing);
      metrics.flapLinesLength[i].arrowLine.visible(visible);
      metrics.flapLinesLength[i].text.visible(visible);
    }
    if (normalPoints == null)
      return;

    metrics.flapAngle.wedge.visible(visible);
    metrics.flapAngle.text.visible(visible);
    if (updatePosition) {
      const angle = new ViewportAngle(
        normalPoints[0],
        normalPoints[1],
        normalPoints[2]
      );
      const wedgeParams = angle.getWedgeParams();
      const wedgeCenter = this.extends.toViewport(wedgeParams.x, wedgeParams.y);
      metrics.flapAngle.wedge.x(wedgeCenter.x);
      metrics.flapAngle.wedge.y(wedgeCenter.y);
      metrics.flapAngle.wedge.angle(wedgeParams.angle);
      metrics.flapAngle.wedge.rotation(wedgeParams.rotation);

      const angleTextParams = angle.getTextParams();
      const viewportAnchor = this.extends.toViewport(angleTextParams.x, angleTextParams.y);
      metrics.flapAngle.text.x(viewportAnchor.x);
      metrics.flapAngle.text.y(viewportAnchor.y);
      metrics.flapAngle.text.text(angleTextParams.text);

      const viewportPoints = normalPoints.map(vertex => this.extends.toViewport(vertex.x, vertex.y));
      for (let i = 0; i < flapLines.length; i++) {
        flapLines[i].points([
          viewportPoints[i].x, viewportPoints[i].y,
          viewportPoints[i + 1].x, viewportPoints[i + 1].y,
        ]);
        this.updateDistance(metrics.flapLinesLength[i], flapLines[i].points());
      }
      this.konvaStrategy.layers.background.draw();
    }

    this.konvaStrategy.layers.middle.draw();
  }

  updateVertexDistances(firstLinePoints, secondLinePoints) {
    const quadrangleDistances = this.konvaStrategy.changeableObjectsStorage.metrics.quadrangleLinesLength;
    this.updateDistance(quadrangleDistances[this.target], firstLinePoints);
    this.updateDistance(quadrangleDistances[(this.target + 1) % quadrangleDistances.length], secondLinePoints);
  }

  updateDistance(distance, segmentPoints) {
    let data = this.buildLengthMetricData(
      { x: segmentPoints[0], y: segmentPoints[1] },
      { x: segmentPoints[2], y: segmentPoints[3] });
    distance.arrowLine.points(data.points);
    distance.arrowLine.draw();
    distance.text.text(data.textValue);
    distance.text.x(data.textAnchor.x);
    distance.text.y(data.textAnchor.y);
    distance.text.draw();
  }

  setFlap() {
    const normalPoints = this.quadrangleCut.getRestCut();
    const viewportPoints = normalPoints.map(vertex => this.extends.toViewport(vertex.x, vertex.y));
    const flapLines = this.konvaStrategy.changeableObjectsStorage.flapLines;
    const metrics = this.konvaStrategy.changeableObjectsStorage.metrics;
    for (let i = 0; i < 2; i++) {
      const points = [
        viewportPoints[i].x, viewportPoints[i].y,
        viewportPoints[i + 1].x, viewportPoints[i + 1].y,
      ];
      flapLines.push(
        new Konva.Line({
          points: points,
          visible: false,
          stroke: Color.blue,
          strokeWidth: this.settings["lines-width"],
        })
      );
      this.konvaStrategy.layers.middle.add(flapLines[i]);

      const item = this.setLengthMetric(viewportPoints[i], viewportPoints[i + 1]);
      metrics.flapLinesLength.push(item);
      this.konvaStrategy.layers.middle.add(item.arrowLine, item.text);
    }

    const angle = new ViewportAngle(
      normalPoints[0],
      normalPoints[1],
      normalPoints[2]
    );
    const wedgeParams = angle.getWedgeParams();
    const wedgeCenter = this.extends.toViewport(wedgeParams.x, wedgeParams.y);
    wedgeParams.x = wedgeCenter.x;
    wedgeParams.y = wedgeCenter.y;
    wedgeParams.radius *= this.extends.unitsCoef();
    metrics.flapAngle.wedge = new Konva.Wedge(wedgeParams);

    const angleTextParams = angle.getTextParams();
    const viewportAnchor = this.extends.toViewport(angleTextParams.x, angleTextParams.y);
    angleTextParams.x = viewportAnchor.x;
    angleTextParams.y = viewportAnchor.y;
    metrics.flapAngle.text = new Konva.Text(angleTextParams);

    this.konvaStrategy.layers.middle.add(metrics.flapAngle.wedge, metrics.flapAngle.text);
  }

  changeGridStep(newValue) {
    this.settings['grid-step'] = newValue;
    let gridLines = this.konvaStrategy.changeableObjectsStorage.gridLines;
    for (const line of gridLines) {
      line.destroy();
    }
    gridLines = [];
    this.generateBackgroundGrid(newValue);
    this.updateConvexHull(this.currentMode == Scene.Modes.QuadrangleEditing);
    this.updateAngles();
    this.updateFlap();
    this.updateVertexDistances();
  }

  changeRadiusOfPointsCloud(newValue) {
    this.settings['input-points-radius'] = newValue;
    let pointsCloudRepresentation = this.konvaStrategy.changeableObjectsStorage.pointsCloud;
    for (let point of pointsCloudRepresentation) {
      point.radius(newValue);
      point.draw();
    }
  }

  changeQuadrangleVerticesRadius(newValue) {
    this.settings['quadrangle-vertices-radius'] = newValue;
    const konvaVertices = this.konvaStrategy.changeableObjectsStorage.quadrangle.vertices;
    for (const circle of konvaVertices) {
      circle.radius(newValue);
      circle.draw();
    }
  }

  changeQuadrangleLineType(newValue) {
    const width = this.settings["lines-width"];
    const lineType = newValue;
    const quadrangle = this.konvaStrategy.changeableObjectsStorage.quadrangle;
    const dash = lineType == Scene.LineTypes.Solid ? null : [20 + 2 * width, 20 + 2 * width];
    for (const line of quadrangle.lines) {
      line.dash(dash);
      line.draw();
    }
    for (const circle of quadrangle.vertices)
      circle.draw();
  }

  changeLinesWidth(newValue) {
    this.settings['lines-width'] = newValue;
    const quadrangle = this.konvaStrategy.changeableObjectsStorage.quadrangle;
    for (const line of quadrangle.lines) {
      line.strokeWidth(newValue);
      line.draw();
    }
    for (const circle of quadrangle.vertices)
      circle.draw();
  }

  changeAxesLength(newValue) {
    this.settings['axis-length'] = newValue;
    const verticalAxisNormalLength = this.extends.normal.h - 2 * this.axisNormalOffset;
    this.normalOffset = 0.4 * verticalAxisNormalLength / this.settings["axis-length"];
    const axesLabels = this.konvaStrategy.changeableObjectsStorage.metrics.axesLabels;
    axesLabels.top.text(`${newValue.toFixed(0)} см`);
    axesLabels.right.text(`${newValue.toFixed(0)} см`);
    axesLabels.left.text(`${(newValue / 2).toFixed(0)} см`);
    this.quadrangleCut.changeOffset();
    this.konvaStrategy.layers.background.draw();
  }

  showMetrics(newValue) {
    this.settings['are-metrics-shown'] = newValue;

    const metrics = this.konvaStrategy.changeableObjectsStorage.metrics;
    const visible = newValue && this.currentMode == Scene.Modes.QuadrangleEditing;
    for (const angle of metrics.quadrangleAngles) {
      angle.wedge.visible(visible);
      angle.text.visible(visible);
    }
    metrics.flapAngle.wedge.visible(visible);
    metrics.flapAngle.text.visible(visible);

    for (const storage of [metrics.quadrangleLinesLength, metrics.flapLinesLength]) {
      for (const lineLengthMetric of storage) {
        lineLengthMetric.arrowLine.visible(visible);
        lineLengthMetric.text.visible(visible);
      }
    }

    this.konvaStrategy.layers.middle.draw();
  }

  showCursorDistances(visible) {
    let cursorDistances = this.konvaStrategy.changeableObjectsStorage.cursorDistances;
    cursorDistances.vertical.line.visible(visible);
    cursorDistances.vertical.text.visible(visible);
    cursorDistances.horizontal.line.visible(visible);
    cursorDistances.horizontal.text.visible(visible);
  }

  switchMode(mode) {
    this.currentMode = mode != undefined ? mode : !this.currentMode;
    this.toggleCursor();
    const visible = this.currentMode == Scene.Modes.QuadrangleEditing;
    this.showCurrentQuadrangle(visible);
    this.updateConvexHull(visible);
    this.updateFlap(false);
  }

  toggleCursor() {
    const viewport = document.getElementById('viewport');
    if (this.currentMode == Scene.Modes.QuadrangleEditing)
      viewport.classList.remove("crosshair-cursor");
    else if (this.currentMode == Scene.Modes.PointsCloudEditing)
      viewport.classList.add("crosshair-cursor");
    else {
      console.log(`Unexpected mode ${this.currentMode}`);
    }
  }

  showCurrentQuadrangle(visible) {
    const storage = this.konvaStrategy.changeableObjectsStorage;
    const lineColor = this.quadrangleCut.isValid(this.normalRoundedConvexHull) ? Color.green : Color.red;
    for (let i = 0; i < storage.quadrangle.vertices.length; i++) {
      storage.quadrangle.vertices[i].visible(visible);
      storage.quadrangle.lines[i].visible(visible);
      storage.quadrangle.lines[i].stroke(lineColor);
      storage.metrics.quadrangleAngles[i].wedge.visible(visible);
      storage.metrics.quadrangleAngles[i].text.visible(visible);
      storage.metrics.quadrangleLinesLength[i].arrowLine.visible(visible);
      storage.metrics.quadrangleLinesLength[i].text.visible(visible);
    }
  }

  updateConvexHull(visible) {
    let representation = this.konvaStrategy.changeableObjectsStorage.innerConvexHull;
    const convhull = ConvexHull.create(this.pointsCloud.getPoints()).getPolygon();
    let vertices = convhull.getListVertices().map(vertex => this.extends.toViewport(vertex.x, vertex.y));
    let points = [];
    for (const vertex of vertices) {
      points.push(vertex.x);
      points.push(vertex.y);
    }
    representation.points(points);
    representation.visible(visible);

    representation = this.konvaStrategy.changeableObjectsStorage.roundedOuterConvexHull;
    for (let i = 0; i < representation.lines.length; i++) {
      representation.lines[i].destroy();
      representation.arcs[i].destroy();
    }
    representation.lines = [];
    representation.arcs = [];
    this.setRoundedOuterConvexHull(convhull, Color.grey);
    for (let i = 0; i < representation.lines.length; i++) {
      representation.lines[i].visible(visible);
      representation.arcs[i].visible(visible);
    }

    this.konvaStrategy.layers.background.draw();
  }

  async buildQuadrangle(settings) {
    this.currentMode = Scene.Modes.QuadrangleEditing;
    this.toggleCursor();
    this.updateConvexHull(true);
    this.quadrangleCut = new QuadrangleCut(this.normalOffset);
    await this.quadrangleCut.reloadCut(this.normalRoundedConvexHull, settings);
    const viewportVertices = this.quadrangleCut.getVertices().map(vertex => this.extends.toViewport(vertex.x, vertex.y));
    const viewportQuadrangle = this.konvaStrategy.changeableObjectsStorage.quadrangle;
    const viewportMetrics = this.konvaStrategy.changeableObjectsStorage.metrics;
    const lineColor = Color.green;
    for (let i = viewportVertices.length; i < 2 * viewportVertices.length; i++) {
      const prev = (i - 1) % viewportVertices.length;
      const current = i % viewportVertices.length;
      viewportQuadrangle.vertices[current].x(viewportVertices[current].x);
      viewportQuadrangle.vertices[current].y(viewportVertices[current].y);
      viewportQuadrangle.vertices[current].visible(true);
      viewportQuadrangle.lines[current].points([
        viewportVertices[prev].x, viewportVertices[prev].y,
        viewportVertices[current].x, viewportVertices[current].y,
      ]);
      viewportQuadrangle.lines[current].stroke(lineColor);
      viewportQuadrangle.lines[current].visible(true);
      const lengthMetricData = this.buildLengthMetricData(viewportVertices[prev], viewportVertices[current]);
      viewportMetrics.quadrangleLinesLength[current].arrowLine.points(lengthMetricData.points);
      viewportMetrics.quadrangleLinesLength[current].arrowLine.visible(true);
      viewportMetrics.quadrangleLinesLength[current].text.text(lengthMetricData.textValue);
      viewportMetrics.quadrangleLinesLength[current].text.x(lengthMetricData.textAnchor.x);
      viewportMetrics.quadrangleLinesLength[current].text.y(lengthMetricData.textAnchor.y);
      viewportMetrics.quadrangleLinesLength[current].text.visible(true);
    }
    this.updateAngles();
    this.updateFlap(true);
  }
}

class ViewportAngle {
  constructor(a, b, c) {
    this.centerX = b.x;
    this.centerY = b.y;
    this.radius = 0.1;

    const vectorBA = { x: a.x - b.x, y: a.y - b.y };
    const vectorBC = { x: c.x - b.x, y: c.y - b.y };
    this.angle = calcAngle360Between(vectorBC, vectorBA);

    const angleInRadians2 = Math.atan2(vectorBA.y, vectorBA.x);
    this.rotation = -(angleInRadians2 * 180) / Math.PI;

    let translation = normalize({ x: c.x - b.x, y: c.y - b.y });
    translation = { x: translation.x * this.radius, y: translation.y * this.radius };
    this.textAnchor = translate(b, translation);
    this.textAnchor = rotate(this.textAnchor, b, -this.angle / 180 * Math.PI / 2);
  }

  getWedgeParams() {
    return {
      x: this.centerX,
      y: this.centerY,
      radius: this.radius,
      angle: this.angle,
      rotation: this.rotation,
      fill: 'blue',
      stroke: 'black',
      strokeWidth: 1,
      opacity: 0.15,
      visible: false,
    }
  }

  getTextParams() {
    return {
      x: this.textAnchor.x,
      y: this.textAnchor.y,
      offsetX: 10,
      offsetY: 5,
      text: `${this.angle.toFixed(1)}°`,
      fontSize: 14,
      fontStyle: 'bold',
      fontFamily: 'Arial',
      fill: 'black',
      visible: false,
    }
  }
}

class Settings {
  static InitialData = {
    'inputs': {
      'grid-step': {
        'value': 10.34,
        onChange(e, scene) {
          let newValue = parseFloat(e.currentTarget.value);
          const onValidNewValue = () => {
            newValue *= 0.01;
            scene.changeGridStep(newValue);
          };
          Settings.onInputChange(e, newValue, onValidNewValue);
        },
      },
      'input-points-radius': {
        'value': 7,
        onChange(e, scene) {
          let newValue = parseFloat(e.currentTarget.value);
          const onValidNewValue = () => {
            scene.changeRadiusOfPointsCloud(newValue);
          };
          Settings.onInputChange(e, newValue, onValidNewValue);
        }
      },
      'quadrangle-vertices-radius': {
        'value': 9,
        onChange(e, scene) {
          let newValue = parseFloat(e.currentTarget.value);
          const onValidNewValue = () => {
            scene.changeQuadrangleVerticesRadius(newValue);
          };
          Settings.onInputChange(e, newValue, onValidNewValue);
        },
      },
      'quadrangle-line-type': {
        'value': Scene.LineTypes.Solid,
        onChange(e, scene) {
          scene.changeQuadrangleLineType(e.currentTarget.value);
        },
      },
      'lines-width': {
        'value': 5,
        onChange(e, scene) {
          let newValue = parseFloat(e.currentTarget.value);
          const onValidNewValue = () => {
            scene.changeLinesWidth(newValue);
          };
          Settings.onInputChange(e, newValue, onValidNewValue);
        },
      },
      'axis-length': {
        'value': 18,
        onChange(e, scene) {
          let newValue = parseFloat(e.currentTarget.value);
          const onValidNewValue = () => {
            scene.changeAxesLength(newValue);
          };
          Settings.onInputChange(e, newValue, onValidNewValue);
        },
      },
      'are-metrics-shown': {
        'value': true,
        onChange(e, scene) {
          scene.showMetrics(e.currentTarget.checked);
        },
      }
    },
    'buttons': [
      {
        'htmlId': "toggle-editing-points-mode-btn",
        onClick(e, scene) {
          const currentMode = e.currentTarget.value == "0" ?
            Scene.Modes.QuadrangleEditing : Scene.Modes.PointsCloudEditing;
          scene.switchMode(currentMode);
          e.currentTarget.value = currentMode;
          if (currentMode == Scene.Modes.QuadrangleEditing) {
            document.getElementById("trash-can-icon").style.display = "none";
            e.currentTarget.innerText = "Ввімкнути режим редагування точок";
          }
          else {
            document.getElementById("trash-can-icon").style.display = "block";
            e.currentTarget.innerText = "Вимкнути режим редагування точок";
          }
        },
      },
      {
        'htmlId': "build-min-quadrangle",
        async onClick(e, scene) {
          Settings.enableQuadrangleEditingMode();
          await scene.buildQuadrangle(new QuadrangleBuildSettings());
        },
      },
    ]
  }

  static onInputChange(e, newValue, onValidNewValue) {
    if (newValue != null) {
      e.currentTarget.style.color = "black";
      e.currentTarget.style.fontWeight = "normal";
      onValidNewValue();
    }
    else {
      e.currentTarget.style.color = "red";
      e.currentTarget.style.fontWeight = "bold";
    }
  }

  static enableQuadrangleEditingMode() {
    document.getElementById("trash-can-icon").style.display = "none";
    const toggler = document.getElementById("toggle-editing-points-mode-btn");
    toggler.innerText = "Ввімкнути режим редагування точок";
    toggler.value = Scene.Modes.QuadrangleEditing;
  }

  constructor(scene) {
    this.scene = scene;
    this.initializeFrontEndSettings();
  }

  initializeFrontEndSettings() {
    for (const setting in Settings.InitialData.inputs) {
      const settingData = Settings.InitialData.inputs[setting];
      const element = document.getElementById(setting);
      element.value = settingData.value;
      this[setting] = settingData.value;
      element.addEventListener("change", (e) => {
        settingData.onChange(e, this.scene, setting);
      });
    }
    this["grid-step"] *= 0.01;

    for (const btn of Settings.InitialData.buttons) {
      const htmlElement = document.getElementById(btn.htmlId);
      htmlElement.addEventListener('click', (e) => btn.onClick(e, this.scene));
    }
  }
}

const scene = new Scene();
let scenePromice = scene.constructorShard();
