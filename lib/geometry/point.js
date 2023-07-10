
class Point {
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
    }
    rotate(center, angle) {
        let x = this.x - center.x;
        let y = this.y - center.y;
        this.x = Math.cos(angle) * x + Math.sin(angle) * y + center.x;
        this.y = -Math.sin(angle) * x + Math.cos(angle) * y + center.y;
        return this;
    }
    static create(x, y)
    {
        if(typeof y === 'undefined')
        {
            let a = x;
            return new Point(a.x, a.y);
        }
        else
            return new Point(x, y);
    }
    static sqrLength(a, b) {
        return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
    }
    static length(a, b) {
        return Math.sqrt(this.sqrLength(a, b));
    }
}

class Point3 {
    constructor(x, y, z)
    {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    static create(x, y, z)
    {
        if(typeof y === 'undefined')
        {
            let a = x;
            return new Point3(a.x, a.y, a.z);
        }
        else
            return new Point(x, y, z);
    }
    static length(a, b) {
        return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y) + (a.z - b.z) * (a.z - b.z));
    }
}

function getLineByPoints(p1, p2)
{
    return new Line(p2.y - p1.y, p1.x - p2.x,p2.x * p1.y - p1.x * p2.y);
}