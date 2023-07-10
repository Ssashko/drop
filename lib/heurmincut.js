class MinimumCircumscribeCut {
    constructor(convexhull) {

        this.min_quadrangle = null;
        this.min_area = Infinity;

        this.convexhull = convexhull;
    }

    #findMinimumCutThroughTwoSideAndPoint() {
        for (let i = 0; i < this.convexhull.verticesCount; i++)
            for (let point_ind = 0; point_ind < this.convexhull.verticesCount; point_ind++)
                try {
                    let l1 = this.convexhull.getEdge(i).line;
                    let p = this.convexhull.getVertex(point_ind);
                    let h = fuzzyEqual(l1.b, 0) ? 2 * p.y : (2 * l1.a * p.x + 2 * l1.b * p.y + l1.c) / l1.b;

                    let q1 = Point.create(2 * p.x, 2 * p.y - h);
                    let q2 = Point.create(0, h);
                    let d = Point.sqrLength(q1, q2);

                    for (let j = 0; j < this.convexhull.verticesCount; j++)
                        try {

                            let q0 = Line.linesIntersection(this.convexhull.getEdge(i).line,
                                this.convexhull.getEdge(j).line);
                            let l2 = this.convexhull.getEdge(j).line;
                            let q3 = this.#findPointsOnLineWithSpecificDistanceFromSpecificPoint(l2, h, d);

                            if (this.#checkQuadrangle(q0, q1, q2, q3[0]) && (this.min_area > getQuadrangleArea(q0, q1, q2, q3[0]))) {
                                this.min_quadrangle = [q0, q1, q2, q3[0]];
                                this.min_area = getQuadrangleArea(q0, q1, q2, q3[0]);
                            }

                            if (this.#checkQuadrangle(q0, q1, q2, q3[1]) && (this.min_area > getQuadrangleArea(q0, q1, q2, q3[1]))) {
                                this.min_quadrangle = [q0, q1, q2, q3[1]];
                                this.min_area = getQuadrangleArea(q0, q1, q2, q3[1]);
                            }
                        }
                        catch (e) {
                            continue;
                        }
                }
                catch (e) {
                    continue;
                }

    }
    #findMinimumCutThroughThreeSide() {
        for (let i = 0; i < this.convexhull.verticesCount; i++)
            for (let j = 0; j < this.convexhull.verticesCount; j++)
                try {
                    let q2 = Line.linesIntersection(Line.create(Point.create(0, 1), Point.create(0, -1)), this.convexhull.getEdge(j).line);
                    let h = q2.y;
                    if (h === null) continue;
                    let q1 = Line.linesIntersection(this.convexhull.getEdge(i).line, this.convexhull.getEdge(j).line);
                    let d = Point.sqrLength(q1, q2);

                    for (let k = 0; k < this.convexhull.verticesCount; k++)
                        try {
                            let q0 = Line.linesIntersection(this.convexhull.getEdge(i).line, this.convexhull.getEdge(k).line);
                            let l2 = this.convexhull.getEdge(k).line;
                            let q3 = this.#findPointsOnLineWithSpecificDistanceFromSpecificPoint(l2, h, d);

                            if (this.#checkQuadrangle(q0, q1, q2, q3[0]) && (this.min_area > getQuadrangleArea(q0, q1, q2, q3[0]))) {
                                this.min_quadrangle = [q0, q1, q2, q3[0]];
                                this.min_area = getQuadrangleArea(q0, q1, q2, q3[0]);
                            }

                            if (this.#checkQuadrangle(q0, q1, q2, q3[1]) && (this.min_area > getQuadrangleArea(q0, q1, q2, q3[1]))) {
                                this.min_quadrangle = [q0, q1, q2, q3[1]];
                                this.min_area = getQuadrangleArea(q0, q1, q2, q3[1]);
                            }
                        }
                        catch (e) {
                            continue;
                        }
                }
                catch (e) {
                    continue;
                }

    }

    #findPointsOnLineWithSpecificDistanceFromSpecificPoint(l2, h, d) {

        if (fuzzyEqual(l2.a, 0)) {
            let y = -l2.c / l2.b;

            return [
                Point.create(Math.sqrt(-y * y + 2 * h * y - h * h + d), y),
                Point.create(-Math.sqrt(-y * y + 2 * h * y - h * h + d), y)
            ];
        }
        else {
            let y = getRootsOfSqrEq(l2.a * l2.a + l2.b * l2.b, 2 * l2.b * l2.c - 2 * h * l2.a * l2.a, l2.c * l2.c + l2.a * l2.a * (h * h - d));

            if (y === null)
                return [
                    Point.create(Infinity, Infinity),
                    Point.create(Infinity, Infinity)
                ]

            return [
                Point.create(-(l2.b * y[0] + l2.c) / l2.a, y[0]),
                Point.create(-(l2.b * y[1] + l2.c) / l2.a, y[1])
            ];

        }
    }
   

    findSolution() {
        this.#findMinimumCutThroughTwoSideAndPoint();
        this.#findMinimumCutThroughThreeSide();
    }

    getCut() {
        return Polygon.create(this.min_quadrangle);
    }
    getArea() {
        return this.min_area;
    }
    #checkQuadrangle(q0, q1, q2, q3) {

        let aabb = new AABB(-1, -1, 1, 1);
        if (!aabb.pointIntersection(q0) || !aabb.pointIntersection(q1) ||
            !aabb.pointIntersection(q2) || !aabb.pointIntersection(q3))
            return false;

        let pol = Polygon.create([q0, q1, q2, q3]);

        if (!(q0.y > q1.y && q0.y > q2.y && q0.y > q3.y) || !(q2.y < q0.y && q2.y < q1.y && q2.y < q3.y))
            return false;

        for (let i = 0; i < 4; i++)
            if (Vector.cross(pol.getEdge(i).v, pol.getEdge(i + 1).v) < 0)
                return false;

        if (ParametricEdge.edgeIntersection(pol.getEdge(0), pol.getEdge(2)) !== null || ParametricEdge.edgeIntersection(pol.getEdge(1), pol.getEdge(3)) !== null)
            return false;

        for (let i = 0; i < this.convexhull.verticesCount; i++)
            if (!pol.pointIntersection(this.convexhull.getVertex(i)))
                return false;
        return true;
    }

}

