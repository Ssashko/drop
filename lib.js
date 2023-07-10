class PointCloud {
    constructor() {
        this._points = [];
    }

    getPoints() {
        return this._points;
    }

    setPoints(points) {
        this._points = points;
    }

    genRandPoints() {
        const count = Math.ceil(Math.random() * 7) + 2;
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
}

class QuadrangleCut {
    static Type = {
        "Standart": 0,
        "Optimal": 1
    }

    constructor(pointCloud, options) {
        this.reloadCut(pointCloud, options);
        this._pointCloud = pointCloud;
    }
    changeOffset(offset) {
        this.offset = offset;
    }
    reloadCut(pointCloud, options) {
        this.offset = 0.03;

        let convexhull = ConvexHull.create(pointCloud.getPoints()).getPolygon();
        convexhull.makeOffset(this.offset);
        this.task = new Task(convexhull, options);

        this.task.exec();
        this._vertices = this.task.getCut().getListVertices();
    }
    getVertices() {
        return this._vertices;
    }

    moveVertex(index, newPoint) {
        this._vertices[index] = newPoint;
    }

    checkPointsIncluded(pointCloud) {
        for (let i = 0; i < pointCloud.getPoints().length; i++)
            if (!Polygon.create(this._vertices).pointIntersection(pointCloud.getPoints()[i]))
                return false;
        return true;
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

    isValid() {
        return this.checkPointsIncluded(this._pointCloud)
            && !this.hasSelfIntersection();
    }
}