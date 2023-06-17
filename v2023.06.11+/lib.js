function getPerpendicularBase(point, line) {
    const _y = (line.a * line.a * point.y - line.a * line.b * point.x - line.b * line.c) / (line.b * line.b + line.a * line.a);
    const _x = line.a != 0 ? (-line.b / line.a * _y - line.c / line.a) : point.x;
    return {
        x: _x,
        y: _y
    };
}
function dot(v1, v2) {
    return (v1.x * v2.x + v1.y * v2.y) / (Math.sqrt(v1.x * v1.x + v1.y * v1.y) * Math.sqrt(v2.x * v2.x + v2.y * v2.y));
}
function len(v1, v2) {
    return Math.sqrt((v1.x - v2.x) * (v1.x - v2.x) + (v1.y - v2.y) * (v1.y - v2.y));
}
function checkAABB(p1, p2, point) {
    let maxX = Math.max(p1.x, p2.x);
    let minX = Math.min(p1.x, p2.x);

    let maxY = Math.max(p1.y, p2.y);
    let minY = Math.min(p1.y, p2.y);

    return (minX - EPS < point.x && point.x < maxX + EPS) && (minY - EPS < point.y && point.y < maxY + EPS);
}

function nearestPolygonPoint(polygon, vertex) {
    let plgSize = polygon.length;
    let lines = [];
    for (let i = 0; i < plgSize; i++) {
        let p0 = polygon[i];
        let p1 = polygon[(i + 1) % plgSize];
        lines.push({
            a: p0.y - p1.y,
            b: p1.x - p0.x,
            c: p0.x * p1.y - p1.x * p0.y
        });
    }
    let nearestPolygonPoints = [];
    for (let i = 0; i < plgSize; i++) {
        let p0 = polygon[i];
        let p1 = polygon[(i + 1) % plgSize];
        let footOfPerpendicular = getPerpendicularBase(vertex, lines[i]);
        if (checkAABB(p0, p1, footOfPerpendicular))
            nearestPolygonPoints.push({
                point: footOfPerpendicular,
                normal: { x: lines[i].a, y: lines[i].b }
            });
        else if (len(p0, vertex) < len(p1, vertex))
            nearestPolygonPoints.push({
                point: p0,
                normal: { x: lines[i].a + lines[(plgSize + i - 1) % plgSize].a, y: lines[i].b + lines[(plgSize + i - 1) % plgSize].b }
            });
        else
            nearestPolygonPoints.push({
                point: p1,
                normal: { x: lines[i].a + lines[(i + 1) % plgSize].a, y: lines[i].b + lines[(i + 1) % plgSize].b }
            });
    }

    let min_index = 0;
    let min_width = len(nearestPolygonPoints[0].point, vertex);
    for (let i = 0; i < nearestPolygonPoints.length; i++) {
        let cur_len = len(nearestPolygonPoints[i].point, vertex);
        if (cur_len < min_width) {
            min_width = cur_len;
            min_index = i;
        }
    }
    return nearestPolygonPoints[min_index];
}

function determinant(matrix2x2) {
    return matrix2x2[0][0] * matrix2x2[1][1] - matrix2x2[1][0] * matrix2x2[0][1]
}

function invert(matrix2x2) {
    const matrix2x2Det = determinant(matrix2x2);
    if (matrix2x2 === 0)
        return null;

    return [
        [matrix2x2[1][1] / matrix2x2Det, -matrix2x2[0][1] / matrix2x2Det],
        [-matrix2x2[1][0] / matrix2x2Det, matrix2x2[0][0] / matrix2x2Det]
    ]
}

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
        return {
            x: Math.random() / 2 + 0.25,
            y: Math.random() / 2 + 0.25
        }
    }

    add(normalCoords) {
        this._points.push(normalCoords);
    }

    remove(index) {
        this._points.splice(index, 1);
    }
}

class QuadrangleCut {
    constructor(pointCloud) {
        const offset = 0.03;
        const maxCoord = this.getMaxCoord(pointCloud.getPoints()) + offset;
        const minCoord = this.getMinCoord(pointCloud.getPoints()) - offset;

        this._vertices = [
            { x: minCoord, y: minCoord },
            { x: minCoord, y: maxCoord },
            { x: maxCoord, y: maxCoord },
            { x: maxCoord, y: minCoord }
        ];
    }

    getVertices() {
        return this._vertices;
    }

    moveVertex(index, newPoint) {
        this._vertices[index] = newPoint;
    }

    checkPointsIncluded(pointCloud) {
        for (let i = 0; i < pointCloud.getPoints().length; i++)
            if (!this.checkPointIncluded(pointCloud.getPoints()[i]))
                return false;
        return true;
    }

    checkPointIncluded(vertex) {
        let nearestPoint = nearestPolygonPoint(this._vertices, vertex);
        return dot(nearestPoint.normal, { x: nearestPoint.point.x - vertex.x, y: nearestPoint.point.y - vertex.y }) > -Number.EPSILON;
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