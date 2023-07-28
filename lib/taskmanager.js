class Task {
    constructor(convexhull, tasks, loader) {
        this.convexhull = convexhull;
        this.min_quadrangle = null;
        this.min_area = Infinity;
        this.loader = loader;
        this.restrictions = tasks.params.restrictions;
            
        this.numericalMethodStep = tasks.params.numericalMethodStep;
        this.numericalDeltoidMethodStep = tasks.params.numericalDeltoidMethodStep;
        this.numericalSpeedType = tasks.params.numericalSpeedType;
        this.tasks = tasks;

        this.standart = tasks.standart ? new StandartCut(this.convexhull) : null;
        this.heuristicMethod = tasks.heuristic_method ? new MinimumCircumscribeCut(this.convexhull) : null;
        if(tasks.numerical_method)
        {
            if(this.numericalSpeedType == "standart")
                this.numericalMethod = new NumMinimumCircumscribeCut(this.convexhull, this.restrictions, this.numericalMethodStep);
            else
                this.numericalMethod = new FastNumMinimumCircumscribeCut(this.convexhull, this.restrictions, this.numericalMethodStep);
        }
        else
            this.numericalMethod = null;
        this.numericalDeltoidMethod = tasks.numerical_deltoid_method ? 
        new NumDeltoidMinimumCircumscribeCut(this.convexhull, this.restrictions, this.numericalDeltoidMethodStep) : null;
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
        if (this.standart !== null) {
            this.standart.findSolution();
            if (this.standart.getArea() < this.min_area) {
                this.min_quadrangle = this.standart.getCut();
                this.min_area = this.standart.getArea();
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
            console.log(this.numericalSpeedType == "standart" ? `Num Method Started` : `Fast Num Method Started`);
            const start = Date.now();
            this.loader.showLoader();
            if(this.numericalSpeedType == "standart")
            {  
                var worker = new Worker("workers/nummincut.js");
                worker.postMessage(this.numericalMethod);
                
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

                    if(data.type == "pending")
                        this.loader.updateStatus(data.obj);
                    else
                    {
                        this.numericalMethod = NumMinimumCircumscribeCut.create(data.obj);
                        resolve();
                    }
                };
                await promise;
            }
            else
            {
                var worker = new Worker("workers/fastnummincut.js");
                worker.postMessage(this.numericalMethod);

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

                    if(data.type == "pending")
                        this.loader.updateStatus(data.obj);
                    else
                    {
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

        if(this.numericalDeltoidMethod)
        {
            console.log(`Num Deltoid Method Started`);
            const start = Date.now();
            this.loader.showLoader();
            {
                var worker = new Worker("workers/numdeltoidmincut.js");
                worker.postMessage(this.numericalDeltoidMethod);
                
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

                    if(data.type == "pending")
                        this.loader.updateStatus(data.obj);
                    else
                    {
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