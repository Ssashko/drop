class Editor {
  static Modes = {
    "Disabled": 0,
    "Enabled": 1
  }

  constructor(scene) {
    this.currentState = Editor.Modes.Enabled;
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
    for (let item of this.scene.pointsCloudRepresentation) {
      const point = item.point;
      point.on("mousedown touchstart", (e) => this.onExistingPointClickTouch(e));
      point.draw();
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
      this.scene.updatePointsCloud();
    }
    this.scene.onPointsCloudEditingModeToggling(this.currentState);
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
    for (let item of this.scene.pointsCloudRepresentation) {
      const point = item.point;
      point.draggable(true);
      point.draw();
    }
  }

  onExistingPointClickTouch(e) {
    if (this.currentState == Editor.Modes.Disabled)
      return;

    this.target = this.scene.findPointCloud(e.currentTarget);
    console.log(`Point has been found ${this.target}`);
    if (e.evt instanceof MouseEvent) {
      let point = this.scene.pointsCloudRepresentation[this.target].point;
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
      const newItem = this.scene.buildPointsCloudRepresentationItem(viewportCoords);
      newItem.point.on("mousedown touchstart", (e) => this.onExistingPointClickTouch(e));
      newItem.point.on("dragmove", (e) => this.scene.updatePointDistances(e));
      this.scene.pointsCloudLayer.add(
        newItem.horizontalDistance.line, newItem.horizontalDistance.text,
        newItem.verticalDistance.line, newItem.verticalDistance.text,
        newItem.point
      );
      for (const item of this.scene.pointsCloudRepresentation) {
        item.point.draw();
      }
      this.scene.pointsCloudRepresentation.push(newItem);
      this.scene.pointCloud.add(
        this.scene.viewportCoordinateToNormal(viewportCoords)
      )
      console.log("Point has been added ", viewportCoords);
      return;
    }
    console.log(`An existing point has been moved`);
  }

  clearBinds() {
    for (let item of this.scene.pointsCloudRepresentation) {
      item.point.draggable(false);
      item.point.draw();
    }
  }

  deleteTarget() {
    if (this.target != null) {
      const item = this.scene.pointsCloudRepresentation[this.target];
      item.point.destroy();
      item.verticalDistance.line.destroy();
      item.verticalDistance.text.destroy();
      item.horizontalDistance.line.destroy();
      item.horizontalDistance.text.destroy();
      this.scene.pointsCloudLayer.draw();
      this.scene.pointsCloudRepresentation.splice(this.target, 1);
      this.scene.pointCloud.splice(this.target, 1);
      this.target = null;
      this.bindCloudPoints();
      console.log("Point has been removed");
    }
  }
}