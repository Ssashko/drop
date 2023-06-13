const Color = {
    red: "#fc0317",
    green: "#1d9106",
    blue: "#067391",
    darkGreen: "#0e2e13",
    grey: "#7c7c7d",
    white: "#ffffff"
};
const EPS = 1e-3;
const Radius = 3;
class Renderer {

    constructor(canvas, settings) {
        this.ctx = canvas.getContext("2d");

        this.viewportExtends = {
            w: canvas.width,
            h: canvas.height
        };
        this.normalExtends = {
            w: 1,
            h: 1
        };
        this.canvas = canvas;
        this.pointCloud = new PointCloud();
        this.pointCloud.genRandPoints();
        this.quadrangleCut = new QuadrangleCut(this.pointCloud);

        this.events = {
            click: [],
            mouseUp: [],
            mouseDown: [],
            mouseMove: [],
            mouseOut: []
        };

        this.eventHandler();

        for (let i = 0; i < this.quadrangleCut.getVertices().length; i++) {
            this.events.mouseDown.push(new AABBEvent(
                new AABB(this.viewportCoordinateToNormal({ x: 0, y: 0 }),
                    this.viewportCoordinateToNormal({ x: 6 * Radius, y: 6 * Radius })),
                "mousedown",
                (e) => {
                    this.events.mouseMove[i].addArg("moveMoveEnabled", true);
                    e.target.style.cursor = "move";
                }
            ));

            this.events.mouseUp.push(new AABBEvent(
                new AABB(this.viewportCoordinateToNormal({ x: 0, y: 0 }),
                    this.viewportCoordinateToNormal({ x: 6 * Radius, y: 6 * Radius })),
                "mouseup",
                (e) => {
                    this.events.mouseMove[i].addArg("moveMoveEnabled", false);
                    e.target.style.cursor = "default";
                }
            ));
            this.events.mouseMove.push(new AABBEvent(
                new AABB(this.viewportCoordinateToNormal({ x: 0, y: 0 }),
                    this.viewportCoordinateToNormal({ x: 6 * Radius, y: 6 * Radius })),
                "mousemove",
                (e) => {
                    if (e.aabbEventArg.moveMoveEnabled) {
                        this.quadrangleCut.getVertices()[i] = this.viewportCoordinateToNormal({ x: e.offsetX, y: e.offsetY });
                        this.render();
                    }
                },
                {
                    moveMoveEnabled: false
                }
            ));
            this.events.mouseOut.push({
                call: (e) => {
                    this.events.mouseMove[i].addArg("moveMoveEnabled", false);
                    e.target.style.cursor = "default";
                }
            })
        }

        this.settings = settings;
    }

    normalCoordinateToViewport(vertex) {
        let ratio = {
            w: this.viewportExtends.w / this.normalExtends.w,
            h: this.viewportExtends.h / this.normalExtends.h
        };
        return {
            x: ratio.w * vertex.x,
            y: ratio.h * vertex.y
        }
    }

