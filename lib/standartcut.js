class StandartCut {
    constructor(convexhull) {

        this.min_quadrangle = null;
        this.min_area = Infinity;

        this.convexhull = convexhull;
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
        let sample = [-leftTopLine.c / leftTopLine.a, -leftBottomLine.c / leftBottomLine.a, -rightBottomLine.c / rightBottomLine.a, -rightTopLine.c / rightTopLine.a].map(el => el = Math.abs(el));
        let max = Math.max(...sample);
        let max_ind = sample.indexOf(max);


        lines[(max_ind + 1) % 4] = lines[max_ind].symmetricByLine(new Line(1, 0, 0));
        lines[(max_ind + 2) % 4] = lines[max_ind].symmetricByLine(new Line(lines[max_ind].a, lines[max_ind].b, 0));
        lines[(max_ind + 3) % 4] = lines[max_ind].symmetricByLine(new Line(0, 1, 0));

        let q0 = Line.linesIntersection(lines[0], lines[1]);
        let q1 = Line.linesIntersection(lines[1], lines[2]);
        let q2 = Line.linesIntersection(lines[2], lines[3]);
        let q3 = Line.linesIntersection(lines[3], lines[0]);

        this.min_quadrangle = Polygon.create(this.#reassignCut([q0, q1, q2, q3]));
        this.min_area = getQuadrangleArea(q0, q1, q2, q3);

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
        return this.min_quadrangle;
    }
    getArea() {
        return this.min_area;
    }

}

