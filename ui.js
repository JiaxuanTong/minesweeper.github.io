document.addEventListener("DOMContentLoaded", function () {
    const popup = document.querySelector(".popup");
    const minimizeButton = document.querySelector(".popup-minimize");

    if (!popup || !minimizeButton) {
        return;
    }

    minimizeButton.addEventListener("click", function () {
        popup.style.display = "none";
    });
});