    updateViewportSize() {
        const viewportSide = Math.min(window.innerWidth, window.innerHeight) - 10;
        this.ctx.canvas.width = viewportSide;
        this.ctx.canvas.height = viewportSide;
        this.viewportExtends.w = viewportSide;
        this.viewportExtends.h = viewportSide;
    }
    viewportCoordinateToNormal(vertex) {
        let ratio = {
            w: this.normalExtends.w / this.viewportExtends.w,
            h: this.normalExtends.h / this.viewportExtends.h
        };
        return {
            x: ratio.w * vertex.x,
            y: ratio.h * vertex.y
        }
    }
    renderPointCloud() {
        this.ctx.fillStyle = Color.blue;
        this.pointCloud.getPoints().forEach(vertex => {
            let viewportPoint = this.normalCoordinateToViewport(vertex);
            this.ctx.beginPath();
            this.ctx.arc(viewportPoint.x, viewportPoint.y, Radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.closePath();
        });
    }
    renderCut() {
        let vertices = this.quadrangleCut.getVertices().map(vertex => this.normalCoordinateToViewport(vertex));

        let lineWidth = this.settings["quadrangleSideWidth"];
        this.ctx.lineWidth = lineWidth;
        if (this.settings["lineType"] == "dashed") {
            this.ctx.setLineDash([5 * lineWidth, 3 * lineWidth]);
        }
        else {
            this.ctx.setLineDash([5, 0]);
        }
        this.ctx.strokeStyle = this.quadrangleCut.checkPointsIncluded(this.pointCloud) && !this.quadrangleCut.hasSelfIntersection()
            ? Color.green : Color.red;
        this.ctx.beginPath();
        this.ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
            this.ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        this.ctx.lineTo(vertices[0].x, vertices[0].y);
        this.ctx.stroke();
        this.ctx.closePath();

        this.ctx.fillStyle = Color.darkGreen;
        vertices.forEach(vertex => {
            this.ctx.beginPath();
            this.ctx.arc(vertex.x, vertex.y, this.settings["quadrangleVerticesRadius"], 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.closePath();
        });
        for (let i = 0; i < vertices.length; i++) {
            this.events.mouseDown[i].setPosition(this.viewportCoordinateToNormal({ x: vertices[i].x - 3 * Radius, y: vertices[i].y - 3 * Radius }));
            this.events.mouseUp[i].setPosition(this.viewportCoordinateToNormal({ x: vertices[i].x - 3 * Radius, y: vertices[i].y - 3 * Radius }));
            this.events.mouseMove[i].setPosition(this.viewportCoordinateToNormal({ x: vertices[i].x - 3 * Radius, y: vertices[i].y - 3 * Radius }));
        }
    }
    eventHandler() {
        let getCanvasPos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };
        let checkPointInAABB = (point, aabb) =>
            (-EPS < point.x - aabb.x && point.x - aabb.x < aabb.w + EPS) &&
            (-EPS < point.y - aabb.y && point.y - aabb.y < aabb.h + EPS);

        this.canvas.addEventListener("click", (e) => {
            let pos = this.viewportCoordinateToNormal(getCanvasPos(e));
            this.events.click.forEach(ev => {
                e.pos = pos;
                if (checkPointInAABB(pos, ev.AABB))
                    ev.call(e);
            })
        });

        this.canvas.addEventListener("mouseout", (e) => {
            let pos = this.viewportCoordinateToNormal(getCanvasPos(e));
            this.events.mouseOut.forEach(ev => ev.call(e));
        });
        this.canvas.addEventListener("mousedown", (e) => {
            let pos = this.viewportCoordinateToNormal(getCanvasPos(e));
            this.events.mouseDown.forEach(ev => {
                e.pos = pos;
                if (checkPointInAABB(pos, ev.AABB))
                    ev.call(e);
            })
        });
        this.canvas.addEventListener("mouseup", (e) => {
            let pos = this.viewportCoordinateToNormal(getCanvasPos(e));
            this.events.mouseUp.forEach(ev => {
                e.pos = pos;
                if (checkPointInAABB(pos, ev.AABB))
                    ev.call(e);
            })
        });

        this.canvas.addEventListener("mousemove", (e) => {
            let pos = this.viewportCoordinateToNormal(getCanvasPos(e));
            this.events.mouseMove.forEach(ev => {
                e.pos = pos;
                // if (checkPointInAABB(pos, ev.AABB))
                ev.call(e);
            })
        });
    }
    render() {
        this.updateViewportSize();

        this.ctx.fillStyle = Color.white;
        this.ctx.beginPath();
        const topLeft = { x: 0, y: 0 };
        const topRight = { x: this.viewportExtends.w, y: 0 };
        const bottomRight = { x: this.viewportExtends.w, y: this.viewportExtends.h };
        const bottomLeft = { x: 0, y: this.viewportExtends.h };
        this.ctx.moveTo(topLeft.x, topLeft.y);
        this.ctx.lineTo(topRight.x, topRight.y);
        this.ctx.lineTo(bottomRight.x, bottomRight.y);
        this.ctx.lineTo(bottomLeft.x, bottomLeft.y);
        this.ctx.closePath();

        this.ctx.lineWidth = 0.5;
        let step_unit = this.settings["gridStep"];
        for (let step = step_unit / 2; step <= 1; step += step_unit) {
            this.ctx.strokeStyle = Color.grey;
            let v11 = this.normalCoordinateToViewport({ x: step, y: 0 });
            let v12 = this.normalCoordinateToViewport({ x: step, y: this.normalExtends.h });
            let v21 = this.normalCoordinateToViewport({ x: 0, y: step });
            let v22 = this.normalCoordinateToViewport({ x: this.normalExtends.w, y: step });

            this.ctx.beginPath();
            this.ctx.moveTo(v11.x, v11.y);
            this.ctx.lineTo(v12.x, v12.y);

            this.ctx.moveTo(v21.x, v21.y);
            this.ctx.lineTo(v22.x, v22.y);
            this.ctx.stroke();
            this.ctx.closePath();
        }
        this.renderPointCloud();
        this.renderCut();
    }
}

class AABB {
    constructor(point, extend) {
        this.x = point.x;
        this.y = point.y;
        this.w = extend.x;
        this.h = extend.y;
    }
    setPosition(point) {
        this.x = point.x;
        this.y = point.y;
    }
}

class AABBEvent {
    constructor(AABB, type, callback, arg = {}) {
        this.AABB = AABB;
        this.type = type;
        this.callback = callback;
        this.args = arg;
    }

    setPosition(point) {
        this.AABB.setPosition(point);
    }
    addArg(name, value) {
        this.args[name] = value;
    }
    getAABB() {
        return this.AABB;
    }
    call(e) {
        e.aabbEventArg = this.args;
        this.callback(e);
    }

}