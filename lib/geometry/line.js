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
    static createByPointVector(p, v)
    {
        return Line.create(p, Point.create(p.x + v.x, p.y + v.y));
    }

    checkPoint(p)
    {
        return Math.abs(this.a * p.x + this.b * p.y + this.c) < EPS;
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

    getPointByParam(t) {
        return Point.create(
            this.p0.x + this.v.x * t,
            this.p0.y + this.v.y * t
        );
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
    getNearestPoint(point) {
        let line = Line.create(this.p0 ,Point.create(this.p0.x + this.v.x, this.p0.y + this.v.y));
        let base = this.#getPerpendicularBase(point, line);
        if(this.pointIntersection(base))
            return {point : base, type : "edge"};

        let p1 = Point.create(this.p0.x + this.v.x, (this.p0.y + this.v.y));
        if(Point.length(this.p0, point) < Point.length(p1, point))
            return {point : this.p0, type : "start"};
        else
            return {point : p1, type : "end"};
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