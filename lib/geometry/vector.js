class Vector extends Point{
    constructor(x, y)
    {
        super(x,y);
    }
    static create(x, y)
    {
        if(typeof y === 'undefined')
        {
            let a = x;
            return new Vector(a.x, a.y);
        }
        else
            return new Vector(x, y);
    }
    static collinear(a,b)
    {
        return fuzzyEqual(a.x - b.x, 0) || fuzzyEqual(a.y - b.y, 0) || fuzzyEqual(a.x / b.x, a.y / b.y);
    }
    static cross(a, b) {
        return a.x*b.y - b.x*a.y;
    }
    static dot(a, b) {
        return a.x*b.x + a.y*b.y;
    }
    inverse() {
        return new Vector(-this.x, -this.y);
    }
    inverseSign() {
        return new Vector(-this.x, -this.y);
    }
    sqrLength() {
        return this.x*this.x + this.y*this.y;
    }
    get length() {
        return Math.sqrt(this.sqrLength());
    }
    static angleBetween(v1, v2) 
    {
        let cos = Vector.dot(v1, v2)/ (v2.length * v1.length);
        if(Math.abs(Math.abs(cos)-1) < EPS)
            cos += cos > 0 ? -EPS : EPS;

        return Math.acos(cos);
    }
}

class Vector3 extends Point3{
    constructor(x, y, z)
    {
        super(x,y, z);
    }
    static create(x, y, z)
    {
        if(typeof y === 'undefined')
        {
            let a = x;
            return new Vector(a.x, a.y, a.z);
        }
        else
            return new Vector(x, y, z);
    }
    static cross(a, b) {
        return Vector3.create(a.y*b.z - a.z*b.y, a.z*b.x - a.x*b.z, a.x*b.y - a.y*b.x);
    }
    static dot(a, b) {
        return a.x*b.x + a.y*b.y + a.z*b.z;
    }
    inverseSign() {
        return new Vector(-this.x, -this.y, -this.y);
    }
    get length() {
        return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
    }
    static angleBetween(v1, v2) 
    {
        let cos = Vector.dot(v1, v2)/ (v2.length * v1.length);
        if(Math.abs(Math.abs(cos)-1) < EPS)
            cos += cos > 0 ? -EPS : EPS;

        return Math.acos(cos);
    }
    static toConsistence(v) 
    {
        return Vector3.create(v.x, v.y, 1);
    }
    fromConsistence()
    {
        return Vector.create(this.x / this.z, this.y / this.z);
    }
}