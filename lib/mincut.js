class MinimumCircumscribeCut
{
    constructor(points)
    {
        
        this.min_quadrangle = null;
        this.min_area = Infinity;

        this.convexhull = ConvexHull.create(points).getPolygon();
    }
    
    #findMinimumCutThroughTwoSideAndPoint()
    {
        for(let i = 0; i < this.convexhull.verticesCount; i++)
            for(let point_ind = 0; point_ind < this.convexhull.verticesCount; point_ind++)
            try
                {
                let l1 = this.convexhull.getEdge(i).line;
                let p = this.convexhull.getVertex(point_ind);
                let h = fuzzyEqual(l1.b, 0) ? 2 * p.y : (2 * l1.a * p.x + 2 * l1.b * p.y + l1.c) / l1.b;

                let q1 = Point.create(2 * p.x, 2 * p.y - h);
                let q2 = Point.create(0,  h);
                let d = Point.sqrLength(q1, q2);

                for(let j = 0; j < this.convexhull.verticesCount; j++)
                try
                {

                    let q0 = Line.linesIntersection(this.convexhull.getEdge(i).line, 
                             this.convexhull.getEdge(j).line);
                    let l2 = this.convexhull.getEdge(j).line;
                    let q3 = this.#findPointsOnLineWithSpecificDistanceFromSpecificPoint(l2,h,d);

                    if(this.#checkQuadrangle(q0, q1, q2, q3[0]) && (this.min_area > getQuadrangleArea(q0, q1, q2, q3[0])))
                    {
                        this.min_quadrangle = [q0, q1, q2, q3[0]];
                        this.min_area = getQuadrangleArea(q0, q1, q2, q3[0]);
                    }

                    if(this.#checkQuadrangle(q0, q1, q2, q3[1]) && (this.min_area > getQuadrangleArea(q0, q1, q2, q3[1])))
                    {
                        this.min_quadrangle = [q0, q1, q2, q3[1]];
                        this.min_area = getQuadrangleArea(q0, q1, q2, q3[1]);
                    }
                }
                catch(e)
                {
                    continue;
                }
            }
            catch(e)
            {
                continue;
            }
                    
    }
    #findMinimumCutThroughThreeSide()
    {
        for(let i = 0; i < this.convexhull.verticesCount; i++)
            for(let j = 0; j < this.convexhull.verticesCount; j++)
                try
                {
                    let q2 = Line.linesIntersection(Line.create(Point.create(0, 1), Point.create(0, -1)), this.convexhull.getEdge(j).line);
                    let h = q2.y;
                    if(h === null) continue;
                    let q1 = Line.linesIntersection(this.convexhull.getEdge(i).line, this.convexhull.getEdge(j).line);
                    let d = Point.sqrLength(q1, q2);
                
                    for(let k = 0; k < this.convexhull.verticesCount; k++)
                        try
                        {
                            let q0 = Line.linesIntersection(this.convexhull.getEdge(i).line, this.convexhull.getEdge(k).line);
                            let l2 = this.convexhull.getEdge(k).line;
                            let q3 = this.#findPointsOnLineWithSpecificDistanceFromSpecificPoint(l2,h,d);

                            if(this.#checkQuadrangle(q0, q1, q2, q3[0]) && (this.min_area > getQuadrangleArea(q0, q1, q2, q3[0])))
                            {
                                this.min_quadrangle = [q0, q1, q2, q3[0]];
                                this.min_area = getQuadrangleArea(q0, q1, q2, q3[0]);
                            }

                            if(this.#checkQuadrangle(q0, q1, q2, q3[1]) && (this.min_area > getQuadrangleArea(q0, q1, q2, q3[1])))
                            {
                                this.min_quadrangle = [q0, q1, q2, q3[1]];
                                this.min_area = getQuadrangleArea(q0, q1, q2, q3[1]);
                            }
                        }
                        catch(e)
                        {
                            continue;
                        }
                }
                catch(e)
                {
                    continue;
                }
                    
    }

    #findPointsOnLineWithSpecificDistanceFromSpecificPoint(l2, h, d) {
        
        if(fuzzyEqual(l2.a, 0))
        {
            let y = -l2.c / l2.b;

            return [
                Point.create(Math.sqrt(-y*y + 2*h*y - h*h + d), y),
                Point.create(-Math.sqrt(-y*y + 2*h*y - h*h + d), y)
            ];
        }
        else
        {
            let y = getRootsOfSqrEq(l2.a*l2.a + l2.b*l2.b, 2 * l2.b * l2.c - 2 * h * l2.a * l2.a, l2.c*l2.c + l2.a * l2.a * ( h * h - d));

            if(y === null)
                return [
                    Point.create(Infinity, Infinity),
                    Point.create(Infinity, Infinity)
                ]

            return [
                Point.create(-(l2.b*y[0] + l2.c)/ l2.a, y[0]),
                Point.create(-(l2.b*y[1] + l2.c)/ l2.a, y[1])
            ];

        }
    }
    #findStandartCut()
    {
        
        let rightTopPoint = this.convexhull.getVertex(0);
        let rightBottomPoint = this.convexhull.getVertex(0);
        let leftTopPoint = this.convexhull.getVertex(0);
        let leftBottomPoint = this.convexhull.getVertex(0);

        
        let points = this.convexhull.getListVertices();

        points.forEach(el => {
            let v = Vector.create(Math.cos(1.0/6 * Math.PI), Math.sin(1.0/6 * Math.PI));
            if(Vector.dot(v, rightTopPoint) < Vector.dot(v, el))
                rightTopPoint = el;
        });

        let rightTopLine = Line.create(rightTopPoint, Point.create(rightTopPoint.x + Math.sin(1.0/6 * Math.PI), rightTopPoint.y - Math.cos(1.0/6 * Math.PI)));

        points.forEach(el => {
            let v = Vector.create(Math.cos(-5.0/6 * Math.PI), Math.sin(-5.0/6 * Math.PI));
            if(Vector.dot(v, leftBottomPoint) < Vector.dot(v, el))
                leftBottomPoint = el;
        });

        let leftBottomLine = Line.create(leftBottomPoint, Point.create(leftBottomPoint.x + Math.sin(-5.0/6 * Math.PI), leftBottomPoint.y - Math.cos(-5.0/6 * Math.PI)));

        points.forEach(el => {
            let v = Vector.create(Math.cos(-1.0/6 * Math.PI), Math.sin(-1.0/6 * Math.PI));
            if(Vector.dot(v, rightBottomPoint) < Vector.dot(v, el))
                rightBottomPoint = el;
        });

        let rightBottomLine = Line.create(rightBottomPoint, Point.create(rightBottomPoint.x + Math.sin(-1.0/6 * Math.PI), rightBottomPoint.y - Math.cos(-1.0/6 * Math.PI)));

        points.forEach(el => {
            let v = Vector.create(Math.cos(5.0/6 * Math.PI), Math.sin(5.0/6 * Math.PI));
            if(Vector.dot(v, leftTopPoint) < Vector.dot(v, el))
                leftTopPoint = el;
        });

        let leftTopLine = Line.create(leftTopPoint, Point.create(leftTopPoint.x + Math.sin(5.0/6 * Math.PI), leftTopPoint.y - Math.cos(5.0/6 * Math.PI)));

        let lines = [leftTopLine, leftBottomLine, rightBottomLine, rightTopLine];
        let sample = [-leftTopLine.c/leftTopLine.a, -leftBottomLine.c/leftBottomLine.a, -rightBottomLine.c/rightBottomLine.a, -rightTopLine.c/rightTopLine.a].map(el => el = Math.abs(el));
        let max = Math.max(...sample);
        let max_ind = sample.indexOf(max);


        lines[(max_ind + 1)%4] = lines[max_ind].symmetricByLine(new Line(1, 0, 0));
        lines[(max_ind + 2)%4] = lines[max_ind].symmetricByLine(new Line(lines[max_ind].a, lines[max_ind].b, 0));
        lines[(max_ind + 3)%4] = lines[max_ind].symmetricByLine(new Line(0, 1, 0));

        let q0 = Line.linesIntersection(lines[0], lines[1]);
        let q1 = Line.linesIntersection(lines[1], lines[2]);
        let q2 = Line.linesIntersection(lines[2], lines[3]);
        let q3 = Line.linesIntersection(lines[3], lines[0]);
        if(this.min_area > getQuadrangleArea(q0, q1, q2, q3))
        {
            this.min_quadrangle = this.#reassignCut([q0, q1, q2, q3]);
            this.min_area = getQuadrangleArea(q0, q1, q2, q3);
        }

    }
    #setDefault() {
        let aabb = this.convexhull.aabb;

        this.min_quadrangle = [Point.create(aabb.minx, aabb.maxy), 
            Point.create(aabb.minx, aabb.miny), 
            Point.create(aabb.maxx, aabb.miny), 
            Point.create(aabb.maxx, aabb.maxy)];
    }
    #reassignCut(list)
    {
        let i = 0;
        let min_y = list[0].y;
        list.forEach((el, index) => {
            if(el.y < min_y)
                {
                    min_y = el.y;
                    i = index;
                }
        });
        return [list[(i + 2) % 4], list[(i + 3) % 4], list[i], list[(i + 1) % 4]];
    }
    makeOffset(offset)
    {
        this.convexhull.makeOffset(offset);
    }

    tryGenOptimalCut()
    {
        this.#findMinimumCutThroughTwoSideAndPoint();
        this.#findMinimumCutThroughThreeSide();
        this.#findStandartCut();
        if(this.min_quadrangle === null || !this.#checkQuadrangle(...this.min_quadrangle))
            this.#setDefault();
    }
    genStandartCut()
    {
        this.#findStandartCut();
        if(this.min_quadrangle === null || !this.#checkQuadrangle(...this.min_quadrangle))
            this.#setDefault();
    }
    getCut()
    {
        return this.min_quadrangle;
    }
    #checkQuadrangle(q0, q1, q2, q3)
    {

        let aabb = new AABB(-1, -1, 1, 1);
        if(!aabb.pointIntersection(q0) || !aabb.pointIntersection(q1) || 
           !aabb.pointIntersection(q2) || !aabb.pointIntersection(q3))
           return false;

        let pol = Polygon.create([q0, q1, q2, q3]);

        if(!(q0.y > q1.y && q0.y > q2.y && q0.y > q3.y) || !(q2.y < q0.y && q2.y < q1.y && q2.y < q3.y))
            return false;

        for(let i = 0; i < 4;i++)
            if(Vector.cross(pol.getEdge(i).v, pol.getEdge(i+1).v) < 0)
                return false;
        
        if(ParametricEdge.edgeIntersection(pol.getEdge(0), pol.getEdge(2)) !== null || ParametricEdge.edgeIntersection(pol.getEdge(1), pol.getEdge(3)) !== null)
            return false;
        
        for(let i = 0; i < this.convexhull.verticesCount;i++)
            if(!pol.pointIntersection(this.convexhull.getVertex(i)))
                return false;
        return true;
    }

}

