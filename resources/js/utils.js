// js/utils.js
const TOAST_DURATION = 3000;
const TOAST_ANIMATION_DURATION = 300;

function showToast(message, type = 'info', duration = TOAST_DURATION) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = {
        success: 'check_circle',
        error: 'error',
        warning: 'warning',
        info: 'info'
    };
    toast.innerHTML = `
        <span class="material-icons">${icons[type] || 'info'}</span>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, TOAST_ANIMATION_DURATION);
    }, duration);
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

document.querySelectorAll('.tooltip').forEach(el => {
    const tooltip = document.createElement('div');
    tooltip.classList.add('medieval-tooltip');
    tooltip.textContent = el.getAttribute('data-tooltip');
    document.body.appendChild(tooltip);
    el.addEventListener('mouseenter', () => {
        tooltip.style.display = 'block';
        tooltip.style.opacity = '1';
    });
    el.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
        tooltip.style.display = 'none';
    });
    el.addEventListener('mousemove', (event) => {
        const tooltipHeight = tooltip.offsetHeight;
        const tooltipWidth = tooltip.offsetWidth;
        let yPosition = event.clientY - tooltipHeight - 10;
        let xPosition = event.clientX - tooltipWidth / 2;
        if (event.clientY - tooltipHeight - 10 > 0) {
            yPosition = event.clientY - tooltipHeight - 10;
        } else {
            yPosition = event.clientY + 20;
        }
        if (xPosition + tooltipWidth > window.innerWidth) {
            xPosition = window.innerWidth - tooltipWidth - 10;
        } else if (xPosition < 0) {
            xPosition = 10;
        }
        tooltip.style.left = `${xPosition}px`;
        tooltip.style.top = `${yPosition}px`;
    });
});

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
    showToast, togglePnl, changePnl, getRandomInt, userConfirmation, formatDate, debounce, adjustReceivedData, logError, getWeightedRandom, showDamageNumber, 
    setStorage, getStorage, getJsonFile, setJsonFile, verifyPath
};
