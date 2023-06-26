const Color = {
    red: "#fc0317",
    green: "#1d9106",
    blue: "#067391",
    darkGreen: "#0e2e13",
    grey: "#7c7c7d",
    white: "#ffffff",
    black: "#000",
};

class Scene {
    constructor(settings) {
        this.viewportSide = Math.min(window.innerWidth, window.innerHeight) - 10;
        this.viewportExtends = {
            w: this.viewportSide,
            h: this.viewportSide
        };
        this.normalExtends = {
            w: 1,
            h: 1
        };

        this.pointCloud = new PointCloud();
        this.pointCloud.genRandPoints();
        this.quadrangleCut = new QuadrangleCut(this.pointCloud);

        settings["gridStep"] *= 0.01;
        this.settings = settings;

        var stage = new Konva.Stage({
            container: 'viewport',
            width: this.viewportExtends.w,
            height: this.viewportExtends.h,
        });

        this.setBackgroundGrid(stage);
        this.setAxes(stage);
        this.setPointCloud(stage);

        let convhull = ConvexHull.create(this.pointCloud.getPoints()).getPolygon();
        convhull.makeOffset(0.05);
        this.setConvexHull(stage, convhull, Color.darkGreen);

        convhull = ConvexHull.create(this.pointCloud.getPoints()).getPolygon();
        this.setConvexHull(stage, convhull, Color.green);
        this.setQuadrangleCut(stage);
        

        this.target = null;
    }

    updateViewportSize() {
        const viewportSide = Math.min(window.innerWidth, window.innerHeight);
        this.viewportExtends.w = viewportSide;
        this.viewportExtends.h = viewportSide;
    }

    normalCoordinateToViewport(vertex) {
        let ratio = {
            w: this.viewportExtends.w / this.normalExtends.w,
            h: this.viewportExtends.h / this.normalExtends.h
        };
        return {
            x: ratio.w * (vertex.x + 1) / 2,
            y: - ratio.h * (vertex.y - 1) / 2
        }
    }
    viewportCoordinateToNormal(vertex) {
        let ratio = {
            w: this.normalExtends.w / this.viewportExtends.w,
            h: this.normalExtends.h / this.viewportExtends.h
        };
        return {
            x: ratio.w * vertex.x * 2 - 1,
            y: - ratio.h * vertex.y * 2 + 1
        }
    }

    setAxes(stage) {
        var layer = new Konva.Layer();
        let offset = {
            w: this.viewportExtends.w * 0.04,
            h: this.viewportExtends.h * 0.04
        };
        var verticalAxis = new Konva.Line({
            points: [
                this.viewportExtends.w / 2, offset.h,
                this.viewportExtends.w / 2, this.viewportExtends.h - offset.h
            ],
            stroke: Color.black,
            strokeWidth: 3,
        });
        layer.add(verticalAxis);
        var divisions = {
            7: [0, 0.5, 1],
            5: [0.125, 0.250, 0.375, 0.625, 0.750, 0.875]
        };
        var axisLength = this.viewportExtends.h - 2 * offset.h;
        for (let divisionWidth in divisions) {
            divisionWidth = Number.parseInt(divisionWidth);
            for (let position of divisions[divisionWidth]) {
                let division = new Konva.Line({
                    points: [
                        this.viewportExtends.w / 2 - divisionWidth, offset.h + axisLength * position,
                        this.viewportExtends.w / 2 + divisionWidth, offset.h + axisLength * position
                    ],
                    stroke: Color.black,
                    strokeWidth: divisionWidth,
                });
                layer.add(division);
            }
        }
        let fontHeight = Math.round(this.viewportSide * 0.025);
        let fontWidth = 2.25 * fontHeight;
        this.topDivisionValue = new Konva.Text({
            x: (this.viewportExtends.w - fontWidth) / 2,
            y: (offset.h - fontHeight + 2) / 2,
            text: `${this.settings["axisLength"]} см`,
            fontSize: fontHeight,
            fontFamily: 'Calibri',
            fill: 'black',
        });
        layer.add(this.topDivisionValue);

        var horizontalAxis = new Konva.Line({
            points: [
                offset.w, this.viewportExtends.h - offset.h,
                this.viewportExtends.w - offset.w, this.viewportExtends.h - offset.h
            ],
            stroke: Color.black,
            strokeWidth: 3,
        });
        layer.add(horizontalAxis);
        for (let divisionHeight in divisions) {
            divisionHeight = Number.parseInt(divisionHeight);
            for (let position of divisions[divisionHeight]) {
                let division = new Konva.Line({
                    points: [
                        offset.w + axisLength * position, this.viewportExtends.h - offset.h - divisionHeight,
                        offset.w + axisLength * position, this.viewportExtends.h - offset.h + divisionHeight,
                    ],
                    stroke: Color.black,
                    strokeWidth: divisionHeight,
                });
                layer.add(division);
            }
        }
        var v = Math.round(this.settings["axisLength"] / 2);
        this.rightDivisionValue = new Konva.Text({
            x: this.viewportExtends.w - offset.w - fontWidth / 2,
            y: this.viewportExtends.h - offset.h - fontHeight - 5,
            text: `${v} см`,
            fontSize: fontHeight,
            fontFamily: 'Calibri',
            fill: 'black',
        });
        layer.add(this.rightDivisionValue);
        this.leftDivisionValue = this.rightDivisionValue.clone();
        this.leftDivisionValue.x(offset.w - fontWidth / 2);
        layer.add(this.leftDivisionValue);
        stage.add(layer);
    }

