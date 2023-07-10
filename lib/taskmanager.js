class Task {
    constructor(convexhull, tasks) {
        this.convexhull = convexhull;
        this.min_quadrangle = null;
        this.min_area = Infinity;
        this.restrictions = {
            rightAngle: Range.create(toRadians(100), toRadians(150)),
            bottomAngle: Range.create(toRadians(30), toRadians(80)),
            leftAngle: Range.create(toRadians(100), toRadians(150)),
            topAngle: Range.create(toRadians(30), toRadians(80)),
            Yangle: Range.create(toRadians(0), toRadians(15))
        }
        this.h = 0.15;

        this.standart = tasks.standart ? new StandartCut(this.convexhull) : null;
        this.heuristicMethod = tasks.heuristic_method ? new MinimumCircumscribeCut(this.convexhull) : null;
        this.numericalMethod = tasks.numerical_method ? new NumMinimumCircumscribeCut(this.convexhull,
            this.restrictions, this.h) : null;
    }


    getRestCut() {
        let q0 = Point.create(min_quadrangle.getVertex(0));
        let q1 = Point.create(min_quadrangle.getVertex(1));
        let q2 = Point.create(min_quadrangle.getVertex(2));
        let q3 = Point.create(min_quadrangle.getVertex(3));
        let v1 = Vector.create(q1.x - q2.x, q1.y - q2.y);
        let v2 = Vector.create(q3.x - q2.x, q3.y - q2.y);
        let angle = Vector.angleBetween(v1, v2);
        return Polygon.create([q3.rotate(q2, angle), q0.rotate(q2, angle), q1.rotate(q2, angle)]).getListVertices();
    }

    exec() {
        if (this.standart !== null) {
            this.standart.findSolution();
            if (this.standart.getArea() < this.min_area) {
                this.min_quadrangle = this.standart.getCut();
                this.min_area = this.standart.getArea();
            }
        }

        if (this.heuristicMethod !== null) {
            this.heuristicMethod.findSolution();
            if (this.heuristicMethod.getArea() < this.min_area) {
                this.min_quadrangle = this.heuristicMethod.getCut();
                this.min_area = this.heuristicMethod.getArea();
            }
        }

        if (this.numericalMethod !== null) {
            console.log(`Num Method Started`);
            const start = Date.now();
            this.numericalMethod.findSolution();
            const end = Date.now();
            console.log(`Execution time: ${end - start} ms`);

            if (this.numericalMethod.getArea() < this.min_area) {
                this.min_quadrangle = this.numericalMethod.getCut();
                this.min_area = this.numericalMethod.getArea();
            }
        }

        if (this.min_quadrangle === null)
            this.#setDefault();

    }
    getCut() {
        return this.min_quadrangle;
    }
    #setDefault() {
        let aabb = this.convexhull.aabb;

        this.min_quadrangle = Polygon.create([Point.create(aabb.minx, aabb.maxy),
        Point.create(aabb.minx, aabb.miny),
        Point.create(aabb.maxx, aabb.miny),
        Point.create(aabb.maxx, aabb.maxy)]);
        this.min_area = this.min_quadrangle.area;
    }
}