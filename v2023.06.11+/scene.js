const Color = {
    red: "#fc0317",
    green: "#1d9106",
    blue: "#067391",
    darkGreen: "#0e2e13",
    grey: "#7c7c7d",
    white: "#ffffff",
    black: "#000",
};

const EPS = 1e-3;

function translate(point, vector) {
    return { x: point.x + vector.x, y: point.y + vector.y };
}

function normalize(vector) {
    const vectorLength = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    return vectorLength > EPS ? { x: vector.x / vectorLength, y: vector.y / vectorLength } : null;
}

function rotate(point, anchor, angleRad) {
    const translation = { x: -anchor.x, y: -anchor.y };
    let resultPoint = translate(point, translation);
    resultPoint = {
        x: resultPoint.x * Math.cos(angleRad) - resultPoint.y * Math.sin(angleRad),
        y: resultPoint.x * Math.sin(angleRad) + resultPoint.y * Math.cos(angleRad)
    };
    return translate(resultPoint, { x: -translation.x, y: -translation.y });
}

class Scene {
    constructor(settings) {
        settings["gridStep"] *= 0.01;
        this.settings = settings;

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
        // this.quadrangleCut = MinimumCircumscribeCut();

        var stage = new Konva.Stage({
            container: 'viewport',
            width: this.viewportExtends.w,
            height: this.viewportExtends.h,
        });

        this.setBackgroundGrid(stage);
        this.setAxes(stage);
        this.anglesLayer = new Konva.Layer();
        this.shownAngles = [];
        this.setPointCloud(stage);
        this.setQuadrangleCutAngles(stage);
        this.setQuadrangleCut(stage);

        this.target = null;;
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
            x: ratio.w * vertex.x,
            y: ratio.h * vertex.y
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
                draggable: true,
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
                visible: false
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
                visible: false
            });
            circle.on("dragstart", () => this.setTarget(i));
            circle.on("dragmove", (e) => this.onVertexMove(e));
            circle.on("dragend", () => this.setTarget(null));
            this.quadrangleCutRepresentation.vertices.push(circle);
            layer.add(circle);
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

        this.updateQuadrangleCut(false);
        let lineColor = this.quadrangleCut.checkPointsIncluded(this.pointCloud)
            && !this.quadrangleCut.hasSelfIntersection() ? Color.green : Color.red;
        this.updateQuadrangleLines(lineColor);
        this.updateAngles();
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

    updateQuadrangleCut(buildNewQuadrangleCut, isPointsCloudEditingModeEnabled) {
        if (buildNewQuadrangleCut) {
            // TODO: build quadrangleCut
            this.quadrangleCut = new QuadrangleCut(this.pointCloud);    // temporary represents the building of a quadrangleCut            
            let vertices = this.quadrangleCut.getVertices().map(vertex => this.normalCoordinateToViewport(vertex));

            for (let i = 0; i < vertices.length; i++) {
                const viewportCircle = this.quadrangleCutRepresentation.vertices[i];
                viewportCircle.x(vertices[i].x);
                viewportCircle.y(vertices[i].y);
                viewportCircle.draw();
            }

            for (let i = vertices.length - 1; i < 2 * vertices.length - 1; i++) {
                var startVertex = vertices[i % vertices.length];
                var endVertex = vertices[(i + 1) % vertices.length];
                var line = this.quadrangleCutRepresentation.lines[(i + 1) % vertices.length];
                line.points([
                    startVertex.x, startVertex.y,
                    endVertex.x, endVertex.y
                ]);
                line.draw();
            }
        }

        if (isPointsCloudEditingModeEnabled != null) {
            for (let i = 0; i < this.quadrangleCutRepresentation.vertices.length; i++) {
                this.quadrangleCutRepresentation.vertices[i].visible(!isPointsCloudEditingModeEnabled);
                this.quadrangleCutRepresentation.lines[i].visible(!isPointsCloudEditingModeEnabled);
            }
        }

        if (this.target == null)
            return;

        let viewportVertex = this.quadrangleCutRepresentation.vertices[this.target];
        viewportVertex = this.viewportCoordinateToNormal(
            { "x": viewportVertex.x(), "y": viewportVertex.y() }
        );
        this.quadrangleCut.moveVertex(this.target, viewportVertex);
    }

    viewportCoordinateToNormal(vertex) {
        let ratio = {
            w: this.normalExtends.w / this.viewportExtends.w,
            h: this.normalExtends.h / this.viewportExtends.h
        };
        return {
            x: ratio.w * vertex.x,
            y: ratio.h * vertex.y
        }
    }

    updateAxisLength() {
        this.topDivisionValue.text(`${this.settings["axisLength"]} см`);
        var v = Math.round(this.settings["axisLength"] / 2);
        this.rightDivisionValue.text(`${v} см`);
        this.leftDivisionValue.text(`${v} см`);
    }

    setQuadrangleCutAngles(stage) {
        const vertices = this.quadrangleCut.getVertices();
        for (let i = vertices.length; i < 2 * vertices.length; i++) {
            const anglePoints = [];
            for (let j = 0; j < 3; j++) {
                anglePoints.push(vertices[(i - 1 + j) % vertices.length]);
            }
            this.setAngle(anglePoints[0], anglePoints[1], anglePoints[2]);
        }
        stage.add(this.anglesLayer);
    }

    setAngle(a, b, c) {
        const angle = new ViewportAngle(a, b, c);
        let sectorParams = angle.getWedgeParams();
        sectorParams.radius *= this.viewportSide;
        const sectorCenter = this.normalCoordinateToViewport({
            x: sectorParams.x,
            y: sectorParams.y
        });
        sectorParams.x = sectorCenter.x;
        sectorParams.y = sectorCenter.y;
        sectorParams.visible = false;
        const sector = new Konva.Wedge(sectorParams);
        const angleTextParams = angle.getTextParams();
        const viewportAnchor = this.normalCoordinateToViewport({
            x: angleTextParams.x,
            y: angleTextParams.y
        });
        angleTextParams.x = viewportAnchor.x;
        angleTextParams.y = viewportAnchor.y;
        angleTextParams.visible = false;
        const text = new Konva.Text(angleTextParams);
        this.anglesLayer.add(sector, text);
        this.shownAngles.push({
            sector: sector,
            text: text
        });
    }

    updateAngles(isPointsCloudEditingModeEnabled) {
        const vertices = this.quadrangleCut.getVertices();
        const start = vertices.length + this.target - 1;
        for (let i = start; i < start + vertices.length; i++) {
            this.updateAngle(vertices, i, isPointsCloudEditingModeEnabled);
        }
    }

    updateAngle(vertices, index, isPointsCloudEditingModeEnabled) {
        const angle = new ViewportAngle(
            vertices[(index - 1) % vertices.length],
            vertices[(index) % vertices.length],
            vertices[(index + 1) % vertices.length]
        );

        let sectorParams = angle.getWedgeParams();
        sectorParams.radius *= this.viewportSide;
        const sectorCenter = this.normalCoordinateToViewport({
            x: sectorParams.x,
            y: sectorParams.y
        });
        let sector = this.shownAngles[index % vertices.length].sector;
        sector.x(sectorCenter.x);
        sector.y(sectorCenter.y);
        sector.angle(sectorParams.angle);
        sector.rotation(sectorParams.rotation);
        sector.visible(this.settings["areMetricsShown"] && !isPointsCloudEditingModeEnabled);
        sector.draw();

        const angleTextParams = angle.getTextParams()
        const viewportAnchor = this.normalCoordinateToViewport({
            x: angleTextParams.x,
            y: angleTextParams.y
        });
        let text = this.shownAngles[index % vertices.length].text;
        text.x(viewportAnchor.x);
        text.y(viewportAnchor.y);
        text.text(angleTextParams.text);
        text.visible(this.settings["areMetricsShown"] && !isPointsCloudEditingModeEnabled);
        text.draw();
    }

    updateMetricsView(isPointsCloudEditingModeEnabled) {
        this.updateAngles(isPointsCloudEditingModeEnabled);
    }

    onPointsCloudEditingModeToggling(isPointsCloudEditingModeEnabled) {
        this.updateQuadrangleCut(!isPointsCloudEditingModeEnabled, isPointsCloudEditingModeEnabled);
        this.updateMetricsView(isPointsCloudEditingModeEnabled);
    }

    updatePointsCloud() {
        let newPoints = [];
        for (let point of this.pointsCloudRepresentation) {
            let normalCoords = this.viewportCoordinateToNormal({
                x: point.x(),
                y: point.y()
            });
            newPoints.push(normalCoords);
        }
        this.pointCloud.setPoints(newPoints);
    }
}