    generateBackgroundGrid(step_unit) {
        for (let step = 0.5; step >= 0; step = step - step_unit) {
            var gridLine = new Konva.Line({
                points: [0, step * this.viewportExtends.h, this.viewportExtends.w, step * this.viewportExtends.h],
                stroke: Color.grey,
                strokeWidth: 1,
            });
            this.backgroundGridLayer.add(gridLine);
            var gridLine = new Konva.Line({
                points: [0, (1 - step) * this.viewportExtends.h, this.viewportExtends.w, (1 - step) * this.viewportExtends.h],
                stroke: Color.grey,
                strokeWidth: 1,
            });
            this.backgroundGridLayer.add(gridLine);
            var gridLine = new Konva.Line({
                points: [step * this.viewportExtends.w, 0, step * this.viewportExtends.w, this.viewportExtends.h],
                stroke: Color.grey,
                strokeWidth: 1,
            });
            this.backgroundGridLayer.add(gridLine);
            var gridLine = new Konva.Line({
                points: [(1 - step) * this.viewportExtends.w, 0, (1 - step) * this.viewportExtends.w, this.viewportExtends.h],
                stroke: Color.grey,
                strokeWidth: 1,
            });
            this.backgroundGridLayer.add(gridLine);
        }
    }

    setBackgroundGrid(stage) {
        var layer = new Konva.Layer();
        this.backgroundBorder = new Konva.Rect({
            x: 0,
            y: 0,
            width: this.viewportSide,
            height: this.viewportSide,
            // fill: 'white',
            stroke: 'black',
            strokeWidth: 2,
        });
        layer.add(this.backgroundBorder);
        stage.add(layer)

        this.backgroundGridLayer = new Konva.Layer();
        this.generateBackgroundGrid(this.settings["gridStep"]);
        stage.add(this.backgroundGridLayer);
    }

    setPointCloud(stage) {
        this.pointsCloudLayer = new Konva.Layer();
        this.pointsCloudRepresentation = [];
        this.pointCloud.getPoints().forEach(vertex => {
            let viewportPoint = this.normalCoordinateToViewport(vertex);
            var circle = new Konva.Circle({
                x: viewportPoint.x,
                y: viewportPoint.y,
                radius: 5,
                fill: Color.blue,
                stroke: 'black',
                strokeWidth: 1,
            });
            this.pointsCloudLayer.add(circle);
            this.pointsCloudRepresentation.push(circle);
        });
        stage.add(this.pointsCloudLayer);
    }

