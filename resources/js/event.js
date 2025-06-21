// js/event.js
import * as db from './database.js';
import { getWeightedRandom, logError, showDamageNumber } from './utils.js';
import { Enemy, enemies, clearAllEnemies, callEnemy } from './enemy.js';
import { config, playSFX, showDialog } from './config.js';
import { player } from './player.js';

const gameContainer = document.getElementById('game-container');
export let events = [];

export class Event {
    constructor(data) {
        this.id = `event-${Date.now()}`;
        this.templateId = data.id;
        this.name = data.name || 'Event';
        this.img = `assets/img/events/${data.img || 'default.png'}`;
        this.actionName = data.actionName || 'ACTION';
        this.subEvents = data.subEvents || null;
        this.moveType = data.moveType || 'FIXED';
        this.moveSpeed = data.moveSpeed || 0;
        this.attack = data.attack || 0;
        this.startPosition = data.startPosition || null;
        this.disableAdvance = data.disableAdvance || false;
        this.loot = data.loot || [];
        
        events.push(this);
        if (this.disableAdvance) document.getElementById('btn-advance').disabled = true;
        this.element = document.createElement('div');
        this.element.className = 'event-container';
        if (this.templateId === 'chest') this.element.style.height = '30vh';
        this.createUI();
        this.setupLocation();
        this.startMovement();
    }

    createUI() {
        const actionBtnId = `event-btn-${Date.now()}`;
        this.element.innerHTML = `
            <p class="event-name">${this.name}</p>
            <div class="event-img-container">
                <img src="${this.img}" class="event-img">
            </div>
            <button class="event-btn" id="${actionBtnId}">${this.actionName}</button>
        `;
        document.getElementById('game-container').appendChild(this.element);
        this.actionBtn = document.getElementById(actionBtnId);
        this.actionBtn.addEventListener('click', () => this.handleAction());
    }

    setupLocation() {
        const rect = gameContainer.getBoundingClientRect();
        this.maxX = rect.width - this.element.offsetWidth;
        this.maxY = rect.height - this.element.offsetHeight;
        const margin = 10;

        if (this.startPosition === null){
            this.position = {
                x: Math.random() * this.maxX,
                y: Math.random() * this.maxY
            };
            this.direction = Math.random() > 0.5 ? 1 : -1;
        }

        switch(this.moveType) {
            case 'HORIZONTAL': {
                const validStartPos = ['LEFT', 'RIGHT'];
                const startPos = validStartPos.includes(this.startPosition) 
                    ? this.startPosition 
                    : validStartPos[Math.floor(Math.random() * validStartPos.length)];
                
                this.position = {
                    x: startPos === 'LEFT' ? margin : this.maxX - margin,
                    y: Math.random() * this.maxY
                };
                this.direction = startPos === 'LEFT' ? 1 : -1;
                break;
            }
            case 'VERTICAL': {
                const validStartPos = ['TOP', 'BOTTOM'];
                const startPos = validStartPos.includes(this.startPosition) 
                    ? this.startPosition 
                    : validStartPos[Math.floor(Math.random() * validStartPos.length)];
                
                this.position = {
                    x: Math.random() * this.maxX,
                    y: startPos === 'TOP' ? this.maxY - margin : margin
                };
                this.direction = startPos === 'TOP' ? -1 : 1;
                break;
            }
            case 'CIRCULAR':{
                this.originX = rect.width / 2;
                this.originY = rect.height / 2;

                const maxPossibleRadiusX = (rect.width / 2) - (this.element.offsetWidth / 2);
                const maxPossibleRadiusY = (rect.height / 2) - (this.element.offsetHeight / 2);
                const maxSafeRadius = Math.min(maxPossibleRadiusX, maxPossibleRadiusY);
                this.radius = maxSafeRadius * (0.2 + Math.random() * 0.6);

                this.angle = Math.random() * Math.PI * 2;
                this.position = {
                    x: this.originX + Math.cos(this.angle) * this.radius,
                    y: this.originY + Math.sin(this.angle) * this.radius
                };
                break;
            }
            case 'FIXED':{
                this.isDragging = false;
                this.dragOffsetX = 0;
                this.dragOffsetY = 0;
                this.element.addEventListener('mousedown', this.startDrag.bind(this));
                this.element.addEventListener('touchstart', this.startDrag.bind(this), { passive: false });
                this.element.style.cursor = 'grab';
                const validFixedPositions = ['MIDDLE', 'TOPLEFT', 'TOPRIGHT', 'BOTTOMLEFT', 'BOTTOMRIGHT', 'MIDDLELEFT', 'MIDDLERIGHT', 'MIDDLETOP', 'MIDDLEBOTTOM'];
                const startPos = validFixedPositions.includes(this.startPosition) ? this.startPosition : 'MIDDLE';
                
                switch(startPos) {
                    case 'MIDDLE':{
                        this.position = {
                            x: rect.width / 2 - this.element.offsetWidth / 2,
                            y: rect.height / 2 - this.element.offsetHeight / 2
                        };
                        break;
                    }
                    case 'TOPLEFT':{
                        this.position = {
                            x: margin,
                            y: this.maxY - margin
                        };
                        break;
                    }
                    case 'TOPRIGHT':{
                        this.position = {
                            x: this.maxX - margin,
                            y: this.maxY - margin
                        };
                        break;
                    }
                    case 'BOTTOMLEFT':{
                        this.position = {
                            x: margin,
                            y: margin
                        };
                        break;
                    }
                    case 'BOTTOMRIGHT':{
                        this.position = {
                            x: this.maxX - margin,
                            y: margin
                        };
                        break;
                    }
                    case 'MIDDLELEFT':{
                        this.position = {
                            x: margin,
                            y: rect.height / 2 - this.element.offsetHeight / 2
                        };
                        break;
                    }
                    case 'MIDDLERIGHT':{
                        this.position = {
                            x: this.maxX - margin,
                            y: rect.height / 2 - this.element.offsetHeight / 2
                        };
                        break;
                    }
                    case 'MIDDLETOP':{
                        this.position = {
                            x: rect.width / 2 - this.element.offsetWidth / 2,
                            y: this.maxY - margin
                        };
                        break;
                    }
                    case 'MIDDLEBOTTOM':{
                        this.position = {
                            x: rect.width / 2 - this.element.offsetWidth / 2,
                            y: margin
                        };
                        break;
                    }
                }
                break;
            }
            case 'RANDOM':{
                this.nextRandomMove = Date.now() + this.moveSpeed;
                break;
            }
        }
        this.updatePosition();
    }

