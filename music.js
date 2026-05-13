document.addEventListener("DOMContentLoaded", function () {
    const musicButton = document.getElementById("musicButton");
    const bgm = document.getElementById("bgm");

    if (!musicButton || !bgm) {
        return;
    }

    bgm.volume = 0.6;

    musicButton.addEventListener("click", function () {
        if (bgm.paused) {
            const playRequest = bgm.play();
            musicButton.classList.add("is-playing");
            musicButton.setAttribute("aria-label", "Pause music");
            musicButton.setAttribute("title", "Pause music");

            if (playRequest) {
                playRequest.catch(function (error) {
                    musicButton.classList.remove("is-playing");
                    musicButton.setAttribute("aria-label", "Play music");
                    musicButton.setAttribute("title", "Play music");
                    console.error("Music could not play:", error);
                });
            }
        } else {
            bgm.pause();
            musicButton.classList.remove("is-playing");
            musicButton.setAttribute("aria-label", "Play music");
            musicButton.setAttribute("title", "Play music");
        }
    });
});
