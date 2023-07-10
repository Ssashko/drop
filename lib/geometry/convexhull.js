const EPS = 1e-6;

function comparator(a, b) {
    if (Math.abs(a - b) < EPS)
        return 0;
    else if (a > b)
        return 1;
    else
        return -1;
}
class ConvexHull {
    constructor(points) {
        let min_ind = 0;
        points.forEach((el, index, arr) => {
            if ((Math.abs(el.x - arr[min_ind].x) < EPS && el.y < arr[min_ind].y + EPS) ||
                el.x < arr[min_ind].x + EPS)
                min_ind = index;
        });

        let min_point = Vector.create(points[min_ind]);

        points.sort((a, b) => {
            let vectorA = Vector.create(a.x - min_point.x, a.y - min_point.y);
            let vectorB = Vector.create(b.x - min_point.x, b.y - min_point.y);
            let cross = Vector.cross(vectorA, vectorB);

            let comparator_val = comparator(cross, 0);
            if (comparator_val == 0)
                comparator_val = comparator(vectorA.sqrLength(), vectorB.sqrLength());
            return -comparator_val;
        });

        let convhull = [];
        points.forEach(el => {
            while (convhull.length >= 2) {
                let vert1 = convhull.at(-1);
                let vert2 = convhull.at(-2);
                let vecA = Vector.create(vert1.x - vert2.x, vert1.y - vert2.y);
                let vecB = Vector.create(el.x - vert1.x, el.y - vert1.y);

                if (Vector.cross(vecA, vecB) > 0)
                    break;
                convhull.pop();
            }
            convhull.push(Vector.create(el));
        });
        this.vertices = Polygon.create(convhull);
    }

    static create(points) {
        return new ConvexHull(points);
    }

    getPolygon() {
        return this.vertices;
    }
}