    updatePosition() {
        if (!this.element) return;
        this.element.style.left = `${this.position.x}px`;
        this.element.style.bottom = `${this.position.y}px`;
    }

    startMovement() {
        if (this.moveType === 'FIXED') return;
        let speedMultiplier = 1;
        switch(config.enemySpeed) {
            case 'SLOW': speedMultiplier = 0.5; break;
            case 'FAST': speedMultiplier = 1.5; break;
            case 'ULTRA_FAST': speedMultiplier = 2.5; break;
        }
        if (this.templateId === 'trap') {
            const variation = 0.8 + Math.random() * 0.4;
            speedMultiplier *= variation;
        }
        let lastTimestamp = 0;
        const move = (timestamp) => {
            if (!this.element) {
                cancelAnimationFrame(this.animationFrame);
                return;
            }

            if (!lastTimestamp) lastTimestamp = timestamp;
            const deltaTime = (timestamp - lastTimestamp) / 1000;
            lastTimestamp = timestamp;

            const rect = gameContainer.getBoundingClientRect();
            this.maxX = rect.width - this.element.offsetWidth;
            this.maxY = rect.height - this.element.offsetHeight;

            switch(this.moveType) {
                case 'HORIZONTAL':{
                    this.position.x += this.direction * (this.moveSpeed * 0.05 * speedMultiplier * deltaTime * 60);
                    if (this.position.x <= 0 || this.position.x >= this.maxX) {
                        this.onBorderAction();
                        this.direction *= -1;
                    }
                    break;
                }
                case 'VERTICAL':{
                    this.position.y += this.direction * (this.moveSpeed * 0.05 * speedMultiplier * deltaTime * 60);
                    if (this.position.y <= 0 || this.position.y >= this.maxY) {
                        this.onBorderAction();
                        this.direction *= -1;
                    }
                    break;
                }
                case 'CIRCULAR':{
                    this.angle += (this.moveSpeed * 0.0005 * speedMultiplier * deltaTime * 60);
                    this.position.x = this.originX + Math.cos(this.angle) * this.radius;
                    this.position.y = this.originY + Math.sin(this.angle) * this.radius;
                    break;
                }
                case 'RANDOM':{
                    if (Date.now() > this.nextRandomMove) {
                        this.position = {
                            x: Math.random() * this.maxX,
                            y: Math.random() * this.maxY
                        };
                        this.nextRandomMove = Date.now() + (this.moveSpeed);
                    }
                    break;
                }
            }
            this.updatePosition();
            this.animationFrame = requestAnimationFrame(move);
        };
        this.animationFrame = requestAnimationFrame(move);
    }
    
    startDrag(e) {
        e.preventDefault();
        this.isDragging = true;
        const rect = this.element.getBoundingClientRect();
        if (e.type === 'mousedown') {
            this.dragOffsetX = e.clientX - rect.left;
            this.dragOffsetY = e.clientY - rect.top;
        } else if (e.touches) {
            this.dragOffsetX = e.touches[0].clientX - rect.left;
            this.dragOffsetY = e.touches[0].clientY - rect.top;
        }
        this.element.style.cursor = 'grabbing';
        document.addEventListener('mousemove', this.onDrag);
        document.addEventListener('touchmove', this.onDrag, { passive: false });
        document.addEventListener('mouseup', this.endDrag);
        document.addEventListener('touchend', this.endDrag);
    }

