// js/main.js
import * as db from './database.js';
import { config, CONFIG_PATH, settingsElements, audioBGM, playBGM, playSFX, showDialog } from './config.js';
import { 
    showToast, togglePnl, changePnl, userConfirmation, formatDate, debounce, adjustReceivedData, logError, attachTooltips, getActivePnl, getWeightedRandom, ensureValidSidePanel, 
    setStorage, getStorage, getJsonFile, setJsonFile, verifyPath
} from "./utils.js";
import { player, createPlayer } from './player.js';
import { enemies, clearAllEnemies, callEnemy } from './enemy.js';
import { events, clearAllEvents, callEvent } from './event.js';

// NEUTRALINO FUNCTIONS
async function onWindowClose() {
    await userConfirmation('Exit game? All progress will be lost').then(async (result) => {
        if (result === 0) {
            Neutralino.app.exit();
        }
    });
}
Neutralino.init();
Neutralino.events.on("windowClose", onWindowClose);
const version = NL_APPVERSION;

window.onerror = function(message, source, lineno, colno, error) {
    const fullError = error || new Error(message);
    if (!fullError.stack) {
        fullError.stack = `Error: ${message}\n    at ${source}:${lineno}:${colno}`;
    }
    fullError.details = {
        sourceURL: source,
        lineNumber: lineno,
        columnNumber: colno,
        timestamp: new Date().toISOString()
    };
    logError(fullError, 'windowError');
    return true;
};

window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    logError(error, 'unhandledRejection');
});

// GAME
const imgBackground = document.getElementById('bg');
const pnlMenu = document.getElementById('menu-content');
const gamePnls = Array.from(document.querySelectorAll('[data-pages="main"]'));
const sidePnls = Array.from(document.querySelectorAll('[data-pages="side"]'));

const dirPaths = ['data', 'saves'];
let wordInterval = null;
let glitchInterval = null;
const titleWords = [
    document.getElementById('word1'),
    document.getElementById('word2'),
    document.getElementById('word3')
];
let stepToggle = false;
export let isLoading = true;

function setBackground(name){
    document.getElementById('bg').src = `assets/img/bg/${name}`;
}

function cleanupMenu() {
    if (wordInterval) {
        clearInterval(wordInterval);
        wordInterval = null;
    }
    if (glitchInterval) {
        clearInterval(glitchInterval);
        glitchInterval = null;
    }
    titleWords.forEach(word => word.classList.remove('active'));
}

