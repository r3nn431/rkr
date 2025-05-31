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

function createTooltip(father, text){
    const tooltip = document.createElement('div');
    tooltip.classList.add('tooltip');
    tooltip.textContent = text;
    const lblHover = document.querySelector(father);
    lblHover.addEventListener('mouseover', () => {
        tooltip.style.display = 'block';
    });
    lblHover.addEventListener('mouseout', () => {
        tooltip.style.display = 'none';
    });
    lblHover.addEventListener('mousemove', (event) => {
        const tooltipHeight = tooltip.offsetHeight;
        const screenHeight = window.innerHeight;
        const tooltipPositionTop = event.clientY - tooltipHeight - 10;
        const tooltipPositionBottom = event.clientY + 10;
        if (tooltipPositionTop > 0) {
            tooltip.style.top = tooltipPositionTop + 'px';
        } else {
            tooltip.style.top = tooltipPositionBottom + 'px';
        }
        tooltip.style.left = event.clientX + 'px';
    });
    document.body.appendChild(tooltip);
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getArrayIndexByName(array, name){
    return index = array.findIndex(function(element) {
        return element.name === name;
    });
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

// NEUTRALINO
async function setStorage(filename, data){
    await Neutralino.storage.setData(filename, JSON.stringify(data));
}

async function getStorage(filename) {
    try {
        let temp = await Neutralino.storage.getData(filename);
        return JSON.parse(temp);
    } catch (error) {
        //showToast(error.message);
        return null;
    }
}

export { 
    showToast, togglePnl, changePnl, createTooltip, getRandomInt, getArrayIndexByName, userConfirmation, formatDate, debounce, adjustReceivedData, 
    setStorage, getStorage
};
