class FastNumMinimumCircumscribeCut {
    constructor(convexhull, restrictions, h = 0.075, aabb = new AABB(-1, -1, 1, 1)) {
        this.min_quadrangle = null;
        this.min_area = Infinity;
        this.restrictions = restrictions;
        this.h = h;
        this.aabb = aabb;
        this.convexhull = convexhull;
        
        this.iterationCount = 0;
    }
    static create(obj)
    {
        let convexhull = Polygon.create(obj.convexhull.vertices);
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

        let res = new FastNumMinimumCircumscribeCut(convexhull, restrictions, h, aabb);
        res.min_quadrangle = min_quadrangle;
        res.min_area = min_area;
        res.iterationCount = iterationCount;
        return res;
    }

    #promoteExecution() {
        let xMax = Math.ceil((this.aabb.maxx + EPS - this.aabb.minx) / this.h);
        let yMax = Math.ceil((this.aabb.maxy + EPS - this.aabb.miny) / this.h);
        let maxIterationCount = xMax * yMax;
        let val = this.iterationCount++/maxIterationCount*100;
        return Math.min(val, 100);
    }
    findSolution() {
        for(let p1x = this.aabb.minx; p1x < this.aabb.maxx + EPS; p1x += this.h)
            for(let p1y = this.aabb.miny; p1y < this.aabb.maxy + EPS; p1y += this.h)
            {
                let Ptop = Point.create(p1x, p1y);
                for(let p2x = this.aabb.minx; p2x < this.aabb.maxx + EPS; p2x += this.h)
                    for(let p2y = this.aabb.miny; p2y < Ptop.y + this.h; p2y += this.h)
                    {
                        let Pbot = Point.create(p2x, p2y);
                        for(let p3x = 0; p3x < this.aabb.maxx + EPS; p3x += this.h)
                            for(let p3y = Pbot.y + this.h; p3y < Ptop.y + this.h; p3y += this.h)
                            {
                                let Pright = Point.create(p3x, p3y);
                                let R = Point.length(Pright, Pbot);
                                if(Math.abs(R) < EPS) continue;

                                let Pleft = this.#getOptimalLastPoint(Ptop, Pright, Pbot);
                                if(Pleft == null || Pleft.y > Ptop.y || Pleft.y < Pbot.y)
                                    continue;
                                let pol = Polygon.create([Ptop, Pleft, Pbot, Pright]);
                                let pol_square = pol.square;
                                if(this.min_area > pol_square)
                                {
                                    this.min_quadrangle = pol;
                                    this.min_area = pol_square;
                                }
                            }
                    }
                postMessage({type: "pending", obj: this.#promoteExecution()});
            }
    }


    static testCase1()
    {
        let convexhull = Polygon.create([{x: - 0.3, y: 0.1}, {x: - 0.3, y: - 0.2}, 
            {x: 0, y: -0.3}, {x: 0.2, y: - 0.2}, {x: 0.3, y: 0}, {x: 0.2, y: 0.3},]);
        let Ptop = {x: 0, y: 0.5};
        let Pright = {x: 0.5, y: 0};
        let Pbot = {x: 0, y: -0.35};

        let restrictions = {
            rightAngle: Range.create(toRadians(100), toRadians(150)),
            bottomAngle: Range.create(toRadians(30), toRadians(150)),
            leftAngle: Range.create(toRadians(100), toRadians(150)),
            topAngle: Range.create(toRadians(30), toRadians(80)),
            Yangle: Range.create(toRadians(0), toRadians(15))
        }

        let cut = new FastNumMinimumCircumscribeCut(convexhull, restrictions);
        let left = cut.#getOptimalLastPoint(Ptop, Pright, Pbot);
        console.log("test Case: (" + left.x + ", " + left.y + ")");
    }
    #getOptimalLastPoint(Ptop, Pright, Pbot)
    {
        let transform = (point) => {
            return Point.create(point.x - Pbot.x, point.y - Pbot.y);
        };
        let transformReverse = (point) => {
            return Point.create(point.x + Pbot.x, point.y + Pbot.y);
        };

        this.convexhull = this.convexhull.map(transform);
        
        let top = transform(Ptop);
        let right = transform(Pright);
        let bottom = transform(Pbot);

        let left = this. #getOptimalLastPointBase(top, right, bottom);

        this.convexhull = this.convexhull.map(transformReverse);

        if(left == null)
            return null;
        return transformReverse(left);
    }
    #getOptimalLastPointBase(top, right, bottom)
    {
        let R = Vector.create(right).length;

        let startAngle = angleFromThreePoint(top, bottom, right);

        let botTangent = this.#getNegativeTangent(bottom, 1);
        
        let tangentAngle = Math.atan2(botTangent.y, botTangent.x) - Math.PI / 2;

        let minAngle = this.restrictions.bottomAngle.l - startAngle;
        let maxAngle = this.restrictions.bottomAngle.r - startAngle;

        if(tangentAngle > minAngle)
            minAngle = tangentAngle;
        if(tangentAngle > maxAngle)
            return null;
        
        
        let rangesRestriction = Range.DisjointIntersection(Range.deleteZeroRanges(this.#topTangentRestriction(R, top)), [this.#angleRangeRestriction(minAngle, maxAngle, R)]);
        if(rangesRestriction.length == 0) return null;
        let ranges = Range.DisjointIntersection(Range.deleteZeroRanges(this.#getRangeSquare(top, R)), rangesRestriction, "sign");
        if(ranges.length == 0) return null;
        let sample = [ranges.at(0).l, ranges.at(-1).r];
        for(let i = 1; i < ranges.length;i++)
        {
            if(!fuzzyEqual(ranges[i-1].l, ranges[i].r))
            {
                sample.push(ranges[i-1].l);
                sample.push(ranges[i].r);
            }
            else if(ranges[i-1].sign < 0 && ranges[i].sign > 0)
                sample.push(ranges[i-1].r);

        }
        sample = makeUnique(sample).map(x => Point.create(x, Math.sqrt(R*R - x*x)));

        sample.sort((a, b) => {
            let Sa = Polygon.create([a, top, bottom]).square;
            let Sb = Polygon.create([b, top, bottom]).square;
            return NumberComparator(Sa, Sb);
        });

        let result = null;
        for(let i = 0; i < sample.length;i++)
        {
            let left = sample[i];
            let pol = Polygon.create([top, left, bottom, right]);
            if(this.#filter(pol))
            {
                result = left;
                break;
            }
        }
        return result;
    }

    #topTangentRestriction(R, top)
    {
        let topTangent = this.#getNegativeTangent(top, -1);
        let sample = intersectLine(Line.create(top, topTangent), R).filter((p) => (new AABB(-1, 0, 0, 1)).pointIntersection(p));

        let v_start = Vector.create(topTangent.x - top.x, topTangent.y - top.y);
        let points;

        if(sample.length == 2)
        {
            if(sample[0].x > sample[1].x)
                [sample[0], sample[1]] = [sample[1], sample[0]];
            
            points = [Point.create(-R, 0), sample[0], sample[1], Point.create(0, R)];    
        }
        else if(sample.length == 1)
            points = [Point.create(-R, 0), sample[0], Point.create(0, R)]; 
        else
            points = [Point.create(-R, 0), Point.create(0, R)];
        
        let result = [];

        for(let i = 1; i < points.length;i++)
        {
            let x = Range.create(points[i-1].x, points[i].x).mid;
            let v = Point.create(x, Math.sqrt(R*R - x*x));
            let v_current = Point.create(v.x - top.x, v.y - top.y);
            if(Vector.cross(v_start, v_current) < 0)
                result.push(Range.create(points[i-1].x, points[i].x));
        }
        return result;
    }

    #angleRangeRestriction(minAngle, maxAngle, R)
    {
        let xmin = R * Math.cos(maxAngle + Math.PI / 2);
        let xmax = R * Math.cos(minAngle + Math.PI / 2);
        return Range.create(xmin, xmax);
    }

    #getRangeSquare(Ptop, R)
    {
        let topLength = Vector.create(Ptop).length;

        let sample = [-R, -R*Ptop.y / topLength, R*Ptop.y / topLength, 0];

        if(sample[1] > sample[2])
            [sample[1], sample[2]] = [sample[2], sample[1]];
        
        sample = sample.filter((p) => Range.create(-R - EPS, EPS).check(p));

        let indicator = (x) =>{
            if(fuzzyEqual(R*R - x*x, 0))
                return 0;
            return (- Ptop.y / 2 - (x * Ptop.x) / (2 * Math.sqrt(R*R - x*x)) > 0) ? 1 : -1;
        };
        let result = [];
        for(let i = 1; i < sample.length; i++)
            {
                let range = Range.create(sample[i-1], sample[i]);
                range.sign = indicator(range.mid);
                result.push(range);
            }
        return result;
    }

    #getNegativeTangent(p, sign = 1)
    {
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
    #filter(pol)
    {
        
        if(pol.checkSelfIntersection() || !pol.checkConvexity())
            return false;

        if(!this.restrictions.topAngle.check(Vector.angleBetween(pol.getEdge(0).v, pol.getEdge(-1).v.inverseSign()))
        || !this.restrictions.leftAngle.check(Vector.angleBetween(pol.getEdge(1).v, pol.getEdge(0).v.inverseSign()))
        || !this.restrictions.bottomAngle.check(Vector.angleBetween(pol.getEdge(2).v, pol.getEdge(1).v.inverseSign()))
        || !this.restrictions.Yangle.check(Vector.angleBetween(pol.getDiagonal(0,2).v, Vector.create(0, -1))))
            return false;

        for (let i = 0; i < this.convexhull.verticesCount; i++)
            if (!pol.pointIntersection(this.convexhull.getVertex(i)))
                return false;
        return true;
    }
}