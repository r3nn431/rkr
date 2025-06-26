// js/utils.js
import { isLoading } from "./main.js";

const TOAST_DURATION = 3000;
const TOAST_ANIMATION_DURATION = 300;
let sharedTooltip;

function showToast(message, type = 'info', options = {}) {
    const {
        duration = TOAST_DURATION,
        position = 'bottom',
        icon = null,
        targetElement = null,
        direction = 'left'
    } = options;
    if (isLoading && targetElement) {
        return;
    }
    let container;
    if (targetElement) {
        const targetId = targetElement.id || 'target-'+Date.now();
        container = document.getElementById(`toast-container-${targetId}`);
        if (!container) {
            container = document.createElement('div');
            container.id = `toast-container-${targetId}`;
            container.className = `toast-target-container ${direction}`;
            document.body.appendChild(container);
            updateTargetContainerPosition(container, targetElement, direction);
            const observer = new ResizeObserver(() => {
                updateTargetContainerPosition(container, targetElement, direction);
            });
            observer.observe(targetElement);
        }
    } else {
        container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        container.className = `toast-container ${position}`;
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type} medieval-toast ${targetElement ? 'near-element' : ''}`;
    const icons = {
        success: 'check_circle',
        error: 'error',
        warning: 'warning',
        info: 'info',
        added: 'add',
        removed: 'remove',
        buff: 'arrow_upward',
        debuff: 'arrow_downward'
    };
    toast.innerHTML = `
        <span class="material-icons">${icon || icons[type] || 'info'}</span>
        <span>${message}</span>
        <div class="toast-decoration"></div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
            if (targetElement && container.children.length === 0) {
                container.remove();
            }
        }, TOAST_ANIMATION_DURATION);
    }, duration);
}

function updateTargetContainerPosition(container, targetElement, direction) {
    const rect = targetElement.getBoundingClientRect();
    const gap = 10;
    if (direction === 'right') {
        container.style.left = `${rect.right + gap}px`;
        container.style.top = `${rect.top}px`;
    } else {
        container.style.left = `${rect.left - gap - 200}px`;
        container.style.top = `${rect.top}px`;
    }
    container.style.position = 'absolute';
}

function togglePnl(pnl) {
    pnl.classList.toggle('hidden');
}

function changePnl(pnl, containers) {
    if (!pnl?.classList || !containers) return;
    containers.forEach(p => p.classList.add('hidden'));
    pnl.classList.remove('hidden');
    window.scrollTo({ top: 0 });
}

function getActivePnl(panels) {
    return panels.find(panel => {
        const isHidden = panel.classList.contains('hidden') || 
                         panel.style.display === 'none' || 
                         panel.style.visibility === 'hidden';
        return !isHidden;
    });
}

function ensureValidSidePanel() {
    const invalidPnls = ['seller', 'recipes'];
    const activePanel = getActivePnl(sidePnls);
    if (!activePanel || invalidPnls.includes(activePanel.id)) {
        changePnl(document.getElementById('character'), sidePnls);
    }
}

function attachTooltips() {
    if (!sharedTooltip) {
        sharedTooltip = document.createElement('div');
        sharedTooltip.classList.add('medieval-tooltip');
        sharedTooltip.style.display = 'none';
        document.body.appendChild(sharedTooltip);
    }
    document.querySelectorAll('.tooltip').forEach(el => {
        el.addEventListener('mouseenter', () => {
            sharedTooltip.innerHTML = el.getAttribute('data-tooltip');
            sharedTooltip.style.display = 'block';
            sharedTooltip.style.opacity = '1';
        });
        el.addEventListener('mouseleave', () => {
            sharedTooltip.style.opacity = '0';
            sharedTooltip.style.display = 'none';
        });
        el.addEventListener('mousemove', (event) => {
            const tooltipHeight = sharedTooltip.offsetHeight;
            const tooltipWidth = sharedTooltip.offsetWidth;
            let yPosition = event.clientY - tooltipHeight - 10;
            let xPosition = event.clientX - tooltipWidth / 2;
            if (yPosition < 0) yPosition = event.clientY + 20;
            if (xPosition < 10) xPosition = 10;
            else if (xPosition + tooltipWidth > window.innerWidth - 10) {
                xPosition = window.innerWidth - tooltipWidth - 10;
            }
            sharedTooltip.style.left = `${xPosition}px`;
            sharedTooltip.style.top = `${yPosition}px`;
        });
    });
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function userConfirmation(request = null, acceptText = 'Yes', recuseText = null) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        const overlay = document.createElement('div');
        const content = document.createElement('div');
        const title = request ? document.createElement('h3') : null;
        const message = document.createElement('p');
        const buttonContainer = document.createElement('div');
        const acceptButton = document.createElement('button');
        modal.className = 'confirmation-modal';
        overlay.className = 'confirmation-overlay';
        content.className = 'confirmation-content';
        buttonContainer.className = 'confirmation-buttons';
        acceptButton.className = 'confirmation-button confirm';
        if (title) {
            title.textContent = request;
            title.style.textAlign = 'center';
            title.style.marginBottom = '0.5rem';
            content.appendChild(title);
        }
        message.textContent = 'Are you sure?';
        message.className = 'confirmation-message';
        content.appendChild(message);
        acceptButton.textContent = acceptText;
        acceptButton.addEventListener('click', () => {
            document.body.removeChild(modal);
            resolve(0);
        });
        buttonContainer.appendChild(acceptButton);
        if (recuseText) {
            const recuseButton = document.createElement('button');
            recuseButton.className = 'confirmation-button deny';
            recuseButton.textContent = recuseText;
            recuseButton.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(1);
            });
            buttonContainer.appendChild(recuseButton);
        }
        const cancelButton = document.createElement('button');
        cancelButton.className = 'confirmation-button cancel';
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('click', () => {
            document.body.removeChild(modal);
            resolve(2);
        });
        buttonContainer.appendChild(cancelButton);
        content.appendChild(buttonContainer);
        modal.appendChild(overlay);
        modal.appendChild(content);
        document.body.appendChild(modal);
        overlay.addEventListener('click', () => {
            document.body.removeChild(modal);
            resolve(2);
        });
    });
}


