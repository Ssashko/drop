class PointCloud {
    constructor() {
        this._points = [];
    }

    getPoints() {
        return this._points;
    }

    genRandPoints() {
        const count = Math.ceil(Math.random() * 7) + 2;
        for (let i = 0; i < count; i++)
            this._points.push(this.genRandPoint());
    }

    genRandPoint() {
        return Point.create( (Math.random() > 0.5 ? -1 : 1) * Math.random() / 4 , (Math.random() > 0.5 ? -1 : 1) * Math.random() / 4);
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

    constructor(pointCloud, type) {
        this.reloadCut(pointCloud, type);

    }
    changeOffset(offset)
    {
        this.offset = offset;
    }
    reloadCut(pointCloud, type)
    {
        this.offset = 0.03;

        this.cut = new MinimumCircumscribeCut(pointCloud.getPoints());
        this.cut.makeOffset(this.offset);
        if (type === QuadrangleCut.Type.Optimal)
            this.cut.tryGenOptimalCut();
        else
            this.cut.genStandartCut();

        this._vertices = this.cut.getCut();
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
}