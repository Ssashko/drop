export const EPS = 1e-6;


export class Point {
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
    }
    static create(a)
    {
        return new Point(a.x, b.y);
    }
    static create(x, y)
    {
        return new Point(x, y);
    }
    static sqrLenght(a, b) {
        return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
    }
    static lenght(a, b) {
        return Math.sqrt(this.sqrLenght(a, b));
    }
}
export class Vector extends Point{
    constructor(x, y)
    {
        super(x,y);
    }
    static create(a)
    {
        return new Vector(a.x, b.y);
    }
    static create(x, y)
    {
        return new Vector(x, y);
    }
    static cross(a, b) {
        return a.x*b.y - b.x*a.y;
    }
    static dot(a, b) {
        return a.x*b.x + a.y*b.y;
    }
    sqrLenght() {
        return this.x*this.x + this.y*this.y;
    }
    lenght() {
        return Math.sqrt(this.sqrLenght());
    }
}
export function comparator(a, b) {
    if(Math.abs(a-b) < EPS)
        return 0;
    else if(a > b)
        return 1;
    else
        return -1;
}
export class ConvexHull {
    constructor(points)
    {
        let min_ind = 0;
        points.forEach((el, index, arr) => {
            if((Math.abs(el.x - arr[min_ind].x) < EPS && el.y < arr[min_ind].y + EPS) ||
            el.x < arr[min_ind].x + EPS)
                min_ind = index;
        });
    
        let min_point = Vector.create(points[i]);
    
        points.sort((a, b) => {
            let vectorA = Vector.create(a.x - min_point.x, a.y - min_point.y);
            let vectorB = Vector.create(b.x - min_point.x, b.y - min_point.y);
            let cross = Vector.cross(vectorA, vectorB);
            
            let comparator_val = comparator(cross, 0);
            if(comparator_val == 0)
                comparator_val = comparator(vectorA.sqrLenght(), vectorB.sqrLenght());
            return comparator_val;
        });
    
        let convhull = [];
        points.forEach(el => {
            while(convhull.size() > 2)
            {
                let vert1 = convhull.at(-1);
                let vert2 = convhull.at(-2);
                vecA = Vector.create(vert1.x - el.x, vert1.y - el.y);
                vecB = Vector.create(vert1.x - vert2.x, vert1.y - vert2.y);
                if(Vector.cross(vecA, vecB) > 0)
                    break;
                convhull.pop();
            }
            convhull.push(Vector.create(el));
        });
        this.vertices = convhull;
    }
}
