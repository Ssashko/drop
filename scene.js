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

class Scene {
    constructor(settings) {
        this.viewportSide = Math.min(window.innerWidth, window.innerHeight);
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

        this.settings = settings;

        var stage = new Konva.Stage({
            container: 'viewport',
            width: this.viewportExtends.w,
            height: this.viewportExtends.h,
        });

        this.setBackgroundGrid(stage);
        this.setPointCloud(stage);
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
            x: ratio.w * vertex.x,
            y: ratio.h * vertex.y
        }
    }

    generateBackgroundGrid(step_unit) {
        for (let step = step_unit / 2; step <= 1; step += step_unit) {
            var gridLine = new Konva.Line({
                points: [0, step * this.viewportSide, this.viewportSide, step * this.viewportSide],
                stroke: Color.grey,
                strokeWidth: 1,
            });
            this.backgroundGridLayer.add(gridLine);
            var gridLine = new Konva.Line({
                points: [step * this.viewportSide, 0, step * this.viewportSide, this.viewportSide],
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
        this.setAxes(stage);
        stage.add(this.backgroundGridLayer);
    }

    setPointCloud(stage) {
        var layer = new Konva.Layer();
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
            layer.add(circle);
            this.pointsCloudRepresentation.push(circle);
        });
        stage.add(layer);
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

    updateBackgroundGrid(stepUnit) {
        for (let line of this.backgroundGridLayer.find('Line'))
            line.destroy();
        this.generateBackgroundGrid(stepUnit)
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
}
