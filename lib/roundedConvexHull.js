class RoundedConvexHull {
    constructor(convexHull, normalOffset) {
        if (convexHull == undefined || normalOffset == undefined) {
            console.log("Empty RoundedConvexHull has been created");
            return;
        }

        const convexHullVertices = convexHull.getListVertices();
        const displacedTruncatedConvexHull = this.buildDisplacedTruncated(convexHullVertices, normalOffset);

        this.segments = [];
        this.arcs = [];
        for (let i = displacedTruncatedConvexHull.length; i < 2 * displacedTruncatedConvexHull.length; i += 2) {
            const prevIndex = (i - 1) % displacedTruncatedConvexHull.length;
            const currIndex = (i) % displacedTruncatedConvexHull.length;
            const nextIndex = (i + 1) % displacedTruncatedConvexHull.length;
            this.segments.push({
                'startPoint': displacedTruncatedConvexHull[currIndex],
                'endPoint': displacedTruncatedConvexHull[nextIndex]
            });
            const arcCenter = convexHullVertices[currIndex / 2];
            this.arcs.push({
                'center': arcCenter,
                'startPoint': displacedTruncatedConvexHull[prevIndex],
                'endPoint': displacedTruncatedConvexHull[currIndex]
            });
        }

        this.normalOffset = normalOffset;
        this.innerConvexHullVertices = convexHullVertices;
        this.area = null;
    }

    buildDisplacedTruncated(convexHullVertices, normalOffset) {
        const resultConvexHullVertices = [];
        for (let i = 0; i < convexHullVertices.length; i++) {
            const currIndex = i;
            const nextIndex = (i + 1) % convexHullVertices.length;
            const v = normalize({
                x: convexHullVertices[currIndex].x - convexHullVertices[nextIndex].x,
                y: convexHullVertices[currIndex].y - convexHullVertices[nextIndex].y
            });
            let perpendicularV = rotate(v, { x: 0, y: 0 }, -Math.PI / 2);
            perpendicularV = { x: perpendicularV.x * normalOffset, y: perpendicularV.y * normalOffset };
            resultConvexHullVertices.push(translate(
                convexHullVertices[currIndex],
                perpendicularV
            ));
            resultConvexHullVertices.push(translate(
                convexHullVertices[nextIndex],
                perpendicularV
            ));
        }
        return resultConvexHullVertices;
    }

    toJson() {
        return {
            segments: this.segments,
            arcs: this.arcs,
            normalOffset: this.normalOffset,
            innerConvexHullVertices: this.innerConvexHullVertices
        };
    }

    static createFromJson(jsonData) {
        let roundedConvexHull = new RoundedConvexHull();
        roundedConvexHull.segments = jsonData.segments;
        roundedConvexHull.arcs = jsonData.arcs;
        roundedConvexHull.normalOffset = jsonData.normalOffset;
        roundedConvexHull.innerConvexHullVertices = jsonData.innerConvexHullVertices;
        return roundedConvexHull;
    }

    getArea() {
        if (this.area == null) {
            this.area = 0;
            let corePolygonVertices = [];
            for (const arc of this.arcs) {
                const v1 = Vector.create(
                    arc.startPoint.x - arc.center.x,
                    arc.startPoint.y - arc.center.y);
                const v2 = Vector.create(
                    arc.endPoint.x - arc.center.x,
                    arc.endPoint.y - arc.center.y);
                const angleRad = Vector.angleBetween(v1, v2);
                const arcArea = angleRad / 2 * v1.sqrLength();
                this.area += arcArea;

                corePolygonVertices.push(arc.startPoint);
                corePolygonVertices.push(arc.center);
                corePolygonVertices.push(arc.endPoint);
            }
            let corePolygonArea = 0;
            const n = corePolygonVertices.length - 1;
            for (let i = 0; i < n; i++) {
                corePolygonArea += corePolygonVertices[i].x * corePolygonVertices[i + 1].y;
                corePolygonArea -= corePolygonVertices[i + 1].x * corePolygonVertices[i].y;
            }
            corePolygonArea += corePolygonVertices[n].x * corePolygonVertices[0].y;
            corePolygonArea -= corePolygonVertices[0].x * corePolygonVertices[n].y;

            this.area += corePolygonArea;
        }
        return this.area;
    }
}

function isRoundedConvexHullInsideQuadrangle(quadrangleVertices, roundedConvexHull) {
    const convexHullVertices = [];
    for (const segment of roundedConvexHull.segments) {
        convexHullVertices.push(segment.startPoint);
        convexHullVertices.push(segment.endPoint);
    }
    for (const vertex of convexHullVertices)
        if (!Polygon.create(quadrangleVertices).pointIntersection(vertex))
            return false;

    for (const innerVertex of roundedConvexHull.innerConvexHullVertices) {
        const circle = {
            'center': innerVertex,
            'radius': roundedConvexHull.normalOffset,
        };
        for (let i = 0; i < quadrangleVertices.length; i++) {
            const nextI = (i + 1) % quadrangleVertices.length;
            const segment = {
                startPoint: quadrangleVertices[i],
                endPoint: quadrangleVertices[nextI],
            }
            const distance = Math.abs((segment.endPoint.x - segment.startPoint.x) * (circle.center.y - segment.startPoint.y)
                - (segment.endPoint.y - segment.startPoint.y) * (circle.center.x - segment.startPoint.x))
                / Math.sqrt((segment.endPoint.x - segment.startPoint.x) * (segment.endPoint.x - segment.startPoint.x)
                    + (segment.endPoint.y - segment.startPoint.y) * (segment.endPoint.y - segment.startPoint.y));
            if (distance < circle.radius)
                return false;
        }
    }

    const quadrangleArea = getQuadrangleArea(...quadrangleVertices);
    const roundedConvexHullArea = roundedConvexHull.getArea();
    return quadrangleArea > roundedConvexHullArea;
}