    onDrag = (e) => {
        if (!this.isDragging) return;
        e.preventDefault();
        const gameRect = gameContainer.getBoundingClientRect();
        let clientX, clientY;
        if (e.type === 'mousemove') {
            clientX = e.clientX;
            clientY = e.clientY;
        } else if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        const newX = clientX - gameRect.left - this.dragOffsetX;
        const newY = gameRect.bottom - clientY - this.element.offsetHeight + this.dragOffsetY;
        this.position.x = Math.max(0, Math.min(newX, gameRect.width - this.element.offsetWidth));
        this.position.y = Math.max(0, Math.min(newY, gameRect.height - this.element.offsetHeight));
        this.updatePosition();
    }

    endDrag = () => {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.element.style.cursor = 'grab';
        document.removeEventListener('mousemove', this.onDrag);
        document.removeEventListener('touchmove', this.onDrag);
        document.removeEventListener('mouseup', this.endDrag);
        document.removeEventListener('touchend', this.endDrag);
    }

    getTemplate() {
        return db.events.find(e => e.id === this.templateId);
    }
    
    dropLoot() {
        if (!this.loot || this.loot.length === 0) return;
        const itemMap = {};
        this.loot.forEach(lootItem => {
            if (Math.random() * 100 <= lootItem.chance) {
                const itemId = lootItem.id;
                const quantity = lootItem.quantity || 1;
                if (itemMap[itemId]) {
                    itemMap[itemId].quantity += quantity;
                } else {
                    itemMap[itemId] = { 
                        id: itemId,
                        quantity: quantity,
                        name: db.items.find(item => item.id === itemId)?.name || itemId
                    };
                }
            }
        });
        const obtainedItems = Object.values(itemMap);
        obtainedItems.forEach(item => {
            player.addItem(item.id, item.quantity);
        });
        if (obtainedItems.length > 0) {
            const lootMessage = obtainedItems.map(item => 
                `${item.quantity}x ${item.name}`
            ).join('<br>');
            showDialog(`You obtained:<br>${lootMessage}`);
        } else {
            showDialog('You found nothing!');
        }
    }

    handleAction() {
        this.destroy();
        switch(this.templateId) {
            case 'chest': {
                const subEvent = getWeightedRandom(this.subEvents);
                if (subEvent.id === 'mimic') {
                    showDialog('The chest was a mimic!');
                    const mimic = callEnemy('enemy-chest_mimic');
                    mimic.position = {
                        x: this.position.x,
                        y: this.position.y
                    };
                    mimic.updatePosition();
                    mimic.loot = this.loot;
                } else {
                    this.dropLoot();
                }
                break;
            }
            case 'trap': {
                showDialog(`You successfully avoided a trap!`);
                break;
            }
        }
    }

    onBorderAction() {
        this.destroy();
        switch(this.templateId) {
            case 'trap': {
                showDialog(`You were caught in a trap!`);
                this.attackPlayer();
                break;
            }
        }
    }

    attackPlayer() {
        //this.attack = Math.floor(this.attack * (1 + (player.level - 1) * 0.15));
        let damage = Math.max(1, this.attack - player.defense || 0);
        gameContainer.classList.add('player-hit-shake');
        const hpContainer = document.getElementById('player-hp-container');
        const hitEffect = document.getElementById('player-hit-effect');
        hitEffect.classList.add('hit-show');
        const rect = hpContainer.getBoundingClientRect();
        showDamageNumber(damage, rect.left + rect.width/2, rect.top);
        setTimeout(() => {
            gameContainer.classList.remove('player-hit-shake');
            hitEffect.classList.remove('hit-show');
        }, 500);
        player.takeDamage(this.attack, this);
        //playSFX('hitPlayer.wav');
    }

    destroy() {
        cancelAnimationFrame(this.animationFrame);
        if (this.moveType === 'FIXED') {
            this.element.removeEventListener('mousedown', this.startDrag);
            this.element.removeEventListener('touchstart', this.startDrag);
        }
        this.element?.parentNode?.removeChild(this.element);
        const index = events.indexOf(this);
        if (index !== -1) {
            events.splice(index, 1);
        }
        this.element = null;
        if (!events.some(e => e.templateId === 'trap')) {
            document.getElementById('btn-advance').disabled = false;
        }
    }
}

export function clearAllEvents() {
    events.forEach(event => event.destroy());
    events = [];
}

export function callEvent(id){
    const selected = db.events.find(e => e.id === id);
    if (!selected) {
        logError(new Error(`Event ${id} not found`));
        return null;
    }
    const instance = new Event(selected);
    return instance;
}