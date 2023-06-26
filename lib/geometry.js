class Line{

    constructor(a, b, c)
    {
        this.a = a;
        this.b = b;
        this.c = c;
    }
    
    static create(p0, p1)
    {
        return getLineByPoints(p0, p1);
    }

    static linesIntersection(l1, l2) {
        let denom = l1.a * l2.b - l1.b * l2.a;
        if(Math.abs(denom) < EPS)
            return null;
        return Point.create((l1.b * l2.c - l2.b * l1.c) / denom, -(l1.a * l2.c - l2.a * l1.c) / denom);
    }
    symmetricByLine(line) {
        let y1 = 0;
        let y2 = 1;
        let samplePoint1 = fuzzyEqual(this.a, 0) ? Point.create(0, -this.b/ this.c) : Point.create(-this.b/this.a * y1 - this.c/this.a, y1);
        let samplePoint2 = fuzzyEqual(this.a, 0) ? Point.create(0, -this.b/ this.c) : Point.create(-this.b/this.a * y2 - this.c/this.a, y2);
        let perpendicularPoint1 = line.getPerpendicularBase(samplePoint1);
        let perpendicularPoint2 = line.getPerpendicularBase(samplePoint2);

        let newLinePoint1 = Point.create(2 * perpendicularPoint1.x - samplePoint1.x, 2 * perpendicularPoint1.y - samplePoint1.y);
        let newLinePoint2 = Point.create(2 * perpendicularPoint2.x - samplePoint2.x, 2 * perpendicularPoint2.y - samplePoint2.y);
        return Line.create(newLinePoint1, newLinePoint2);
    }

    getPerpendicularBase(point) {
        const _y = (this.a * this.a * point.y - this.a * this.b * point.x - this.b * this.c) / (this.b * this.b + this.a * this.a);
        const _x = this.a != 0 ? (-this.b / this.a * _y - this.c / this.a) : point.x;
        return {
            x: _x,
            y: _y
        };
    }
}

function getLineByPoints(p1, p2)
{
    return new Line(p2.y - p1.y, p1.x - p2.x,p2.x * p1.y - p1.x * p2.y);
}

class Point {
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
    }
    static create(x, y)
    {
        if(typeof y === 'undefined')
        {
            let a = x;
            return new Point(a.x, a.y);
        }
        else
            return new Point(x, y);
    }
    static sqrLength(a, b) {
        return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
    }
    static length(a, b) {
        return Math.sqrt(this.sqrLength(a, b));
    }
}
class Vector extends Point{
    constructor(x, y)
    {
        super(x,y);
    }
    static create(x, y)
    {
        if(typeof y === 'undefined')
        {
            let a = x;
            return new Vector(a.x, a.y);
        }
        else
            return new Vector(x, y);
    }
    static cross(a, b) {
        return a.x*b.y - b.x*a.y;
    }
    static dot(a, b) {
        return a.x*b.x + a.y*b.y;
    }
    sqrLength() {
        return this.x*this.x + this.y*this.y;
    }
    get length() {
        return Math.sqrt(this.sqrLength());
    }
}
class ParametricEdge {
    constructor(p0, v)
    {
        this.p0 = p0;
        this.v = v;
    }
    static create(p0, p1) {
        let v = Vector.create(p1.x - p0.x, p1.y - p0.y);
        return new ParametricEdge(p0, v);
    }
    get line() 
    {
        return Line.create(this.p0, Point.create(this.p0.x + this.v.x, this.p0.y + this.v.y));
    }

    get length()
    {
        return this.v.length;
    }