function formatDate(date, showTime = false) {
    if (!date) return '';
    const dataObj = date.toDate ? date.toDate() : new Date(date);
    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    if (showTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.second = '2-digit';
    }
    return dataObj.toLocaleDateString(undefined, options);
}

function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

function adjustReceivedData(dataOriginal, dataReceived) {
    for (let i = 0; i < dataOriginal.length; i++) {
        if (dataReceived[i] === undefined) {
            dataReceived[i] = dataOriginal[i];
        }
    }
}

async function logError(error, type = 'handled') {
    const LOG_PATH = 'error.log';
    const date = formatDate(new Date(), true);
    const logEntry = `[${date}] [${type}] ${error.name}: ${error.message}\n${error.stack || '-- no stack trace --'}\n\n`;
    console.error(logEntry);
    showToast('Something went wrong, see Help in how to submit a bug report', 'error');
    try {
        await Neutralino.filesystem.appendFile(LOG_PATH, logEntry);
    } catch (writeError) {
        console.error('Error logging error:', writeError);
    }
}

function getWeightedRandom(collection, rarityKey = 'rarity') {
    //const totalWeight = collection.reduce((sum, item) => sum + (item.rarity || 1), 0);
    const totalWeight = collection.reduce((sum, item) => {
        const weight = Number(item[rarityKey]);
        return sum + (isNaN(weight) ? 0 : weight);
    }, 0);
    if (totalWeight <= 0) {
        logError(new Error(`Invalid total weight (${totalWeight}) for "${collection}"`));
        return null;
    }
    let random = Math.random() * totalWeight;
    for (const item of collection) {
        const weight = Number(item[rarityKey] || 0);
        random -= weight;
        if (random <= 0) return {...item};
    }
    return collection[collection.length - 1];
}

function showDamageNumber(damage, x, y) {
    const popup = document.createElement('div');
    popup.className = 'damage-popup';
    popup.textContent = `-${damage}`;
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    document.getElementById('game-container').appendChild(popup);
    setTimeout(() => {
        popup.remove();
    }, 1000);
}

// NEUTRALINO
async function setStorage(filename, data){
    await Neutralino.storage.setData(filename, JSON.stringify(data));
}

async function getStorage(filename) {
    try {
        let temp = await Neutralino.storage.getData(filename);
        return JSON.parse(temp);
    } catch (error) {
        logError(error);
        return null;
    }
}

async function verifyPath(path){
    try {
        await Neutralino.filesystem.getStats(path);
        return true;
    } catch (error) {
        if (error.code === 'NE_FS_NOPATHE') return false;
        logError(error);
        return false;
    }
}

async function getJsonFile(filepath) {
    try {
        await Neutralino.filesystem.getStats(filepath);
        const content = await Neutralino.filesystem.readFile(filepath);
        return JSON.parse(content);
    } catch (error) {
        if (error.code !== 'NE_FS_NOPATHE') logError(error);
        return null;
    }
}

async function setJsonFile(filepath, data) {
    try {
        await Neutralino.filesystem.writeFile(filepath, JSON.stringify(data, null, 4));
        return true;
    } catch (error) {
        logError(error);
        return false;
    }
}

export { 
    showToast, togglePnl, changePnl, getRandomInt, userConfirmation, formatDate, debounce, adjustReceivedData, logError, getWeightedRandom, showDamageNumber, attachTooltips, getActivePnl, ensureValidSidePanel, 
    setStorage, getStorage, getJsonFile, setJsonFile, verifyPath
};
