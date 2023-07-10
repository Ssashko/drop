class RoundedConvexHull {
    constructor(convexHull, normalOffset) {
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
}
