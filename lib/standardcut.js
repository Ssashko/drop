class StandardCut {
    constructor(convexhull, offset) {
        this.vertices = null;
        this.area = Infinity;

        this.convexhull = convexhull;
        this.offset = offset;
    }

    findSolution() {
        let rightTopPoint = this.convexhull.getVertex(0);
        let rightBottomPoint = this.convexhull.getVertex(0);
        let leftTopPoint = this.convexhull.getVertex(0);
        let leftBottomPoint = this.convexhull.getVertex(0);

        let points = this.convexhull.getListVertices();

        points.forEach(el => {
            let v = Vector.create(Math.cos(1.0 / 6 * Math.PI), Math.sin(1.0 / 6 * Math.PI));
            if (Vector.dot(v, rightTopPoint) < Vector.dot(v, el))
                rightTopPoint = el;
        });
        let rightTopLine = Line.create(rightTopPoint, Point.create(rightTopPoint.x + Math.sin(1.0 / 6 * Math.PI), rightTopPoint.y - Math.cos(1.0 / 6 * Math.PI)));

        points.forEach(el => {
            let v = Vector.create(Math.cos(-5.0 / 6 * Math.PI), Math.sin(-5.0 / 6 * Math.PI));
            if (Vector.dot(v, leftBottomPoint) < Vector.dot(v, el))
                leftBottomPoint = el;
        });
        let leftBottomLine = Line.create(leftBottomPoint, Point.create(leftBottomPoint.x + Math.sin(-5.0 / 6 * Math.PI), leftBottomPoint.y - Math.cos(-5.0 / 6 * Math.PI)));

        points.forEach(el => {
            let v = Vector.create(Math.cos(-1.0 / 6 * Math.PI), Math.sin(-1.0 / 6 * Math.PI));
            if (Vector.dot(v, rightBottomPoint) < Vector.dot(v, el))
                rightBottomPoint = el;
        });
        let rightBottomLine = Line.create(rightBottomPoint, Point.create(rightBottomPoint.x + Math.sin(-1.0 / 6 * Math.PI), rightBottomPoint.y - Math.cos(-1.0 / 6 * Math.PI)));

        points.forEach(el => {
            let v = Vector.create(Math.cos(5.0 / 6 * Math.PI), Math.sin(5.0 / 6 * Math.PI));
            if (Vector.dot(v, leftTopPoint) < Vector.dot(v, el))
                leftTopPoint = el;
        });
        let leftTopLine = Line.create(leftTopPoint, Point.create(leftTopPoint.x + Math.sin(5.0 / 6 * Math.PI), leftTopPoint.y - Math.cos(5.0 / 6 * Math.PI)));

        let lines = [leftTopLine, leftBottomLine, rightBottomLine, rightTopLine];

        let q0 = Line.linesIntersection(lines[0], lines[1]);
        let q1 = Line.linesIntersection(lines[1], lines[2]);
        let q2 = Line.linesIntersection(lines[2], lines[3]);
        let q3 = Line.linesIntersection(lines[3], lines[0]);

        const toRhombus = (p1, p2, d) => {
            const midQ0Q1 = Point.mid(p1, p2);
            let v = Vector.create(p1.x - midQ0Q1.x,
                p1.y - midQ0Q1.y);
            v = v.normalize;
            v.x *= d;
            v.y *= d;
            let result = [
                Point.create(midQ0Q1.x, midQ0Q1.y),
                Point.create(midQ0Q1.x, midQ0Q1.y)
            ]
            result[0].shift(v);
            v = v.inverseSign();
            result[1].shift(v);
            return result;
        };
        const distQ0Q1 = calcDistance(q0, q1);
        const distQ1Q2 = calcDistance(q1, q2);
        if (distQ0Q1 < distQ1Q2) {
            let verticesPair = toRhombus(q0, q1, distQ1Q2 / 2);
            q0 = verticesPair[0];
            q1 = verticesPair[1];
            verticesPair = toRhombus(q2, q3, distQ1Q2 / 2);
            q2 = verticesPair[0];
            q3 = verticesPair[1];
        }
        else {
            let verticesPair = toRhombus(q1, q2, distQ0Q1 / 2);
            q1 = verticesPair[0];
            q2 = verticesPair[1];
            verticesPair = toRhombus(q3, q0, distQ0Q1 / 2);
            q3 = verticesPair[0];
            q0 = verticesPair[1];
        }

        let polygon = Polygon.create([q0, q1, q2, q3]);
        polygon.makeOffset(this.offset);

        this.vertices = this.#reassignCut(polygon.getListVertices());
        this.area = getQuadrangleArea(...this.vertices);
    }

    #reassignCut(list) {
        let i = 0;
        let min_y = list[0].y;
        list.forEach((el, index) => {
            if (el.y < min_y) {
                min_y = el.y;
                i = index;
            }
        });
        return [list[(i + 2) % 4], list[(i + 3) % 4], list[i], list[(i + 1) % 4]];
    }

    getCut() {
        return Polygon.create(this.vertices);
    }

    getArea() {
        return this.area;
    }
}

