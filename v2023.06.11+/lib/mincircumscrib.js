import {ConvexHull, Vector, Point} from './convexhull.js';

import {checkPointIncluded} from './pointpolygonintersection.js';

const EPS = 1e-6;

class Edge {
    constructor(p1, p2)
    {
        this.points = [Point.create(p1), Point.create(p2) ];
    }
    get lenght()
    {
        return Math.sqrt(this.points[0] * this.points[0] + this.points[1] * this.points[1]);
    }
    static create(p1, p2)
    {
        return new Edge(p1, p2);
    }
    static create(x1, y1, x2, y2)
    {
        return new Edge({x: x1, y: y1}, {x: x2, y: y2});
    }
}
function getLineByPoints(p1, p2)
{
    return {
        a: p2.y - p1.y,
        b: p1.x - p2.x,
        c: p2.x * p1.y - p1.x * p2.y
    }
}
function getTriangleArea(p1, p2, p3) {
    let a = Point.lenght(p1, p2), 
        b = Point.lenght(p2, p3),
        c = Point.lenght(p3, p1);
    let p = (a + b + c) / 2;
    return Math.sqrt(p*(p - a)*(p - b)*(p - c));
}
function getQuadrangleArea(p1,p2,p3,p4)
{
    return getTriangleArea(p1,p2,p3) + getTriangleArea(p1,p3,p4)
}
function getRootsOfSqrEq(a, b, c) {
    let D = b*b - 4*a*c;
    if(D < 0)
        return null;
    return [
        (-b + Math.sqrt(D))/ (2*a),
        (-b - Math.sqrt(D))/ (2*a)
    ]
}
function fuzzyEqual(a, b) {
    return Math.abs(a-b) < EPS;
}
function getLineByEdge(e)
{
    return getLineByPoints(e.x, e.y);
}
function getLinesIntersection(l1, l2) {
    let denom = l1.a * l2.b + l1.b * l2.a;
    if(Math.abs(denom) < EPS)
        return null;
    return Point.create((l1.b * l2.c - l2.b * l1.c) / denom, -(l1.a * l2.c + l2.a * l1.c) / denom);
}
function getEdgesIntersection(e1, e2)
{
    return getLinesIntersection(getLineByEdge(e1), getLineByEdge(e2));
}
export class MinimumCircumscribeCut extends ConvexHull
{
    constructor(points)
    {
        super(points);


        this.min_quadrangle = null;
        this.min_area = Infinity;
    }

