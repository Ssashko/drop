class NumMinimumCircumscribeCut {
    constructor(convexhull, restrictions, h = 0.075, aabb = new AABB(-1, -1, 1, 1)) {
        this.min_quadrangle = null;
        this.min_area = Infinity;
        this.restrictions = restrictions;
        this.h = h;
        this.aabb = aabb;
        this.convexhull = convexhull;
    }

    findSolution() {
        for (let p1x = this.aabb.minx; p1x < this.aabb.maxx + EPS; p1x += this.h)
            for (let p1y = this.aabb.miny; p1y < this.aabb.maxy + EPS; p1y += this.h) {
                let Ptop = Point.create(p1x, p1y);
                for (let p2x = this.aabb.minx; p2x < this.aabb.maxx + EPS; p2x += this.h)
                    for (let p2y = this.aabb.miny; p2y < Ptop.y + this.h; p2y += this.h) {
                        let Pbot = Point.create(p2x, p2y);
                        for (let p3x = 0; p3x < this.aabb.maxx + EPS; p3x += this.h)
                            for (let p3y = Pbot.y + this.h; p3y < Ptop.y + this.h; p3y += this.h) {
                                let Pright = Point.create(p3x, p3y);
                                let R = Point.length(Pright, Pbot);
                                if (Math.abs(R) < EPS) continue;

                                for (let t = 0; t < 2 * Math.PI + EPS; t += Math.PI * R * this.h) {
                                    let Pleft = Point.create(R * Math.cos(t) + Pbot.x, R * Math.sin(t) + Pbot.y);
                                    if (Pleft.x > EPS || Pleft.y > Ptop.y || Pleft.y < Pbot.y) continue;

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
            }
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

        for (let i = 0; i < this.convexhull.verticesCount; i++)
            if (!pol.pointIntersection(this.convexhull.getVertex(i)))
                return false;
        return true;
    }
}