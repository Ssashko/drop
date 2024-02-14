class Range {
    constructor(l, r) {
        this.l = l;
        this.r = r;
    }

    static create(l, r) {
        return new Range(l, r);
    }

    get length() {
        return Math.abs(this.l - this.r);
    }

    get mid() {
        if (this.l === -Infinity)
            return this.r - 1;
        if (this.r === Infinity)
            return this.l + 1;
        return (this.l + this.r) / 2;
    }
    map(callback) {
        this.l = callback(this.l);
        this.r = callback(this.r);
        return this;
    }
    check(v) {
        return this.l - EPS < v && v < this.r + EPS;
    }

    checkRange(r) {
        return this.check(r.l) && this.check(r.r);
    }
    static deleteZeroRanges(list) {
        return list.filter(el => !fuzzyEqual(el.length, 0));
    }
    static DisjointIntersection(list1, list2, key = null) {

        let sweepLine = [];
        list1.forEach((el, ind) => {
            sweepLine.push({ coordinate: el.l, index: ind, begin: true, type: 0 });
            sweepLine.push({ coordinate: el.r, index: ind, begin: false, type: 0 });
        });
        list2.forEach((el, ind) => {
            sweepLine.push({ coordinate: el.l, index: ind, begin: true, type: 1 });
            sweepLine.push({ coordinate: el.r, index: ind, begin: false, type: 1 });
        });

        sweepLine.sort((a, b) => {
            if (fuzzyEqual(a.coordinate, b.coordinate)) {
                if (a.type != b.type)
                    return a.begin ? -1 : 1;
                if (a.index == b.index)
                    return a.begin ? -1 : 1;
                return a.begin ? 1 : -1;
            }
            if (a.coordinate > b.coordinate)
                return 1;
            else
                return -1;

        });

        let openbrace = [null, null];
        let indices = [-1, -1];

        let lastopenbraceType = -1;
        let res = [];
        sweepLine.forEach(el => {
            if (el.begin) {
                openbrace[el.type] = el.coordinate;
                indices[el.type] = el.index;
                lastopenbraceType = el.type;
            }
            else if (openbrace[0] != null && openbrace[1] != null) {
                let range = Range.create(openbrace[lastopenbraceType], el.coordinate);
                if (key != null) range[key] = list1[indices[0]][key];
                res.push(range);
                lastopenbraceType = (el.type + 1) % 2;
                openbrace[lastopenbraceType] = el.coordinate;

                openbrace[el.type] = null;
                indices[el.type] = -1;
            }
            else {
                openbrace[el.type] = null;
                indices[el.type] = -1;
            }
        })

        return res;
    }
}
function NumberComparator(a, b) {
    if (fuzzyEqual(a, b))
        return 0;
    else if (a > b)
        return 1;
    else
        return -1;

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

function angleFromThreePoint(a, b, c) {
    return Vector.angleBetween(Vector.create(a.x - b.x, a.y - b.y), Vector.create(c.x - b.x, c.y - b.y));
}

function intersectLine(l, r) {
    let nAbs = Math.pow(l.a, 2) + Math.pow(l.b, 2);
    let dSqr = Math.pow(r, 2) - Math.pow(l.c, 2) / nAbs;
    if (dSqr < 0)
        return [];

    let coef = Math.sqrt(dSqr / nAbs);

    let x0 = - l.a * l.c / nAbs;
    let y0 = - l.b * l.c / nAbs;

    let P1 = Point.create(x0 + l.b * coef, y0 - l.a * coef);

    if (fuzzyEqual(dSqr, 0))
        return [P1];
    let P2 = Point.create(x0 - l.b * coef, y0 + l.a * coef);
    return [P1, P2];
}

function makeUnique(list) {
    if (list.length == 0)
        return [];
    list.sort(NumberComparator);

    let left = list[0];
    let result = [];
    list.forEach((element) => {
        if (!fuzzyEqual(element, left)) {
            result.push(left);
            left = element;
        }
    })
    result.push(list.at(-1));
    return result;
}