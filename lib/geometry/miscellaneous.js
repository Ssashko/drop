class Range {
    constructor(l, r) {
        this.l = l;
        this.r = r;
    }

    static create(l, r) {
        return new Range(l, r);
    }

    check(v) {
        return this.l - EPS < v && v < this.r + EPS;
    }
}

function fuzzyEqual(a, b) {
    return Math.abs(a - b) < EPS;
}
function cross(a, b) {
    return a.x * b.y - b.x * a.y;
}
function dot(a, b) {
    return a.x * b.x + a.y * b.y;
}
function getTriangleArea(p1, p2, p3) {
    let a = Point.length(p1, p2),
        b = Point.length(p2, p3),
        c = Point.length(p3, p1);
    let p = (a + b + c) / 2;
    return Math.sqrt(p * (p - a) * (p - b) * (p - c));
}
function getQuadrangleArea(p1, p2, p3, p4) {
    return getTriangleArea(p1, p2, p3) + getTriangleArea(p1, p3, p4)
}
function getRootsOfSqrEq(a, b, c) {
    let D = b * b - 4 * a * c;
    if (D < 0)
        return null;
    return [
        (-b + Math.sqrt(D)) / (2 * a),
        (-b - Math.sqrt(D)) / (2 * a)
    ]
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

function toRadians(angleDegree) {
    return Math.PI / 180 * angleDegree;
}

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
        x: resultPoint.x * Math.cos(angleRad) + resultPoint.y * Math.sin(angleRad),
        y: -resultPoint.x * Math.sin(angleRad) + resultPoint.y * Math.cos(angleRad)
    };
    return translate(resultPoint, { x: -translation.x, y: -translation.y });
}

function calcAngle360Between(vector1, vector2) {
    const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
    const determinant = vector1.x * vector2.y - vector1.y * vector2.x;
    let angleInRadians = Math.atan2(determinant, dotProduct);
    angleInRadians = angleInRadians > 0 ? angleInRadians : Math.PI * 2 + angleInRadians;
    return (angleInRadians * 180) / Math.PI;
}