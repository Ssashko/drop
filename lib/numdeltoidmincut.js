class NumDeltoidMinimumCircumscribeCut {
    constructor(roundedConvexHull, restrictions, h = 0.075, aabb = new AABB(-1, -1, 1, 1)) {
        this.min_quadrangle = null;
        this.min_area = Infinity;
        this.restrictions = restrictions;
        this.h = h;
        this.aabb = aabb;
        this.roundedConvexHull = roundedConvexHull;
        this.convexhull = Polygon.create(
            roundedConvexHull.innerConvexHullVertices);
        this.convexhull.makeOffset(roundedConvexHull.normalOffset);

        this.iterationCount = 0;
    }

    static create(obj) {
        let restrictions = {
            rightAngle: Range.create(obj.restrictions.rightAngle.l, obj.restrictions.rightAngle.r),
            bottomAngle: Range.create(obj.restrictions.bottomAngle.l, obj.restrictions.bottomAngle.r),
            leftAngle: Range.create(obj.restrictions.leftAngle.l, obj.restrictions.leftAngle.r),
            topAngle: Range.create(obj.restrictions.topAngle.l, obj.restrictions.topAngle.r),
            Yangle: Range.create(obj.restrictions.Yangle.l, obj.restrictions.Yangle.r)
        }
        let h = obj.h;
        let aabb = new AABB(obj.aabb.minx, obj.aabb.miny, obj.aabb.maxx, obj.aabb.maxy);
        let min_quadrangle = obj.min_quadrangle == null ? null : Polygon.create(obj.min_quadrangle.vertices);
        let min_area = obj.min_area;
        let iterationCount = obj.iterationCount;

        const roundedConvexHull = RoundedConvexHull.createFromJson(obj.roundedConvexHull);
        let res = new NumDeltoidMinimumCircumscribeCut(roundedConvexHull, restrictions, h, aabb);
        res.min_quadrangle = min_quadrangle;
        res.min_area = min_area;
        res.iterationCount = iterationCount;
        return res;
    }

    static testCase1() {
        let convexhull = Polygon.create([{ x: - 0.3, y: 0.1 }, { x: - 0.3, y: - 0.2 },
        { x: 0, y: -0.3 }, { x: 0.2, y: - 0.2 }, { x: 0.3, y: 0 }, { x: 0.2, y: 0.3 },]);


        let restrictions = {
            rightAngle: Range.create(toRadians(0), toRadians(180)),
            bottomAngle: Range.create(toRadians(0), toRadians(180)),
            leftAngle: Range.create(toRadians(0), toRadians(180)),
            topAngle: Range.create(toRadians(0), toRadians(180)),
            Yangle: Range.create(toRadians(0), toRadians(90))
        }

        // TODO: roundedConvexHull
        let cut = new NumDeltoidMinimumCircumscribeCut(convexhull, restrictions);
        cut.test(Point.create(0, -0.35));
    }
    test(Pbot) {
        let lineh = this.h / (this.aabb.maxx - this.aabb.minx);
        let leftTangent = this.#getTangent(Pbot);
        let rightTangent = this.#getTangent(Pbot, -1);

        let leftVectorTangent = Vector.create(leftTangent.x - Pbot.x, leftTangent.y - Pbot.y).normalize;
        let rightVectorTangent = Vector.create(rightTangent.x - Pbot.x, rightTangent.y - Pbot.y).normalize;

        let bisectorPoint = Point.mid(
            Point.create(Pbot.x + leftVectorTangent.x, Pbot.y + leftVectorTangent.y),
            Point.create(Pbot.x + rightVectorTangent.x, Pbot.y + rightVectorTangent.y)
        );
        let bisectorVector = Vector.create(bisectorPoint.x - Pbot.x, bisectorPoint.y - Pbot.y).normalize;

        bisectorVector = bisectorVector.scale(this.#getMaxBisectorLength(bisectorVector, bisectorPoint, Pbot));

        let bisectorSector = new ParametricEdge(Pbot, bisectorVector);

        let leftLine = Line.create(leftTangent, Pbot);
        let rightLine = Line.create(rightTangent, Pbot);

        for (let t1 = 0; t1 < 1; t1 += lineh) {
            let NbisectorLine = Line.createByPointVector(bisectorSector.getPointByParam(t1), bisectorVector.normal);
            let Pleft = Line.linesIntersection(leftLine, NbisectorLine);
            let Pright = Line.linesIntersection(rightLine, NbisectorLine);
            for (let t2 = t1; t2 < 2; t2 += lineh) {
                let Ptop = bisectorSector.getPointByParam(t2);

                let pol = Polygon.create([Ptop, Pleft, Pbot, Pright]);

                if (!this.#filter(pol)) continue;

                let pol_square = pol.square;
                if (this.min_area > pol_square) {
                    this.min_quadrangle = pol;
                    this.min_area = pol_square;
                }
            }
        }
    }
    #promoteExecution() {
        let xMax = Math.ceil((this.aabb.maxx + EPS - this.aabb.minx) / this.h);
        let yMax = Math.ceil((this.aabb.maxy + EPS - this.aabb.miny) / this.h);
        let maxIterationCount = xMax * yMax;
        let val = this.iterationCount++ / maxIterationCount * 100;
        return Math.min(val, 100);
    }
    findSolution() {

        let lineh = this.h / (this.aabb.maxx - this.aabb.minx);

        for (let p1x = this.aabb.minx; p1x < this.aabb.maxx + EPS; p1x += this.h)
            for (let p1y = this.aabb.miny; p1y < this.aabb.maxy + EPS; p1y += this.h) {
                let Pbot = Point.create(p1x, p1y);

                let leftTangent = this.#getTangent(Pbot);
                let rightTangent = this.#getTangent(Pbot, -1);

                let leftVectorTangent = Vector.create(leftTangent.x - Pbot.x, leftTangent.y - Pbot.y).normalize;
                let rightVectorTangent = Vector.create(rightTangent.x - Pbot.x, rightTangent.y - Pbot.y).normalize;

                let bisectorPoint = Point.mid(
                    Point.create(Pbot.x + leftVectorTangent.x, Pbot.y + leftVectorTangent.y),
                    Point.create(Pbot.x + rightVectorTangent.x, Pbot.y + rightVectorTangent.y)
                );
                let bisectorVector = Vector.create(bisectorPoint.x - Pbot.x, bisectorPoint.y - Pbot.y).normalize;

                bisectorVector = bisectorVector.scale(this.#getMaxBisectorLength(bisectorVector, bisectorPoint, Pbot));

                let bisectorSector = new ParametricEdge(Pbot, bisectorVector);

                let leftLine = Line.create(leftTangent, Pbot);
                let rightLine = Line.create(rightTangent, Pbot);

                for (let t1 = 0; t1 < 1; t1 += lineh) {
                    let NbisectorLine = Line.createByPointVector(bisectorSector.getPointByParam(t1), bisectorVector.normal);
                    let Pleft = Line.linesIntersection(leftLine, NbisectorLine);
                    let Pright = Line.linesIntersection(rightLine, NbisectorLine);
                    if (Pleft == null || Pright == null) continue;
                    for (let t2 = t1; t2 < 2; t2 += lineh) {
                        let Ptop = bisectorSector.getPointByParam(t2);

                        let pol = Polygon.create([Ptop, Pleft, Pbot, Pright]);
                        // pol.makeOffset(this.roundedConvexHull.normalOffset);

                        if (!this.#filter(pol)) continue;

                        let pol_square = pol.square;
                        if (this.min_area > pol_square) {
                            this.min_quadrangle = pol;
                            this.min_area = pol_square;
                        }
                    }
                }
                postMessage({ type: "pending", obj: this.#promoteExecution() });
            }
    }

    #getViewportLineIntersection(bisector) {
        let eps = EPS * 10;
        let aabb = new AABB(-1 - eps, -1 - eps, 1 + eps, 1 + eps);
        let line = [];
        line.push(Line.create(Point.create(-1, 1), Point.create(1, 1)));
        line.push(Line.create(Point.create(-1, 1), Point.create(-1, -1)));
        line.push(Line.create(Point.create(-1, -1), Point.create(1, -1)));
        line.push(Line.create(Point.create(-1, 1), Point.create(1, 1)));
        let point = [];
        line.forEach(l => {
            let p = Line.linesIntersection(bisector, l);
            if (aabb.pointIntersection(p))
                point.push(p);
        });

        return point;
    }

    #getMaxBisectorLength(bisectorVector, bisectorPoint, Pstart) {
        let points = this.#getViewportLineIntersection(Line.createByPointVector(bisectorPoint, bisectorVector));

        for (let i = 0; i < points.length; i++) {
            let v = Vector.create(points[i].x - Pstart.x, points[i].y - Pstart.y);
            if (Vector.dot(bisectorVector, v) > 0)
                return v.length;
        }
    }

    #getTangent(p, sign = 1) {
        let pred = (a, b) => {
            let v1 = Vector.create(a.x - p.x, a.y - p.y);
            let v2 = Vector.create(b.x - p.x, b.y - p.y);
            return sign * Vector.cross(v1, v2) > 0;
        };
        return this.convexhull.getListVertices().reduce(
            (min, el) => pred(min, el) ? el : min,
            this.convexhull.getVertex(0)
        );
    }

    getCut() {
        return this.min_quadrangle;
    }
    getArea() {
        return this.min_area;
    }
    #filter(pol) {

        if (pol.checkSelfIntersection() || !pol.checkConvexity())
            return false;

        if (!this.restrictions.topAngle.check(Vector.angleBetween(pol.getEdge(0).v, pol.getEdge(-1).v.inverseSign()))
            || !this.restrictions.leftAngle.check(Vector.angleBetween(pol.getEdge(1).v, pol.getEdge(0).v.inverseSign()))
            || !this.restrictions.rightAngle.check(Vector.angleBetween(pol.getEdge(-2).v, pol.getEdge(-1).v.inverseSign()))
            || !this.restrictions.bottomAngle.check(Vector.angleBetween(pol.getEdge(2).v, pol.getEdge(1).v.inverseSign()))
            || !this.restrictions.Yangle.check(Vector.angleBetween(pol.getDiagonal(0, 2).v, Vector.create(0, -1))))
            return false;

        if (!isRoundedConvexHullInsideQuadrangle(pol.getListVertices(), this.roundedConvexHull)) {
            return false;
        }
        return true;
    }
}