    setQuadrangleCut(stage) {
        let vertices = this.quadrangleCut.getVertices().map(vertex => this.normalCoordinateToViewport(vertex));

        var layer = new Konva.Layer();
        this.quadrangleCutRepresentation = {
            "lines": [],
            "vertices": []
        }
        for (let i = vertices.length - 1; i < 2 * vertices.length - 1; i++) {
            var startVertex = vertices[i % vertices.length];
            var endVertex = vertices[(i + 1) % vertices.length];
            var quadrangleSide = new Konva.Line({
                points: [
                    startVertex.x, startVertex.y,
                    endVertex.x, endVertex.y
                ],
                // fill: '#00D2FF',
                // lineCap: 'round',
                // lineJoin: 'round',
                stroke: Color.green,
                strokeWidth: this.settings["quadrangleSideWidth"],
            });
            this.quadrangleCutRepresentation.lines.push(quadrangleSide);
            layer.add(quadrangleSide);
        }

        for (let i = 0; i < vertices.length; i++) {
            var vertex = vertices[i];
            var circle = new Konva.Circle({
                x: vertex.x,
                y: vertex.y,
                radius: this.settings["quadrangleVerticesRadius"],
                fill: Color.darkGreen,
                stroke: 'black',
                strokeWidth: 1,
                draggable: true,
            });
            circle.on("dragstart", () => this.setTarget(i));
            circle.on("dragmove", (e) => this.onVertexMove(e));
            circle.on("dragend", () => this.setTarget(null));
            this.quadrangleCutRepresentation.vertices.push(circle);
            layer.add(circle);
        }
        stage.add(layer);
    }

    setConvexHull(stage, convhull, color) {
        let vertices = convhull.getListVertices().map(vertex => this.normalCoordinateToViewport(vertex));

        var layer = new Konva.Layer();
        this.quadrangleCutRepresentation = {
            "lines": [],
            "vertices": []
        }
        for (let i = 0; i < vertices.length; i++) {
            var startVertex = vertices[i];
            var endVertex = vertices[(i + 1) % vertices.length];
            var quadrangleSide = new Konva.Line({
                points: [
                    startVertex.x, startVertex.y,
                    endVertex.x, endVertex.y
                ],
                stroke: Color.black,
                strokeWidth: this.settings["quadrangleSideWidth"] * 0.5,
            });
            layer.add(quadrangleSide);
        }
        stage.add(layer);
    }

    setTarget(target) {
        this.target = target;
    }

    onVertexMove(e) {
        if (this.target == null)
            return;

        let targetCircle = this.quadrangleCutRepresentation.vertices[this.target] = e.target;
        let firstLine = this.quadrangleCutRepresentation.lines[this.target];
        let points = firstLine.points();
        firstLine.points([points[0], points[1], targetCircle.x(), targetCircle.y()]);
        firstLine.draw();

        let secondLine = this.quadrangleCutRepresentation.lines[(this.target + 1) % this.quadrangleCutRepresentation.lines.length];
        points = secondLine.points();
        secondLine.points([targetCircle.x(), targetCircle.y(), points[2], points[3]]);
        secondLine.draw();

        this.updateQuadrangleCut();
        let lineColor = this.quadrangleCut.checkPointsIncluded(this.pointCloud)
            && !this.quadrangleCut.hasSelfIntersection() ? Color.green : Color.red;
        this.updateQuadrangleLines(lineColor);
    }

    updateBackgroundGrid() {
        for (let line of this.backgroundGridLayer.find('Line'))
            line.destroy();
        this.generateBackgroundGrid(this.settings["gridStep"])
        this.backgroundGridLayer.draw();
    }

    updateQuadrangleLines(lineColor = null) {
        let width = this.settings["quadrangleSideWidth"];
        let dash = this.settings["lineType"] === "solid" ? null : [20 + 2 * width, 20 + 2 * width];
        for (let line of this.quadrangleCutRepresentation.lines) {
            line.dash(dash);
            if (lineColor != null)
                line.stroke(lineColor);
            line.strokeWidth(width);
            line.draw();
        }
        for (let vertex of this.quadrangleCutRepresentation.vertices)
            vertex.draw();
    }

    updateQuadrangleVerticesRadius(radius) {
        for (let vertex of this.quadrangleCutRepresentation.vertices) {
            vertex.radius(radius);
            vertex.draw();
        }
    }

    updateQuadrangleCut() {
        let viewportVertex = this.quadrangleCutRepresentation.vertices[this.target];
        viewportVertex = this.viewportCoordinateToNormal(
            { "x": viewportVertex.x(), "y": viewportVertex.y() }
        );
        this.quadrangleCut.moveVertex(this.target, viewportVertex);
    }

    updateAxisLength() {
        this.topDivisionValue.text(`${this.settings["axisLength"]} см`);
        var v = Math.round(this.settings["axisLength"] / 2);
        this.rightDivisionValue.text(`${v} см`);
        this.leftDivisionValue.text(`${v} см`);
    }
}
