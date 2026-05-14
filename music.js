document.addEventListener("DOMContentLoaded", function () {
    const musicButton = document.getElementById("musicButton");
    const bgm = document.getElementById("bgm");
    const volumeSlider = document.getElementById("volumeSlider");
    const volumeButton = document.getElementById("volumeButton");
    const musicControls = document.querySelector(".music-controls");

    if (!musicButton || !bgm) {
        return;
    }

    let previousVolume = volumeSlider ? Number(volumeSlider.value) / 100 : 0.6;
    bgm.volume = previousVolume;
    const starColors = ["#fff4c9", "#ffd6dc", "#cfc5ff", "#ffffff"];

    function stopStars() {
        const starLayer = document.querySelector(".star-layer");

        if (starLayer) {
            starLayer.remove();
        }
    }

    function startStars() {
        stopStars();

        const starLayer = document.createElement("div");
        starLayer.className = "star-layer";

        for (let i = 0; i < 24; i++) {
            const star = document.createElement("span");
            const size = 10 + Math.random() * 12;
            const duration = 8 + Math.random() * 8;
            const delay = Math.random() * -duration;
            const drift = -36 + Math.random() * 72;

            star.className = "floating-star";
            star.textContent = Math.random() > 0.35 ? "\u2726" : "\u2727";
            star.style.left = Math.random() * 100 + "vw";
            star.style.setProperty("--star-size", size + "px");
            star.style.setProperty("--star-duration", duration + "s");
            star.style.setProperty("--star-delay", delay + "s");
            star.style.setProperty("--star-drift", drift + "px");
            star.style.setProperty("--star-color", starColors[i % starColors.length]);
            starLayer.appendChild(star);
        }

        document.body.appendChild(starLayer);
    }

    musicButton.addEventListener("click", function () {
        if (bgm.paused) {
            const playRequest = bgm.play();
            musicButton.classList.add("is-playing");
            if (musicControls) {
                musicControls.classList.add("is-active");
            }
            musicButton.setAttribute("aria-label", "Pause music");
            musicButton.setAttribute("title", "Pause music");
            startStars();

            if (playRequest) {
                playRequest.catch(function (error) {
                    musicButton.classList.remove("is-playing");
                    if (musicControls) {
                        musicControls.classList.remove("is-active");
                    }
                    musicButton.setAttribute("aria-label", "Play music");
                    musicButton.setAttribute("title", "Play music");
                    stopStars();
                    console.error("Music could not play:", error);
                });
            }
        } else {
            bgm.pause();
            musicButton.classList.remove("is-playing");
            if (musicControls) {
                musicControls.classList.remove("is-active");
            }
            musicButton.setAttribute("aria-label", "Play music");
            musicButton.setAttribute("title", "Play music");
            stopStars();
        }
    });

    if (volumeSlider) {
        volumeSlider.addEventListener("input", function () {
            const nextVolume = Number(volumeSlider.value) / 100;
            bgm.volume = nextVolume;

            if (nextVolume > 0) {
                previousVolume = nextVolume;
                bgm.muted = false;
                if (volumeButton) {
                    volumeButton.classList.remove("is-muted");
                    volumeButton.setAttribute("aria-label", "Mute music");
                    volumeButton.setAttribute("title", "Mute music");
                }
            } else if (volumeButton) {
                bgm.muted = true;
                volumeButton.classList.add("is-muted");
                volumeButton.setAttribute("aria-label", "Unmute music");
                volumeButton.setAttribute("title", "Unmute music");
            }
        });
    }

    if (volumeButton) {
        volumeButton.addEventListener("click", function () {
            if (bgm.muted || bgm.volume === 0) {
                const restoredVolume = previousVolume || 0.6;
                bgm.muted = false;
                bgm.volume = restoredVolume;
                if (volumeSlider) {
                    volumeSlider.value = Math.round(restoredVolume * 100);
                }
                volumeButton.classList.remove("is-muted");
                volumeButton.setAttribute("aria-label", "Mute music");
                volumeButton.setAttribute("title", "Mute music");
            } else {
                previousVolume = bgm.volume;
                bgm.muted = true;
                if (volumeSlider) {
                    volumeSlider.value = 0;
                }
                volumeButton.classList.add("is-muted");
                volumeButton.setAttribute("aria-label", "Unmute music");
                volumeButton.setAttribute("title", "Unmute music");
            }
        });
    }
});
