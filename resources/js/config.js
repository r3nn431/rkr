// js/config.js
import { player } from './player.js';
import { logError } from './utils.js';

export const CONFIG_PATH = 'data/config.json';

export const audioBGM = document.createElement('audio');
document.body.appendChild(audioBGM);
const activeBGSAudios = {};

const logContent = document.getElementById('log-container');
const dialogBox = document.getElementById('dialogbox');
let dialogTimer = null, currentDialogText = '';

export let config = {
    textSpeed: 30,
    volumeBGM: 60,
    volumeSFX: 60,
    volumeBGS: 60,
    enemySpeed: "NORMAL"
}

let tempVolumeSFX = config.volumeSFX;

export const settingsElements = {
    bgmVolume: document.getElementById('bgm-volume'),
    sfxVolume: document.getElementById('sfx-volume'),
    textSpeed: document.getElementById('text-speed'),
    enemySpeed: document.getElementById('enemy-speed'),
    bgmVolumeValue: document.getElementById('bgm-volume-value'),
    sfxVolumeValue: document.getElementById('sfx-volume-value'),
    textSpeedValue: document.getElementById('text-speed-value')
}

export function playBGM(name){
    audioBGM.src = "/assets/audio/bgm/"+name;
    audioBGM.volume = config.volumeBGM / 100;
    audioBGM.loop = true;
    audioBGM.play();
}

export function playSFX(name){
    const audio = document.createElement('audio');
    audio.src = "/assets/audio/sfx/"+name;
    document.body.appendChild(audio);
    audio.volume = config.volumeSFX / 100;
    audio.play();
    audio.onended = function () {
        this.parentNode.removeChild(this);
    }
}

export function playBGS(name) {
    if (activeBGSAudios[name] && !activeBGSAudios[name].paused) {
        return;
    }
    if (activeBGSAudios[name] && activeBGSAudios[name].paused) {
        activeBGSAudios[name].play()
            .catch(error => {
                logError(new Error(`Error playing ${name}: ${error.message}`));
            });
        return;
    }
    const audio = new Audio("/assets/audio/bgs/"+name);
    audio.loop = true;
    audio.volume = config.volumeBGS / 100;
    audio.play()
        .then(() => {
            activeBGSAudios[name] = audio;
        })
        .catch(error => {
            logError(new Error(`Error playing ${name}: ${error.message}`));
        });
}

export function stopBGS(name) {
    if (activeBGSAudios[name]) {
        activeBGSAudios[name].pause();
        activeBGSAudios[name].currentTime = 0;
    }
}

export function isBGSPlaying(name) {
    return activeBGSAudios[name] && !activeBGSAudios[name].paused;
}

function addToLog(text){
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.innerHTML = processDialogText(text);
    if (logContent.firstChild) {
        logContent.insertBefore(logEntry, logContent.firstChild);
    } else {
        logContent.appendChild(logEntry);
    }
    if (logContent.children.length > 100) {
        logContent.removeChild(logContent.lastChild);
    }
    player.log.push(text);
}

function processDialogText(text) {
    return text
        .replace(/\[b\](.*?)\[\/b\]/g, '<span class="bold">$1</span>')
        .replace(/\[i\](.*?)\[\/i\]/g, '<span class="italic">$1</span>')
        .replace(/\[imp\](.*?)\[\/imp\]/g, '<span class="important">$1</span>')
        .replace(/\[c:(.*?)\](.*?)\[\/c\]/g, '<span class="$1">$2</span>')
        .replace(/\n/g, '<br>');
}

function finishDialog() {
    clearInterval(dialogTimer);
    dialogTimer = null;
    dialogBox.innerHTML = processDialogText(currentDialogText);
}

export function showDialog(text, { speed = config.textSpeed, doLog = true } = {}) {
    if (dialogTimer) {
        clearInterval(dialogTimer);
        dialogTimer = null;
        dialogBox.innerHTML = processDialogText(currentDialogText) + '<br>';
    } else {
        dialogBox.innerHTML = '';
    }
    if (doLog) addToLog(text);
    currentDialogText = text;

    const fullHtml = processDialogText(text);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = fullHtml;
    const plainText = tempDiv.textContent || tempDiv.innerText;
    let currentIndex = 0;
    dialogTimer = setInterval(() => {
        if (currentIndex >= plainText.length) {
            finishDialog();
            return;
        }
        let charsConsumed = 0;
        let resultHtml = '';
        const tagRegex = /(<[^>]+>)|([^<]+)/g;
        let match;
        
        while ((match = tagRegex.exec(fullHtml)) !== null && charsConsumed <= currentIndex) {
            if (match[1]) {
                resultHtml += match[1];
            } else {
                const textContent = match[2];
                const charsToShow = Math.min(
                    textContent.length,
                    currentIndex + 1 - charsConsumed
                );
                
                if (charsToShow > 0) {
                    resultHtml += textContent.substring(0, charsToShow);
                    charsConsumed += charsToShow;
                }
            }
        }
        dialogBox.innerHTML = 
            (dialogBox.innerHTML.includes('<br>') 
                ? dialogBox.innerHTML.replace(/<br>.*$/, '<br>' + resultHtml)
                : resultHtml
            );
        currentIndex++;
        dialogBox.scrollTop = dialogBox.scrollHeight;
    }, speed);
}

await Neutralino.events.on('windowBlur', onWindowBlur);
await Neutralino.events.on('windowFocus', onWindowFocus);

function onWindowBlur() {
    audioBGM.volume = 0.0;
    tempVolumeSFX = config.volumeSFX;
    config.volumeSFX = 0.0;
}

function onWindowFocus() {
    audioBGM.volume = config.volumeBGM / 100;
    config.volumeSFX = tempVolumeSFX;
}