class ViewportAngle {
    constructor(a, b, c) {
        this.centerX = b.x;
        this.centerY = b.y;
        this.radius = 0.05;

        const vectorBA = { x: a.x - b.x, y: a.y - b.y };
        const vectorBC = { x: c.x - b.x, y: c.y - b.y };
        const dotProduct = vectorBA.x * vectorBC.x + vectorBA.y * vectorBC.y;
        const determinant = vectorBA.x * vectorBC.y - vectorBA.y * vectorBC.x;
        let angleInRadians = Math.atan2(determinant, dotProduct);
        angleInRadians = angleInRadians > 0 ? angleInRadians : Math.PI * 2 + angleInRadians;
        this.angle = (angleInRadians * 180) / Math.PI;

        const angleInRadians2 = Math.atan2(vectorBA.y, vectorBA.x);
        this.rotation = (angleInRadians2 * 180) / Math.PI;

        let translation = normalize({ x: c.x - b.x, y: c.y - b.y });
        translation = { x: translation.x * this.radius, y: translation.y * this.radius };
        this.textAnchor = translate(b, translation);
        this.textAnchor = rotate(this.textAnchor, b, -angleInRadians / 2);
    }

    getPointOnLine(lineStartX, lineStartY, lineEndX, lineEndY, distance) {
        const directionVectorX = lineEndX - lineStartX;
        const directionVectorY = lineEndY - lineStartY;
        const directionVectorLength = Math.sqrt(directionVectorX * directionVectorX + directionVectorY * directionVectorY);
        const normalizedDirectionVectorX = directionVectorX / directionVectorLength;
        const normalizedDirectionVectorY = directionVectorY / directionVectorLength;
        const displacementVectorX = normalizedDirectionVectorX * distance;
        const displacementVectorY = normalizedDirectionVectorY * distance;
        const pointX = lineStartX + displacementVectorX;
        const pointY = lineStartY + displacementVectorY;
        return { x: pointX, y: pointY };
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
        }
    }
}