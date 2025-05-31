// js/main.js
import { 
    changePnl, showToast 
} from "./utils.js";
import ProgressBar from './progressBar.js';
import * as db from './database.js';

// NEUTRALINO FUNCTIONS
function onWindowClose() {
    Neutralino.app.exit();
}
Neutralino.init();
Neutralino.events.on("windowClose", onWindowClose);
const version = NL_APPVERSION;

// GAME
function playBGM(name){
    audioBGM.src = "/audio/bgm/"+name;
    audioBGM.volume = volumeBGM / 100;
    audioBGM.play();
    audioBGM.loop = true;
}

function playSE(name){
    const audio = document.createElement('audio');
    audio.src = "/audio/se/"+name;
    document.body.appendChild(audio);
    audio.volume = volumeSE / 100;
    audio.play();
    audio.onended = function () {
        this.parentNode.removeChild(this);
    }
}

Neutralino.events.on("ready", async () => {
    document.getElementById('version').textContent = version;
    document.getElementById('btn-menu-leave').addEventListener('click', onWindowClose);

    document.addEventListener('contextmenu', function(event) {
        event.preventDefault();
    });

    document.querySelectorAll(`.link`).forEach(a => {
        a.addEventListener('click',  (e) => {
            e.preventDefault();
            const url = e.target.href;
            Neutralino.os.open(url);
        });
    });
});