    #findMinimumCutThroughTwoSideAndPoint()
    {
        for(let i = 0; i < this.points.lenght; i++)
        {
            
            for(let point_ind = 0; point_ind < this.points.lenght; point_ind++)
            {
                let l1 = getLineByEdge(this.#getEdge(i));
                let p = this.#getVertex(point_ind);
                let h = fuzzyEqual(l1.b, 0) ? 2 * p.y : (2 * l1.a * p.x + 2 * l1.b * p.y + l1.c) / l1.b;

                let q1 = Point.create(2 * p.x, 2 * p.y - h);
                let q2 = Point.create(0,  h)
                let d = Point.sqrLenght(q1, q2);

                for(let j = 0; j < this.points.lenght; j++)
                {

                    let q0 = getEdgesIntersection(this.#getEdge(i), this.#getEdge(j));
                    if(point_ind == i || point_ind == this.getIndex(i+1) || point_ind == j || point_ind == this.getIndex(j+1))
                        continue;
                    let l2 = getLineByEdge(this.#getEdge(j));
                    let q3 = this.#findPointsOnLineWithSpecificDistanceFromSpecificPoint(l2,h,d);

                    if(q3 === null) continue;

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
            }
        }
                    
    }
    #findMinimumCutThroughThreeSide()
    {
        for(let i = 0; i < this.points.lenght; i++)
        {
            
            for(let j = i+1; j < this.points.lenght; j++)
            {

                let h = getEdgesIntersection(Edge.create(0, 1, 0, -1), this.#getEdge(j)).y;

                let q1 = getEdgesIntersection(this.#getEdge(i), this.#getEdge(j));
                let q2 = Point.create(0,  h)
                let d = Point.sqrLenght(q1, q2);

                for(let k = j+1; k < this.points.lenght; k++)
                {

                    let q0 = getEdgesIntersection(this.#getEdge(i), this.#getEdge(k));
                    let l2 = getLineByEdge(this.#getEdge(k));
                    let q3 = this.#findPointsOnLineWithSpecificDistanceFromSpecificPoint(l2,h,d);

                    if(q3 === null) continue;

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
            }
        }
                    
    }

    #findPointsOnLineWithSpecificDistanceFromSpecificPoint(l2, h, d) {
        
        if(fuzzyEqual(l1.a, 0))
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
            return [
                Point.create(-(l2.b*y[0] + l2.c)/ l2.a, y[0]),
                Point.create(-(l2.b*y[1] + l2.c)/ l2.a, y[1])
            ];

        }
    }
    #findStandartCut()
    {
        
        let rightTopPoint = this.points[0];
        let rightBottomPoint = this.points[0];
        let leftTopPoint = this.points[0];
        let leftBottomPoint = this.points[0];

        

        this.points.forEach(el => {
            let v = Vector.create(Math.cos(1.0/3 * Math.PI), Math.sin(1.0/3 * Math.PI));
            if(Vector.dot(v, rightTopPoint) < Vector.dot(v, el))
                rightTopPoint = el;
        });

        let rightTopLine = getLineByPoints(rightTopPoint, Point.create(rightTopPoint.x + Math.sin(1.0/3 * Math.PI), rightTopPoint.y - Math.cos(1.0/3 * Math.PI)));

        this.points.forEach(el => {
            let v = Vector.create(Math.cos(-2.0/3 * Math.PI), Math.sin(-2.0/3 * Math.PI));
            if(Vector.dot(v, leftBottomPoint) < Vector.dot(v, el))
                leftBottomPoint = el;
        });

        let leftBottomLine = getLineByPoints(leftBottomPoint, Point.create(leftBottomPoint.x + Math.sin(-2.0/3 * Math.PI), leftBottomPoint.y - Math.cos(-2.0/3 * Math.PI)));

        this.points.forEach(el => {
            let v = Vector.create(Math.cos(-1.0/3 * Math.PI), Math.sin(-1.0/3 * Math.PI));
            if(Vector.dot(v, rightBottomPoint) < Vector.dot(v, el))
                rightBottomPoint = el;
        });

        let rightBottomLine = getLineByPoints(rightBottomPoint, Point.create(rightBottomPoint.x + Math.sin(-1.0/3 * Math.PI), rightBottomPoint.y - Math.cos(-1.0/3 * Math.PI)));

        this.points.forEach(el => {
            let v = Vector.create(Math.cos(2.0/3 * Math.PI), Math.sin(2.0/3 * Math.PI));
            if(Vector.dot(v, leftTopPoint) < Vector.dot(v, el))
                leftTopPoint = el;
        });

        let leftTopLine = getLineByPoints(leftTopPoint, Point.create(leftTopPoint.x + Math.sin(2.0/3 * Math.PI), leftTopPoint.y - Math.cos(2.0/3 * Math.PI)));
        
        let top_shift = Math.max(-rightTopLine.c/rightTopLine.b, -leftTopLine.c/leftTopLine.b);
        let right_shift = Math.max(-rightTopLine.c/rightTopLine.a, -rightBottomLine.c/rightBottomLine.a);
        let bottom_shift = Math.min(-rightBottomLine.c/rightBottomLine.b, -leftBottomLine.c/leftBottomLine.b);
        let left_shift = Math.min(-leftTopLine.c/leftTopLine.a, -leftBottomLine.c/leftBottomLine.a);

        let q0 = Point.create((right_shift + left_shift) / 2, top_shift);
        let q1 = Point.create(right_shift, (bottom_shift + top_shift) / 2);
        let q2 = Point.create((right_shift + left_shift) / 2, bottom_shift);
        let q3 = Point.create(left_shift, (bottom_shift + top_shift) / 2);

        if(this.min_area > getQuadrangleArea(q0, q1, q2, q3))
        {
            this.min_quadrangle = [q0, q1, q2, q3];
            this.min_area = getQuadrangleArea(q0, q1, q2, q3);
        }

    }
    repairBypass()
    {
        let q = this.min_quadrangle;
        let v1 = Vector.create(q[1].x - q[0].x, q[1].y - q[0].y);
        let v2 = Vector.create(q[2].x - q[1].x, q[2].y - q[1].y);
        if(Vector.cross(v1,v2) < 0)
            [q[1], q[3]] = [q[3], q[1]];
    }
    makeOffset(offset)
    {
        this.repairBypass();
        let q = this.min_quadrangle;
        if(q === null)
            return;
        let offsetEdges = [];
        for(let i = 0; i < 4;i++)
        {
            let line = getLineByPoints(q[i], q[(i+1)%4]);
            let v = Vector.create(q[(i+1)%4].x - q[i].x, q[(i+1)%4].y - q[i].y);
            let n = Vector.create(line.a, line.b);

            let sign = Vector.cross(n,v) < 0 ? -1 : 1;
            let lenN = n.lenght();
            n.x = sign * offset * n.x / lenN;
            n.y = sign * offset * n.y / lenN;
            offsetEdges.push(Edge.create(q[i].x + n.x, q[i].y + n.y));
        }
        for(let i = 0; i < 4;i++)
            this.min_quadrangle[i] = getEdgesIntersection(offsetEdges[i], offsetEdges[(i + 1) % 4]);

    }
    getCut()
    {
        this.#findMinimumCutThroughTwoSideAndPoint();
        this.#findMinimumCutThroughThreeSide();
        this.#findStandartCut();
    }
    #checkQuadrangle(q0, q1, q2, q3)
    {
        for(let i = 0; i < this.points.lenght;i++)
            if(!checkPointIncluded(q0, q1, q2, q3, this.#getVertex(i)))
                return false;
        return true;
    }
    getIndex(ind) {
        let M = this.points.lenght;
        return (M + nd%M) % M;
    }
    #getVertex(ind) {
        return this.points.at(this.getIndex(ind));
    }
    #getEdge(ind) {
        return Edge.create(this.points.at(this.getIndex(ind)), this.points.at(this.getIndex(ind+1)));
    }

    
    

}
