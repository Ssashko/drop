class Task {
    constructor(roundedConvexHull, offset, settings, loader) {
        this.convexhull = Polygon.create(
            roundedConvexHull.innerConvexHullVertices);
        this.roundedConvexHull = roundedConvexHull;
        this.offset = offset;
        this.min_quadrangle = null;
        this.min_area = Infinity;
        this.loader = loader;

        this.settings = settings;

        this.numericalSpeedType = settings.numerical.directMethod.speedType;

        this.standard = settings.useClassicRhombus ?
            new StandardCut(this.convexhull, this.offset) : null;
        this.heuristicMethod = settings.useGeometricMethod
            ? new MinimumCircumscribeCut(
                Polygon.create(roundedConvexHull.innerConvexHullVertices),
                this.offset)
            : null;
        if (settings.numerical.directMethod.enabled) {
            if (settings.numerical.directMethod.speedType == "standard") {
                this.numericalMethod = new NumMinimumCircumscribeCut(this.roundedConvexHull,
                    settings.restrictions, settings.numerical.directMethod.step);
            }
            else {
                this.numericalMethod = new FastNumMinimumCircumscribeCut(this.roundedConvexHull,
                    settings.restrictions, settings.numerical.directMethod.step);
            }
        }
        else {
            this.numericalMethod = null;
        }
        this.numericalDeltoidMethod = settings.numerical.deltoidMethod.enabled ?
            new NumDeltoidMinimumCircumscribeCut(this.roundedConvexHull,
                settings.restrictions, settings.numerical.deltoidMethod.step) : null;
    }


    getRestCut() {
        let q0 = Point.create(min_quadrangle.getVertex(0));
        let q1 = Point.create(min_quadrangle.getVertex(1));
        let q2 = Point.create(min_quadrangle.getVertex(2));
        let q3 = Point.create(min_quadrangle.getVertex(3));
        let v1 = Vector.create(q1.x - q2.x, q1.y - q2.y);
        let v2 = Vector.create(q3.x - q2.x, q3.y - q2.y);
        let angle = Vector.angleBetween(v1, v2);
        return Polygon.create([q3.rotate(q2, angle), q0.rotate(q2, angle), q1.rotate(q2, angle)]).getListVertices();
    }

    async exec() {
        if (this.standard !== null) {
            this.standard.findSolution();
            if (this.standard.getArea() < this.min_area) {
                this.min_quadrangle = this.standard.getCut();
                this.min_area = this.standard.getArea();
            }
        }

        if (this.heuristicMethod !== null) {
            this.heuristicMethod.findSolution();
            if (this.heuristicMethod.getArea() < this.min_area) {
                this.min_quadrangle = this.heuristicMethod.getCut();
                this.min_area = this.heuristicMethod.getArea();
            }
        }

        if (this.numericalMethod !== null) {
            console.log(this.numericalSpeedType == "standard" ? `Num Method Started` : `Fast Num Method Started`);
            const start = Date.now();
            this.loader.showLoader();
            if (this.numericalSpeedType == "standard") {
                const blob = new Blob([document.querySelector('#worker-nummincut').textContent]);
                const blobUrl = window.URL.createObjectURL(blob);
                var worker = new Worker(blobUrl);
                worker.postMessage({
                    url: document.location.href,
                    methodParams: {
                        roundedConvexHull: this.roundedConvexHull.toJson(),
                        restrictions: this.settings.restrictions,
                        step: this.settings.numerical.directMethod.step
                    }
                });

                let resolve = null;
                let promise = new Promise((res) => {
                    resolve = res;
                });
                SetTerminateCallback(() => {
                    worker.terminate();
                    resolve();
                });
                worker.onmessage = (e) => {
                    let data = e.data;

                    window.URL.revokeObjectURL(blobUrl);

                    if (data.type == "pending")
                        this.loader.updateStatus(data.obj);
                    else {
                        this.numericalMethod = NumMinimumCircumscribeCut.create(data.obj);
                        resolve();
                    }
                };
                await promise;
            }
            else {
                const blob = new Blob([document.querySelector('#worker-fastnummincut').textContent]);
                const blobUrl = window.URL.createObjectURL(blob);
                var worker = new Worker(blobUrl);
                worker.postMessage({
                    url: document.location.href,
                    methodParams: {
                        roundedConvexHull: this.roundedConvexHull.toJson(),
                        restrictions: this.settings.restrictions,
                        step: this.settings.numerical.directMethod.step
                    }
                });

                let resolve = null;
                let promise = new Promise((res) => {
                    resolve = res;
                });
                SetTerminateCallback(() => {
                    worker.terminate();
                    resolve();
                });

                worker.onmessage = (e) => {
                    let data = e.data;

                    window.URL.revokeObjectURL(blobUrl);

                    if (data.type == "pending")
                        this.loader.updateStatus(data.obj);
                    else {
                        this.numericalMethod = FastNumMinimumCircumscribeCut.create(data.obj);
                        resolve();
                    }
                };
                await promise;
            }
            this.loader.hideLoader();
            const end = Date.now();
            console.log(`Execution time: ${end - start} ms`);

            if (this.numericalMethod.getArea() < this.min_area) {
                this.min_quadrangle = this.numericalMethod.getCut();
                this.min_area = this.numericalMethod.getArea();
            }
        }

        if (this.numericalDeltoidMethod) {
            console.log(`Num Deltoid Method Started`);
            const start = Date.now();
            this.loader.showLoader();
            {
                const blob = new Blob([document.querySelector('#worker-numdeltoidmincut').textContent]);
                const blobUrl = window.URL.createObjectURL(blob);
                var worker = new Worker(blobUrl);
                worker.postMessage({
                    url: document.location.href,
                    methodParams: {
                        roundedConvexHull: this.roundedConvexHull.toJson(),
                        restrictions: this.settings.restrictions,
                        step: this.settings.numerical.directMethod.step
                    }
                });

                let resolve = null;
                let promise = new Promise((res) => {
                    resolve = res;
                });
                SetTerminateCallback(() => {
                    worker.terminate();
                    resolve();
                });
                worker.onmessage = (e) => {
                    let data = e.data;

                    window.URL.revokeObjectURL(blobUrl);

                    if (data.type == "pending")
                        this.loader.updateStatus(data.obj);
                    else {
                        this.numericalDeltoidMethod = NumDeltoidMinimumCircumscribeCut.create(data.obj);
                        resolve();
                    }
                };
                await promise;
            }
            this.loader.hideLoader();
            const end = Date.now();
            console.log(`Execution time: ${end - start} ms`);

            if (this.numericalDeltoidMethod.getArea() < this.min_area) {
                this.min_quadrangle = this.numericalDeltoidMethod.getCut();
                this.min_area = this.numericalDeltoidMethod.getArea();
            }
        }

        if (this.min_quadrangle === null)
            this.#setDefault();

    }
    getCut() {
        return this.min_quadrangle;
    }
    #setDefault() {
        let aabb = this.convexhull.aabb;

        this.min_quadrangle = Polygon.create([Point.create(aabb.minx, aabb.maxy),
        Point.create(aabb.minx, aabb.miny),
        Point.create(aabb.maxx, aabb.miny),
        Point.create(aabb.maxx, aabb.maxy)]);
        this.min_area = this.min_quadrangle.area;
    }
}