    lineIntersection(line) {
        if(fuzzyEqual(line.a * this.v.x + line.b * this.v.y, 0))
            return false;
        let t = -(line.a * this.p0.x + line.b * this.p0.y + line.c) / (line.a * this.v.x + line.b * this.v.y);
        return t >= 0 && t <= 1;
    }
    pointIntersection(point) {
        let t1 = null, t2 = null;
        
        if(fuzzyEqual(this.v.x, 0) )
        {
            if(fuzzyEqual(this.v.y, 0))
                return fuzzyEqual(point.x, this.p0.x) && fuzzyEqual(point.y, this.p0.y);
            t2 = (point.y - this.p0.y) / this.v.y;
            return fuzzyEqual(point.x, this.p0.x) && t2 >= 0 && t2 <= 1;
        }
        if(fuzzyEqual(this.v.y, 0))
        {
            t1 = (point.x - this.p0.x) / this.v.x;
            return fuzzyEqual(point.y, this.p0.y) && t1 >= 0 && t1 <= 1;
        }
        t1 = (point.x - this.p0.x) / this.v.x;
        t2 = (point.y - this.p0.y) / this.v.y;
        return fuzzyEqual(t1, t2) && t1 >= 0 && t1 <= 1;
    }
    #getPerpendicularBase(point, line) {
        const _y = (line.a * line.a * point.y - line.a * line.b * point.x - line.b * line.c) / (line.b * line.b + line.a * line.a);
        const _x = line.a != 0 ? (-line.b / line.a * _y - line.c / line.a) : point.x;
        return {
            x: _x,
            y: _y
        };
    }
    getNearestPoint(point, info) {
        let line = Line.create(this.p0 ,Point.create(this.p0.x + this.v.x, this.p0.y + this.v.y));
        let base = this.#getPerpendicularBase(point, line);
        if(this.pointIntersection(base))
        {
            if(typeof info !== 'undefined')
                info.type = "edge";
            return base;
        }

        let p1 = Point.create(this.p0.x + this.v.x, (this.p0.y + this.v.y));
        if(Point.length(this.p0, point) < Point.length(p1, point))
        {
            if(typeof info !== 'undefined')
                info.type = "start";
            return this.p0;
        }
        else
        {
            if(typeof info !== 'undefined')
                info.type = "end";
            return p1;
        }

        
    }

    static edgeIntersection(e1, e2)
    {
        let cross = Vector.cross(e1.v, e2.v);
        let v = Vector.create(e1.p0.x - e2.p0.x, e1.p0.y - e2.p0.y);
        if(fuzzyEqual(cross, 0))
            return null;

        let t1 = Vector.cross(e2.v, v) / cross;
        let t2 = Vector.cross(e1.v, v) / cross;

        if(-EPS < t1 && t1 < 1 + EPS && -EPS < t2 && t2 < 1 + EPS)
            return Point.create(e1.v.x * t1 + e1.p0.x, e1.v.y * t1 + e1.p0.y);
        else
            return null;

    }
}
class Polygon {
    constructor(list)
    {
        this.vertices = [...list];
        this.fixBypassByReverse();
        this.aabb = AABB.create(this.vertices);
    }
    get verticesCount() {
        return this.vertices.length;
    }
    static create(list) {
        return new Polygon(list);
    }

    makeOffset(offset)
    {
        let q = this.getListVertices();

        if(q === null)
            return;
        let offset_lines = [];
        for(let i = 0; i < this.verticesCount;i++)
        {
            let line = Line.create(this.getVertex(i), this.getVertex(i+1));
            let v = Vector.create(this.getVertex(i+1).x - this.getVertex(i).x, this.getVertex(i+1).y - this.getVertex(i).y);
            let n = Vector.create(line.a, line.b);

            let sign = Vector.cross(n,v) < 0 ? -1 : 1;
            let lenN = n.length;
            n.x = sign * offset * n.x / lenN;
            n.y = sign * offset * n.y / lenN;
            offset_lines.push(Line.create(Point.create(this.getVertex(i).x + n.x, this.getVertex(i).y + n.y), 
            Point.create(this.getVertex(i + 1).x + n.x, this.getVertex(i + 1).y + n.y)));
        }
        for(let i = 0; i < this.verticesCount;i++)
            this.vertices[i] = Line.linesIntersection(offset_lines[i], offset_lines[(i + 1) % this.verticesCount]);
        
        this.fixBypassByReverse();
        this.aabb = AABB.create(this.vertices);
    }

    getListVertices() {
        return this.vertices;
    }
    getCycleIndex(index)
    {
        let M = this.vertices.length;
        return (M + index % M) % M;
    }

