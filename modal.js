document.querySelector(".modal-close").addEventListener("click", () => {
    document.querySelector(".modal-wrapper").style.display = "none";
})
document.querySelector("#help-icon").addEventListener("click", () => {
    document.querySelector(".modal-wrapper").style.display = "flex";
});