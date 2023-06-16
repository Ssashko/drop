function showSettingsMenu(e) {
  let settingsMenu = document.getElementById("settings");
  if (settingsMenu.style.display == "none") {
    settingsMenu.style.display = "flex";
  }
  else {
    settingsMenu.style.display = "none";
  }
}

let settingsMenu = document.getElementById("settings");
settingsMenu.style.display = "none";
let settingsIcon = document.getElementById("settings-icon");
settingsIcon.addEventListener("click", showSettingsMenu);


function initializeSettings(settings) {
  document.getElementById("grid-step").value = settings["gridStep"];
  document.getElementById("quadrangle-side-width").value = settings["quadrangleSideWidth"];
  document.getElementById("quadrangle-vertices-radius").value = settings["quadrangleVerticesRadius"];
}

function updateSettings(scene) {
  let gridStep = parseFloat(document.getElementById("grid-step").value);
  if (gridStep != null) {
    scene.settings["gridStep"] = gridStep;
    scene.updateBackgroundGrid(gridStep);
  }
  let quadrangleSideWidth = parseFloat(document.getElementById("quadrangle-side-width").value);
  if (quadrangleSideWidth != null) {
    scene.settings["quadrangleSideWidth"] = quadrangleSideWidth;
  }
  let quadrangleVerticesRadius = parseFloat(document.getElementById("quadrangle-vertices-radius").value);
  if (quadrangleVerticesRadius != null) {
    scene.settings["quadrangleVerticesRadius"] = quadrangleVerticesRadius;
    scene.updateQuadrangleVerticesRadius(quadrangleVerticesRadius);
  }
  scene.settings["lineType"] = document.getElementById("line-type")
    .getElementsByClassName("current-icon")[0].getAttribute("value");
  scene.updateQuadrangleLines();
}

function toggleDropdownIconList(e) {
  const listToShow = e.currentTarget.getElementsByClassName("list-of-icons")[0];
  if (listToShow.style.display != "flex") {
    e.currentTarget.style.backgroundColor = "rgb(200, 200, 200)";
    listToShow.style.display = "flex";
  }
  else {
    e.currentTarget.style.backgroundColor = "whitesmoke";
    listToShow.style.display = "none";
  }
}

function changeCurrIcon(e) {
  let dropdownIcon = e.currentTarget.parentElement.parentElement;
  let currIcon = dropdownIcon.getElementsByClassName("current-icon")[0];
  let listItem = e.currentTarget;
  let tmp = currIcon.innerHTML;
  currIcon.innerHTML = listItem.innerHTML;
  listItem.innerHTML = tmp;

  tmp = currIcon.getAttribute("value");
  currIcon.setAttribute("value", listItem.getAttribute("value"));
  listItem.setAttribute("value", tmp);


}

document.getElementById("line-type").addEventListener("click", toggleDropdownIconList);
for (let currList of document.getElementsByClassName("list-of-icons")) {
  for (let currItem of currList.getElementsByClassName("list-item")) {
    currItem.addEventListener("click", changeCurrIcon);
  }
}