function setupMenu(){
    let currentIndex = 0;
    titleWords[currentIndex].classList.add('active');
    wordInterval = setInterval(() => {
        titleWords[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % titleWords.length;
        titleWords[currentIndex].classList.add('active');
    }, 2000);
    glitchInterval = setInterval(() => {
        const randomWord = titleWords[Math.floor(Math.random() * titleWords.length)];
        randomWord.style.animation = 'none';
        void randomWord.offsetWidth;
        randomWord.style.animation = 'shake-glitch 0.3s infinite alternate';
        setTimeout(() => {
            randomWord.style.animation = 'shake-glitch 1s infinite alternate';
        }, 300);
    }, 3000);
    //playBGM('menu.ogg');
}

Neutralino.events.on("ready", async () => {
    document.getElementById('version').textContent = version;
    document.getElementById('btn-menu-leave').addEventListener('click', onWindowClose);
    document.getElementById('btn-advance').addEventListener('click', attemptAdvance);
    document.getElementById('btn-character').addEventListener('click', () => changePnl(document.getElementById('character'), sidePnls));
    document.getElementById('btn-inventory').addEventListener('click', () => changePnl(document.getElementById('inventory'), sidePnls));
    document.getElementById('btn-log').addEventListener('click', () => changePnl(document.getElementById('log'), sidePnls));
    document.getElementById('btn-settings').addEventListener('click', () => changePnl(document.getElementById('settings'), sidePnls));
    document.getElementById('btn-help').addEventListener('click', () => changePnl(document.getElementById('help'), sidePnls));
    document.getElementById('btn-files').addEventListener('click', () => changePnl(document.getElementById('files'), sidePnls));
    document.getElementById('btn-statistics').addEventListener('click', () => changePnl(document.getElementById('statistics'), sidePnls));
    document.getElementById('btn-abilities').addEventListener('click', () => changePnl(document.getElementById('abilities'), sidePnls));
    document.getElementById('btn-effects').addEventListener('click', () => changePnl(document.getElementById('effects'), sidePnls));
    document.getElementById('btn-recipes').addEventListener('click', () => changePnl(document.getElementById('recipes'), sidePnls));

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
    setupMenu();

    for (const dirPath of dirPaths) {
        let exists = await verifyPath(dirPath);
        if (!exists) {
            await Neutralino.filesystem.createDirectory(dirPath);
        }
    }

    let configFile = await getJsonFile(CONFIG_PATH);
    if(configFile !== null){
        Object.assign(config, configFile);
    } else {
        await setJsonFile(CONFIG_PATH, config);
    }
    settingsElements.bgmVolume.value = config.volumeBGM;
    settingsElements.sfxVolume.value = config.volumeSFX;
    settingsElements.textSpeed.value = config.textSpeed;
    settingsElements.enemySpeed.value = config.enemySpeed;
    settingsElements.bgmVolumeValue.textContent = `${settingsElements.bgmVolume.value}%`;
    settingsElements.sfxVolumeValue.textContent = `${settingsElements.sfxVolume.value}%`;
    settingsElements.textSpeedValue.textContent = settingsElements.textSpeed.value;
    
    settingsElements.bgmVolume.addEventListener('input', () => {
        settingsElements.bgmVolumeValue.textContent = `${settingsElements.bgmVolume.value}%`;
        audioBGM.volume = settingsElements.bgmVolume.value / 100;
        config.volumeBGM = settingsElements.bgmVolume.value;
    });
    
    settingsElements.sfxVolume.addEventListener('input', () => {
        settingsElements.sfxVolumeValue.textContent = `${settingsElements.sfxVolume.value}%`;
        config.volumeSFX = settingsElements.sfxVolume.value;
    });
    
    settingsElements.textSpeed.addEventListener('input', () => {
        settingsElements.textSpeedValue.textContent = settingsElements.textSpeed.value;
        config.textSpeed = settingsElements.textSpeed.value;
        showDialog(`Text speed changed to ${settingsElements.textSpeed.value}! What a speed!`, { doLog: false });
    });

    settingsElements.enemySpeed.addEventListener('change', () => {
        config.enemySpeed = settingsElements.enemySpeed.value;
        enemies.forEach(enemy => {
            cancelAnimationFrame(enemy.animationFrame);
            enemy.startMovement();
        });
    });

    document.getElementById('settings').addEventListener('change', debounce(saveConfig, 300));

    document.getElementById('constitution-row').setAttribute('data-tooltip', `
        <p class="tooltip-name">Constitution</p>
        <p class="tooltip-description">"Increases your resistance to damage and increases your maximum health"</p>
        <p class="tooltip-effect">+20 max HP<br>+1 defense</p>
    `);
    document.getElementById('strength-row').setAttribute('data-tooltip', `
        <p class="tooltip-name">Strength</p>
        <p class="tooltip-description">"Increases the raw damage of your physical attacks"</p>
        <p class="tooltip-effect">+2 attack</p>
    `);
    document.getElementById('dexterity-row').setAttribute('data-tooltip', `
        <p class="tooltip-name">Dexterity</p>
        <p class="tooltip-description">"Improves your agility, increasing your chances of dodging and escaping battles"</p>
        <p class="tooltip-effect">+1 evasion<br>+1 stealth</p>
    `);
    document.getElementById('arcane-row').setAttribute('data-tooltip', `
        <p class="tooltip-name">Arcane</p>
        <p class="tooltip-description">"Increases your ability to use powers"</p>
        <p class="tooltip-effect">+2 max MP</p>
    `);
    attachTooltips();
});

function saveConfig(){
    setJsonFile(CONFIG_PATH, config);
}

document.getElementById('btn-exit-game').addEventListener('click', async () => {
    await userConfirmation('Exit game? All progress will be lost', 'Exit', 'Restart').then(async (result) => {
        if (result === 0) {
            Neutralino.app.exit();
        } else if (result === 1) {
            clearAllEnemies();
            clearAllEvents();
            player.destroy();
            changePnl(document.getElementById('menu-container'), gamePnls);
            pnlMenu.classList.add('screen-on');
            setupMenu();
        }
    });
});

document.getElementById('btn-menu-start').addEventListener('click', () => {
    cleanupMenu();
    pnlMenu.classList.remove('screen-on');
    pnlMenu.classList.add('screen-off');
    setTimeout(() => {
        pnlMenu.classList.remove('screen-off');
        startGame();
        changePnl(document.getElementById('game-container'), gamePnls);
        changePnl(document.getElementById('character'), sidePnls);
    }, 500);
});

function startGame(){
    isLoading = true;
    document.getElementById('btn-advance').disabled = false;
    createPlayer();
    setBackground('corridor.png');
    //playBGM('corridor1.ogg');
    showDialog('You enter the dark dungeon...');
    isLoading = false;
}

function attemptAdvance(){
    if (player.isDead) return false;
    if (enemies.length === 0) {
        advance();
        return true;
    }
    const canEscape = enemies.every(enemy => 
        enemy.onPlayerAttemptEscape()
    );
    if (canEscape) {
        showDialog(`You successfully escaped the battle!`);
        clearAllEnemies();
        advance();
        return true;
    } else {
        showDialog(`Escape failed!`);
        return false;
    }
}

function getModifiedOutcome(){
    const outcomes = JSON.parse(JSON.stringify(db.events));
    // thief rarity 0 if already dead
    return getWeightedRandom(outcomes);
}

function getModifiedEnemies(){
    const outcomes = JSON.parse(JSON.stringify(db.enemies));
    const eligibleEnemies = outcomes.filter(enemy => enemy.list === 'NORMAL');
    return getWeightedRandom(eligibleEnemies);
}

function advance() {
    document.getElementById('btn-advance').textContent = 'ADVANCE';
    clearAllEvents();
    player.resetBattle();
    document.getElementById('btn-advance').disabled = true;
    ensureValidSidePanel();

    imgBackground.classList.remove('walk-effect-up', 'walk-effect-down');
    if(stepToggle) {
        imgBackground.classList.add('walk-effect-up');
    } else {
        imgBackground.classList.add('walk-effect-down');
    }
    stepToggle = !stepToggle;

    setTimeout(() => {
        document.getElementById('btn-advance').disabled = false;
        player.distance += 1;
        player.elements.distance.textContent = player.distance;

        const outcome = getModifiedOutcome();
        if (!outcome) {
            logError(new Error('No outcome found'));
            return;
        }
        switch(outcome.id) {
            case 'outcome-enemy':{
                showDialog('An enemy approaches!');
                let selectedEnemy = getModifiedEnemies();
                callEnemy(selectedEnemy.id);
                break;
            }
            case 'event-chest':{
                showDialog('You find a chest!');
                callEvent('event-chest');
                break;
            }
            case 'event-trap':{
                showDialog('It is a trap!');
                callEvent('event-trap');
                const additionalTrapChance = 0.3;
                const secondAdditionalTrapChance = 0.1;
                if (Math.random() < additionalTrapChance) {
                    setTimeout(() => {
                        callEvent('event-trap');
                        if (Math.random() < secondAdditionalTrapChance) {
                            setTimeout(() => {
                                callEvent('event-trap');
                            }, 500);
                        }
                    }, 500);
                }
                break;
            }
            case 'event-bee':{
                // show event bee if queen bee is alive, if not call bee swarm
                break;
            }
            default: {
                showDialog('You keep going...');
                break;
            }
        }
    }, 500);
}



function verifyLoadData(data){
    if (!data) return false;
    if(data[version]!=version) {
        showToast(`Warning! Versions mismatch - (save version: ${data[version]}/game version: ${version}) Some things may not work properly.`, 'warn');
    } else showToast("Game loaded", "success");
    
    log.forEach(function(eventText) {
        const logLine = document.createElement("p");
        logLine.textContent = eventText;
        lblLog.appendChild(logLine);
        lblLog.scrollTop = lblLog.scrollHeight;
    }); 
    // display dialog last log
}