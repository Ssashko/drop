importScripts("../lib/geometry/convexhull.js",
"../lib/geometry/line.js",
"../lib/geometry/point.js",
"../lib/geometry/vector.js",
"../lib/geometry/polygon.js",
"../lib/geometry/miscellaneous.js",
"../lib/fastnummincut.js");


self.addEventListener("message", function(e){
    let method = FastNumMinimumCircumscribeCut.create(e.data);
    method.findSolution();

    postMessage({type: "success", obj: method});
});