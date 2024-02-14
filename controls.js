(async function () {
  await scenePromice;
  function hideSettingsMenu(e) {
    document.getElementById("settings").style.display = "none";
  }
  document.getElementById("viewport").addEventListener("click", hideSettingsMenu);
  document.getElementById("viewport").addEventListener("touchstart", hideSettingsMenu);

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
    scene.changeQuadrangleLineType(tmp === "dashed" ? Scene.LineTypes.Solid : Scene.LineTypes.Dashed);
  }

  document.getElementById("quadrangle-line-type").addEventListener("click", toggleDropdownIconList);
  for (let currList of document.getElementsByClassName("list-of-icons")) {
    for (let currItem of currList.getElementsByClassName("list-item")) {
      currItem.addEventListener("click", changeCurrIcon);
    }
  }

  settingsMenu.addEventListener("pointerenter", (e) => scene.showCursorDistances(false));
  settingsIcon.addEventListener("pointerenter", (e) => scene.showCursorDistances(false));
  document.getElementById("trash-can-icon").addEventListener("pointerenter", (e) => scene.showCursorDistances(false));
})();