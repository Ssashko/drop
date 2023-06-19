function getPerpendicularBase(point, line) {
    const _y = (line.a * line.a * point.y - line.a * line.b * point.x - line.b * line.c) / (line.b * line.b + line.a * line.a);
    const _x = line.a != 0 ? (-line.b / line.a * _y - line.c / line.a) : point.x;
    return {
        x: _x,
        y: _y
    };
}
function dot(v1, v2) {
    return (v1.x * v2.x + v1.y * v2.y) / (Math.sqrt(v1.x * v1.x + v1.y * v1.y) * Math.sqrt(v2.x * v2.x + v2.y * v2.y));
}
function len(v1, v2) {
    return Math.sqrt((v1.x - v2.x) * (v1.x - v2.x) + (v1.y - v2.y) * (v1.y - v2.y));
}
function checkAABB(p1, p2, point) {
    let maxX = Math.max(p1.x, p2.x);
    let minX = Math.min(p1.x, p2.x);

    let maxY = Math.max(p1.y, p2.y);
    let minY = Math.min(p1.y, p2.y);

    return (minX - EPS < point.x && point.x < maxX + EPS) && (minY - EPS < point.y && point.y < maxY + EPS);
}
function nearestPolygonPoint(polygon, vertex) {
    let plgSize = polygon.length;
    let lines = [];
    for (let i = 0; i < plgSize; i++) {
        let p0 = polygon[i];
        let p1 = polygon[(i + 1) % plgSize];
        lines.push({
            a: p0.y - p1.y,
            b: p1.x - p0.x,
            c: p0.x * p1.y - p1.x * p0.y
        });
    }
    let nearestPolygonPoints = [];
    for (let i = 0; i < plgSize; i++) {
        let p0 = polygon[i];
        let p1 = polygon[(i + 1) % plgSize];
        let footOfPerpendicular = getPerpendicularBase(vertex, lines[i]);
        if (checkAABB(p0, p1, footOfPerpendicular))
            nearestPolygonPoints.push({
                point: footOfPerpendicular,
                normal: { x: lines[i].a, y: lines[i].b }
            });
        else if (len(p0, vertex) < len(p1, vertex))
            nearestPolygonPoints.push({
                point: p0,
                normal: { x: lines[i].a + lines[(plgSize + i - 1) % plgSize].a, y: lines[i].b + lines[(plgSize + i - 1) % plgSize].b }
            });
        else
            nearestPolygonPoints.push({
                point: p1,
                normal: { x: lines[i].a + lines[(i + 1) % plgSize].a, y: lines[i].b + lines[(i + 1) % plgSize].b }
            });
    }

    let min_index = 0;
    let min_width = len(nearestPolygonPoints[0].point, vertex);
    for (let i = 0; i < nearestPolygonPoints.length; i++) {
        let cur_len = len(nearestPolygonPoints[i].point, vertex);
        if (cur_len < min_width) {
            min_width = cur_len;
            min_index = i;
        }
    }
    return nearestPolygonPoints[min_index];
}

function checkPointIncluded(polygon, vertex) {
    let nearestPoint = nearestPolygonPoint(polygon, vertex);
    return dot(nearestPoint.normal, { x: nearestPoint.point.x - vertex.x, y: nearestPoint.point.y - vertex.y }) > -Number.EPSILON;
}

function checkPointIncluded(p1, p2, p3, p4, vertex)
{
    return checkPointIncluded([p1, p2, p3, p4], vertex);
}