    fixBypassByReverse()
    {
        if(this.vertices.length >= 3 && Vector.cross(this.getEdge(0).v, this.getEdge(1).v) < 0)
            this.vertices.reverse();
    }
    static bypassSign(vertices)
    {
        let e1 = Point.create(vertices[1].x - vertices[0].x, vertices[1].y - vertices[0].y);
        let e2 = Point.create(vertices[2].x - vertices[1].x, vertices[2].y - vertices[1].y);
        return Vector.cross(e1, e2) > 0 ? 1 : -1;
    }
    getVertex(index)
    {
        return this.vertices[this.getCycleIndex(index)];
    }
    getEdge(index)
    {
        return ParametricEdge.create(this.getVertex(index), this.getVertex(index+1));
    }
    map(callback){
        return Polygon.create(this.vertices.map(callback));
    }
    #getNearestPointWithNormal(point) {
        let index = 0;

        let info = {};
        let nearestPoint = this.getEdge(0).getNearestPoint(point, info);
        let min_length = Point.length(nearestPoint, point);
        

        for(let i = 0; i < this.vertices.length; i++)
        {
            let cur_info = {};
            let cur_nearestPoint = this.getEdge(i).getNearestPoint(point, cur_info);
            let cur_length = Point.length(cur_nearestPoint, point);
            if(min_length > cur_length)
            {
                
                index = i;
                min_length = cur_length;
                nearestPoint = cur_nearestPoint;
                info = cur_info;
            }
        }

        if(info.type === "edge")
            return { n: this.#getEdgeNormal(index), p: nearestPoint };
        else if(info.type === "start")
            return { n: this.#getVertexNormal(index), p: nearestPoint };
        else
            return { n: this.#getVertexNormal(index + 1), p: nearestPoint };
    }
    pointIntersection(point) {
        if(!this.aabb.pointIntersection(point))
            return false;
        let info = this.#getNearestPointWithNormal(point);
        let n = info.n;
        let v = Point.create(point.x - info.p.x, point.y - info.p.y);

        return Vector.dot(n, v) - EPS < 0;

    }

    #getEdgeNormal(index) {
        let edge = this.getEdge(index);
        let v = edge.v;

        let n = Vector.create(-v.y, v.x);
        if(Vector.cross(n, v) < 0)
            {
                n.x = -n.x;
                n.y = -n.y;
            }
        return n;
    }
    #getVertexNormal(index) {
        let n1 = this.#getEdgeNormal(index);
        let n2 = this.#getEdgeNormal(index + 1);
        return Vector.create((n1.x + n2.x) / 2, (n1.y + n2.y) / 2);
    }
}

class AABB {
    constructor(minx, miny, maxx, maxy)
    {
        this.minx = minx;
        this.miny = miny;
        this.maxx = maxx;
        this.maxy = maxy;
    }
    static create(points)
    {
        let minx = 0;
        let miny = 0;
        let maxx = 0;
        let maxy = 0;
        points.forEach(el => {
            if(minx > el.x)
                minx = el.x;
            if(miny > el.y)
                miny = el.y;
            if(maxx < el.x)
                maxx = el.x;
            if(maxy < el.y)
                maxy = el.y;
        });
        
        return new AABB(minx, miny, maxx, maxy);
    }
    pointIntersection(point)
    {
        return (this.minx - EPS < point.x && point.x < this.maxx + EPS) &&
            (this.miny - EPS < point.y && point.y < this.maxy + EPS);
    }
}
function fuzzyEqual(a, b) {
    return Math.abs(a-b) < EPS;
}
function cross(a, b) {
    return a.x*b.y - b.x*a.y;
}
function dot(a, b) {
    return a.x*b.x + a.y*b.y;
}
function getTriangleArea(p1, p2, p3) {
    let a = Point.length(p1, p2), 
        b = Point.length(p2, p3),
        c = Point.length(p3, p1);
    let p = (a + b + c) / 2;
    return Math.sqrt(p*(p - a)*(p - b)*(p - c));
}
function getQuadrangleArea(p1,p2,p3,p4)
{
    return getTriangleArea(p1,p2,p3) + getTriangleArea(p1,p3,p4)
}
function getRootsOfSqrEq(a, b, c) {
    let D = b*b - 4*a*c;
    if(D < 0)
        return null;
    return [
        (-b + Math.sqrt(D))/ (2*a),
        (-b - Math.sqrt(D))/ (2*a)
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

