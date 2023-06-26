class Editor {
  static Modes = {
    "Disabled": 0,
    "Enabled": 1
  }

  constructor(scene) {
    this.currentState = Editor.Modes.Disabled;
    this.scene = scene;
    this.target = null;

    this.bindCloudPoints();
    let viewport = document.getElementById("viewport");
    viewport.addEventListener("mousedown", (e) => this.handleClickTouch(e));
    viewport.addEventListener("touchstart", (e) => this.handleClickTouch(e));

    document.getElementById("trash-can-icon").addEventListener("mouseup", (e) => this.deleteTarget(e));
    document.getElementById("viewport").addEventListener("mouseup", () => this.target = null);
  }

  bindCloudPoints() {
    for (let point of this.scene.pointsCloudRepresentation) {
      point.on("mousedown touchstart", (e) => this.onExistingPointClickTouch(e));
    }
  }

  toggle(e) {
    this.currentState = this.currentState == Editor.Modes.Disabled ?
      Editor.Modes.Enabled : Editor.Modes.Disabled;
    this.toggleCursor();
    if (this.currentState == Editor.Modes.Enabled) {
      this.setBinds();
      document.getElementById("trash-can-icon").style.display = "block";
    }
    else {
      document.getElementById("trash-can-icon").style.display = "none";
      this.clearBinds();
    }
    return this.currentState;
  }

  toggleCursor() {
    let viewportClassList = document.getElementById("viewport").classList;
    if (this.currentState == Editor.Modes.Enabled) {
      viewportClassList.add("crosshair-cursor");
    }
    else {
      viewportClassList.remove("crosshair-cursor");
    }
  }

  setBinds() {
    for (let point of this.scene.pointsCloudRepresentation) {
      point.draggable(true);
      point.draw();
    }
  }

  onExistingPointClickTouch(e) {
    if (this.currentState == Editor.Modes.Disabled)
      return;

    this.target = 0;
    while (this.scene.pointsCloudRepresentation[this.target] != e.currentTarget) {
      this.target++;
      if (this.target >= this.scene.pointsCloudRepresentation.length) {
        console.log("Point does not found");
        this.target = null;
        break;
      }
    }
    console.log(`Point has been found ${this.target}`);
    if (e.evt instanceof MouseEvent) {
      let point = this.scene.pointsCloudRepresentation[this.target];
      point.x(e.evt.offsetX);
      point.y(e.evt.offsetY);
      point.draw();
    }
  }

  handleClickTouch(e) {
    if (this.currentState == Editor.Modes.Disabled)
      return;

    if (this.target == null) {
      let viewportCoords = { x: undefined, y: undefined };
      if (e instanceof MouseEvent) {
        viewportCoords.x = e.offsetX;
        viewportCoords.y = e.offsetY;
      }
      else if (e instanceof TouchEvent) {
        viewportCoords.x = e.touches[0].offsetX;
        viewportCoords.y = e.touches[0].offsetY;
      }
      let index = this.scene.pointsCloudRepresentation.length;
      let newPoint = new Konva.Circle({
        x: viewportCoords.x,
        y: viewportCoords.y,
        radius: 5,
        fill: Color.blue,
        stroke: 'black',
        strokeWidth: 1,
        draggable: true
      });
      this.scene.pointsCloudRepresentation.push(newPoint);
      this.scene.pointsCloudLayer.add(newPoint);
      this.scene.pointCloud.add(
        this.scene.viewportCoordinateToNormal(viewportCoords)
      )
      newPoint.on("mousedown touchstart", (e) => this.onExistingPointClickTouch(e, index));
      console.log("Point has been added", viewportCoords);
      return;
    }
    console.log(`An existing point has been moved`);
  }

  clearBinds() {
    for (let point of this.scene.pointsCloudRepresentation) {
      point.draggable(false);
      point.draw();
    }
  }

  deleteTarget() {
    if (this.target != null) {
      this.scene.pointsCloudRepresentation[this.target].destroy();
      this.scene.pointsCloudLayer.draw();
      this.scene.pointsCloudRepresentation.splice(this.target, 1);
      this.scene.pointCloud.remove(this.target);
      this.target = null;
      this.bindCloudPoints();
      console.log("Point has been removed");
    }
  }
}