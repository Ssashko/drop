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
    getDiagonal(i, j) {
        return ParametricEdge.create(this.getVertex(i), this.getVertex(j)); 
    }
    static create(list) {
        return new Polygon(list);
    }
    checkSelfIntersection() 
    {
        for(let i = 0; i < this.getListVertices().length; i++)
        {
            if(Vector.collinear(this.getEdge(i).v, this.getEdge(i + 1).v) || Vector.collinear(this.getEdge(i).v, this.getEdge(i - 1).v))
                return true;
            for(let j = 2; j < this.getListVertices().length-1; j++)
                if(ParametricEdge.edgeIntersection(this.getEdge(i), this.getEdge(i + j)))
                    return true;
        }
        return false;
    }
    checkConvexity()
    {
        let sign = Vector.cross(this.getEdge(0).v, this.getEdge(1).v);
        
        for(let i = 1; i < this.getListVertices().length; i++)
        {
            let cross = Vector.cross(this.getEdge(i).v, this.getEdge(i+1).v);
            if(fuzzyEqual(cross, 0) || sign * cross < 0)
                return false;
        }
        return true;
    }
    get square() 
    {
        let square = 0;

        for(let i = 0; i < this.verticesCount; i++)
        {
            let p0 = this.getVertex(i);
            let p1 = this.getVertex(i + 1);

            square += (p0.y + p1.y) * (p0.x - p1.x) / 2;
        }
        return Math.abs(square);
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
        let miny_minx_ind = 0;

        this.vertices.forEach((element, index, vertices) => {
            if(vertices[miny_minx_ind].y > element.y ||
                (fuzzyEqual(vertices[miny_minx_ind].y, element.y) && vertices[miny_minx_ind].x > element.x))
                miny_minx_ind = index;
        });
        
        if(Vector.cross(this.getEdge(miny_minx_ind-1).v, this.getEdge(miny_minx_ind).v) < 0)
            this.vertices.reverse();
    }
    static bypassSign(vertices)
    {
        let e1 = Vector.create(vertices[1].x - vertices[0].x, vertices[1].y - vertices[0].y);
        let e2 = Vector.create(vertices[2].x - vertices[1].x, vertices[2].y - vertices[1].y);
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
    map(callback)
    {
        return Polygon.create(this.vertices.map(callback));
    }
    #getNearestPointWithNormal(point) {
        let index = 0;

        let nearestPointObject = this.getEdge(0).getNearestPoint(point);
        let nearestPoint = nearestPointObject.point;
        let min_length = Point.length(nearestPoint, point);
        

        for(let i = 0; i < this.vertices.length; i++)
        {
            let cur_nearestPointObject = this.getEdge(i).getNearestPoint(point);
            let cur_nearestPoint = cur_nearestPointObject.point;
            let cur_length = Point.length(cur_nearestPoint, point);
            if(min_length > cur_length)
            {
                
                index = i;
                min_length = cur_length;
                nearestPoint = cur_nearestPoint;
                nearestPointObject = cur_nearestPointObject;
            }
        }

        if(nearestPointObject.type === "edge")
            return { n: this.#getEdgeNormal(index), p: nearestPoint };
        else if(nearestPointObject.type === "start")
            return { n: this.#getVertexNormal(index), p: nearestPoint };
        else
            return { n: this.#getVertexNormal(index + 1), p: nearestPoint };
    }
    pointIntersection(point) {
        if(!this.aabb.pointIntersection(point))
            return false;
        let info = this.#getNearestPointWithNormal(point);
        let n = info.n;
        let v = Vector.create(point.x - info.p.x, point.y - info.p.y);

        return Vector.dot(n, v) - EPS < 0;

    }

    #getEdgeNormal(index) {
        let v = this.getEdge(index).v;
        let n = Vector.create(-v.y, v.x);

        return Vector.cross(n, v) > 0 ? n : n.inverse();
    }
    #getVertexNormal(index) {
        let n1 = this.#getEdgeNormal(index - 1);
        let n2 = this.#getEdgeNormal(index);
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
