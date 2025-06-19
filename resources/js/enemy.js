// js/enemy.js
import * as db from './database.js';
import ProgressBar from './progressBar.js';
import { player } from './player.js';
import { 
    config, playBGM, playSFX, showDialog 
} from './config.js';
import { showDamageNumber } from './utils.js';

const gameContainer = document.getElementById('game-container');
export let enemies = [];

export class Enemy {
    constructor(data) {
        //Object.assign(this, data);
        this.id = `enemy-${Date.now()}`;
        this.templateId = data.id;
        this.name = data.name || 'Unnamed';
        this.rarity = data.rarity || 50;
        this.list = data.list || "NORMAL";
        this.xpReward = data.xpReward || 10;
        this.hp = data.hp || 20;
        this.attack = data.attack || 10;
        this.defense = data.defense || 0;
        this.ability = data.ability || 'NONE';
        this.element = data.element || 'NONE';
        this.type = data.type || 'COMMON';
        this.moveType = data.moveType || 'HORIZONTAL';
        this.moveSpeed = data.moveSpeed || 100;
        this.attackSpeed = data.attackSpeed || 3000;
        this.canEscape = data.canEscape || false;
        this.escapeChance = data.escapeChance || 30;
        this.escapeRate = data.escapeRate || 20;
        this.disablePlayerEscape = data.disablePlayerEscape || false;
        this.stealth = data.stealth || 10;
        this.criticalChance = data.criticalChance || 0;
        this.criticalMultiplier = data.criticalMultiplier || 1.5;
        this.criticalResistance = data.criticalResistance || 0;
        this.accuracy = data.accuracy || 80;
        this.evasion = data.evasion || 5;
        this.allowSwarm = data.allowSwarm || false;
        this.canAttack = data.canAttack !== undefined ? data.canAttack : true;
        this.info = data.info || 'A dangerous enemy';
        this.img = data.img || ["default.png"];
        this.loot = data.loot || [];

        this.maxHp = this.hp;
        this.effects = {};
        this._isDestroying = false;
        this.activeEffects = {};
        this.effectTimers = {};

        // Elements DOM
        this.element = document.createElement('div');
        this.element.className = 'enemy';
        this.element.dataset.enemyId = this.id;

        this.infoContainer = document.createElement('div');
        this.infoContainer.className = 'enemy-info';
        this.nameElement = document.createElement('div');
        this.nameElement.className = 'enemy-name';
        this.nameElement.textContent = this.name;
        this.typeElement = document.createElement('div');
        this.typeElement.className = 'enemy-type';
        this.typeElement.textContent = `${this.type} (Lv.${this.level || 1})`;
        this.infoContainer.appendChild(this.nameElement);
        this.infoContainer.appendChild(this.typeElement);
        this.element.appendChild(this.infoContainer);

        this.hpContainer = document.createElement('div');
        this.hpContainer.className = 'enemy-pb-container';
        const hpContainerId = `enemy-hp-${Date.now()}`;
        this.hpContainer.id = hpContainerId;
        this.element.appendChild(this.hpContainer);

        this.attackCdContainer = document.createElement('div');
        this.attackCdContainer.className = 'enemy-pb-container';
        const attackCdContainerId = `enemy-attackcd-${Date.now()}`;
        this.attackCdContainer.id = attackCdContainerId;
        this.element.appendChild(this.attackCdContainer);

        this.spriteContainer = document.createElement('div');
        this.spriteContainer.className = 'enemy-sprite-container';
        this.sprite = document.createElement('img');
        this.sprite.className = 'enemy-sprite';
        this.sprite.id = `enemy-sprite-${Date.now()}`;

        this.spriteWrapper = document.createElement('div');
        this.spriteWrapper.className = 'enemy-sprite-wrapper';
        this.spriteWrapper.appendChild(this.sprite);

        this.effectContainer = document.createElement('div');
        this.effectContainer.className = 'effect-indicator';
        this.spriteWrapper.appendChild(this.effectContainer);

        this.spriteContainer.appendChild(this.spriteWrapper);
        this.element.appendChild(this.spriteContainer);

        this.attackButton = document.createElement('button');
        this.attackButton.className = 'enemy-attack-btn';
        this.attackButton.textContent = 'ATTACK';
        this.attackButton.addEventListener('click', () => this.handleAttack());
        this.element.appendChild(this.attackButton);
        if (player && player.attackReady) this.attackButton.disabled = false;
        else this.attackButton.disabled = true;

        gameContainer.appendChild(this.element);
        if (this.img && this.img[0]) {
            document.getElementById(this.sprite.id).src = `assets/img/enemies/${this.img[0]}`;
        }

        this.hpBar = new ProgressBar({
            id: `enemy-bar-${Date.now()}`,
            containerId: hpContainerId,
            containerClass: 'enemy-pb',
            min: 0,
            max: this.maxHp,
            current: this.maxHp,
            color: 'var(--hp)',
            showText: true,
            textTemplate: () => `HP`,
            enableLowEffect: true
        });

        this.attackCooldown = 0;
        this.attackCooldownBar = new ProgressBar({
            id: `enemy-attackcd-${Date.now()}`,
            containerId: attackCdContainerId,
            containerClass: 'enemy-pb',
            min: 0,
            max: this.attackSpeed,
            current: 0,
            color: 'var(--cooldown)',
            showText: true,
            textTemplate: () => `COOLDOWN`,
            enableLowEffect: false
        });

        // MOVEMENT
        this.setupLocation();
        this.startMovement();

        if(this.canAttack) this.startAttackCooldown();
        this.handleMouseEnter = () => this.element.classList.add('highlighted');
        this.handleMouseLeave = () => this.element.classList.remove('highlighted');
        enemies.push(this);
    }

    setupLocation() {
        const rect = gameContainer.getBoundingClientRect();
        this.maxX = rect.width - this.element.offsetWidth;
        this.maxY = rect.height - this.element.offsetHeight;
        this.position = {
            x: Math.random() * this.maxX,
            y: Math.random() * this.maxY
        };
        switch(this.moveType) {
            case 'HORIZONTAL':{
                this.direction = Math.random() > 0.5 ? 1 : -1;
                break;
            }
            case 'VERTICAL':{
                this.direction = Math.random() > 0.5 ? 1 : -1;
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
            case 'MIXED':{
                this.currentMixedType = null;
                this.nextTypeChange = 0;
                this.changeMovementType();
                break;
            }
            case 'FIXED':{
                this.isDragging = false;
                this.dragOffsetX = 0;
                this.dragOffsetY = 0;
                this.element.addEventListener('mousedown', this.startDrag.bind(this));
                this.element.addEventListener('touchstart', this.startDrag.bind(this), { passive: false });
                this.element.style.cursor = 'grab';
                break;
            }
            case 'RANDOM':{
                this.nextRandomMove = Date.now() + this.moveSpeed;
                break;
            }
        }
        this.updatePosition();
    }

    changeMovementType() {
        const types = ['HORIZONTAL', 'VERTICAL'];
        this.currentMixedType = types[Math.floor(Math.random() * types.length)];
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.nextTypeChange = Date.now() + 5000 + Math.random() * 10000;
    }

    startMovement() {
        if (this.moveType === 'FIXED') return;
        let speedMultiplier = 1;
        switch(config.enemySpeed) {
            case 'SLOW': speedMultiplier = 0.5; break;
            case 'FAST': speedMultiplier = 1.5; break;
        }
        let lastTimestamp = 0;
        const move = (timestamp) => {
            if (!this.element || this._isDestroying) {
                cancelAnimationFrame(this.animationFrame);
                return;
            }
            
            if (!lastTimestamp) lastTimestamp = timestamp;
            const deltaTime = (timestamp - lastTimestamp) / 1000;
            lastTimestamp = timestamp;

            const rect = gameContainer.getBoundingClientRect();
            this.maxX = rect.width - this.element.offsetWidth;
            this.maxY = rect.height - this.element.offsetHeight;

            if (this.moveType === 'MIXED' && Date.now() > this.nextTypeChange) {
                this.changeMovementType();
            }
            const currentMoveType = this.moveType === 'MIXED' ? this.currentMixedType : this.moveType;

            switch(currentMoveType) {
                case 'HORIZONTAL':{
                    this.position.x += this.direction * (this.moveSpeed * 0.05 * speedMultiplier * deltaTime * 60);
                    if (this.position.x <= 0 || this.position.x >= this.maxX) {
                        this.direction *= -1;
                    }
                    break;
                }
                case 'VERTICAL':{
                    this.position.y += this.direction * (this.moveSpeed * 0.05 * speedMultiplier * deltaTime * 60);
                    if (this.position.y <= 0 || this.position.y >= this.maxY) {
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

    updatePosition() {
        if (!this.element) return;
        this.element.style.left = `${this.position.x}px`;
        this.element.style.bottom = `${this.position.y}px`;
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
        return db.enemies.find(e => e.id === this.templateId);
    }

    setLevel() {
        const levelVariation = Math.floor(Math.random() * 3) - 1; // -1, 0 ou +1
        const enemyLevel = Math.max(1, player.level + levelVariation);
        this.level = enemyLevel;
        this.typeElement.textContent = `${this.type} (Lv.${this.level || 1})`;
        const template = this.getTemplate();
        this.maxHp = Math.floor(template.hp * (1 + (this.level - 1) * 0.2));
        this.hp = this.maxHp;
        this.hpBar.setMax(this.maxHp);
        this.hpBar.setCurrent(this.hp);
        this.attack = Math.floor(template.attack * (1 + (this.level - 1) * 0.15));
        this.xpReward = Math.floor(template.xpReward * (1 + (this.level - 1) * 0.3));
    }
    
    onPlayerAttemptEscape() {
        if (this.disablePlayerEscape) {
            return false;
        }
        const baseEscapeChance = 30;
        const dexBonus = player.dexterity * 2;
        const stealthPenalty = this.stealth;
        const escapeChance = Math.min(90, Math.max(10, baseEscapeChance + dexBonus - stealthPenalty));
        const roll = Math.random() * 100;
        return roll <= escapeChance;
    }

    handleAttack() {
        if (!player || !player.attackReady) return;

        const dodgeChance = Math.random() * 100;
        if (dodgeChance < this.evasion) {
            showDialog(`${this.name} dodged your attack!`, { doLog: false });
            player.startAttackCooldown();
            this.element.classList.add('dodge-effect');
            setTimeout(() => {
                this.element.classList.remove('dodge-effect');
            }, 300);
            return;
        }

        let damage = Math.max(1, player.attack - this.defense || 0);
        let isCritical = false;
        const critChance = Math.max(0, (player.criticalChance || 0) - this.criticalResistance || 0);
        const rollCrit = Math.random() * 100;
        if (rollCrit < critChance) {
            isCritical = true;
            damage = Math.floor(damage * (player.criticalMultiplier || 1.5));
        }

        const rect = this.hpContainer.getBoundingClientRect();
        showDamageNumber(damage, rect.left + rect.width/2, rect.top);

        const isDead = this.takeDamage(damage, isCritical);
        if (isCritical) {
            showDialog(`[b]CRITICAL HIT![/b] You hit ${this.name} for ${damage} damage!`, { doLog: false });
        } else {
            showDialog(`You hit ${this.name} for ${damage} damage!`, { doLog: false });
        }

        player.startAttackCooldown();
        if (isDead) this.onDeath();
    }

    onDeath() {
        player.addXp(this.xpReward);
        player.addKill(this.templateId);
        showDialog(`${this.name} was defeated! +${this.xpReward} XP`);
        this.dropLoot();
        this.destroy();
    }

    takeDamage(damage, isCritical = false) {
        this.hp = Math.max(0, this.hp - damage);
        this.hpBar.setCurrent(this.hp);
        if (this.element) {
            const effectClass = isCritical ? 'crit-effect' : 'hit-effect';
            this.element.classList.add(effectClass);
            setTimeout(() => {
                if (!this.element) return;
                this.element.classList.remove(effectClass);
            }, isCritical ? 500 : 300);
        }
        return this.hp <= 0;
    }

    attemptEscape() {
        if (!this.canEscape || !this.isAlive()) return false;
        const escapeRoll = Math.random() * 100;
        if (escapeRoll <= this.escapeChance) {
            this.destroy(true);
            showDialog(`${this.name} escaped from battle!`);
            return true;
        }
        return false;
    }

    startAttackCooldown() {
        this.attackCooldown = 0;
        this.attackCooldownBar.setCurrent(this.attackCooldown);
        const updateCooldown = () => {
            if (!this.isAlive()) return;
            this.attackCooldown += 1000;
            this.attackCooldownBar.setCurrent(this.attackCooldown);
            
            if (this.canEscape && this.hp < this.maxHp * 0.7) {
                const missingHealthRatio = 1 - (this.hp / this.maxHp);
                const escapeProbability = this.escapeRate * (0.3 + missingHealthRatio * 0.7);
                if (Math.random() * 100 < escapeProbability) {
                    if (this.attemptEscape()) return;
                }
            }

            if (this.attackCooldown > this.attackSpeed) {
                this.attackCooldown = 0;
                if (this.canAttack) {
                    this.attackPlayer();
                }
            } else {
                if (!this.isAlive()) return;
                setTimeout(updateCooldown, 1000);
            }
        };
        setTimeout(updateCooldown, 1000);
    }

    attackPlayer() {
        if (!this.isAlive()) return;
        const hitChance = Math.random() * 100;
        if (hitChance > player.evasion) {
            let damage = Math.max(1, this.attack - player.defense || 0);
            let isCritical = false;
            const critChance = Math.max(0, (this.criticalChance || 0) - player.criticalResistance || 0);
            const rollCrit = Math.random() * 100;
            if (rollCrit < critChance) {
                isCritical = true;
                damage = Math.floor(damage * (this.criticalMultiplier || 1.5));
            }

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

            if (isCritical) {
                showDialog(`[b]CRITICAL HIT![/b] ${this.name} hits you for ${damage} damage!`, { doLog: false });
            } else {
                showDialog(`${this.name} hits you for ${damage} damage!`, { doLog: false });
            }
            player.takeDamage(damage, this);
        } else {
            showDialog(`${this.name} attacks but misses!`, { doLog: false });
        }
        this.startAttackCooldown();
    }

    dropLoot() {
        if (!this.loot || this.loot.length === 0) return;
        const obtainedItems = [];
        this.loot.forEach(lootItem => {
            if (Math.random() * 100 <= lootItem.chance) {
                player.addItem(lootItem.id, lootItem.quantity || 1);
                obtainedItems.push({
                    id: lootItem.id,
                    quantity: lootItem.quantity || 1,
                    name: db.items.find(item => item.id === lootItem.id)?.name || lootItem.id
                });
            }
        });
        if (obtainedItems.length > 0) {
            const lootMessage = obtainedItems.map(item => 
                `${item.quantity}x ${item.name}`
            ).join('<br>');
            showDialog(`Obtained:<br>${lootMessage}`);
        }
    }

    addEffect(effectId, source = null) {
        const effectTemplate = db.effects.find(e => e.id === effectId);
        if (!effectTemplate) return false;
        if (!effectTemplate.stackable && this.activeEffects[effectId]) {
            this.removeEffect(effectId);
        }
        const effect = {
            ...effectTemplate,
            appliedAt: Date.now(),
            remainingUses: effectTemplate.uses || null,
            source: source
        };
        this.activeEffects[effectId] = effect;
        if (effectTemplate.hasDuration) {
            this.startEffectTimer(effectId);
        }
        this.updateEffectUI();
        return true;
    }

    removeEffect(effectId) {
        if (!this.activeEffects[effectId]) return false;
        if (this.effectTimers[effectId]) {
            clearInterval(this.effectTimers[effectId]);
            delete this.effectTimers[effectId];
        }
        delete this.activeEffects[effectId];
        this.updateEffectUI();
        return true;
    }

    startEffectTimer(effectId) {
        const effect = this.activeEffects[effectId];
        if (!effect || !effect.hasDuration) return;
        setTimeout(() => {
            this.removeEffect(effectId);
        }, effect.duration);
        this.effectTimers[effectId] = setInterval(() => {
            this.processEffectTick(effectId);
            this.updateEffectUI();
        }, 1000);
    }

    processEffectTick(effectId) {
        if (!this.isAlive()) {
            this.removeEffect(effectId);
            return;
        }
        const effect = this.activeEffects[effectId];
        if (!effect) return;
        switch(effect.usage) {
            case "DAMAGE_OVER_TIME":{
                const isDead = this.takeDamage(effect.value);
                if (isDead) this.onDeath();
                break;
            }
        }
    }

    hasEffect(effectId) {
        return !!this.activeEffects[effectId];
    }

    updateEffectUI() {
        this.effectContainer.innerHTML = '';
        Object.entries(this.activeEffects).forEach(([effectId, effect]) => {
            const effectTemplate = db.effects.find(e => e.id === effectId);
            if (!effectTemplate) return;
            const effectElement = document.createElement('div');
            effectElement.className = `enemy-effect ${effectTemplate.hasDuration ? 'continuous' : 'static'} ${effectTemplate.isDebuff ? 'debuff' : 'buff'}`;
            effectElement.title = `${effect.name}\n${effect.description}`;
            const effectIcon = document.createElement('div');
            effectIcon.className = `${effect.icon}`;
            effectElement.appendChild(effectIcon);
            if (effect.hasDuration || effect.remainingUses !== null) {
                const effectInfo = document.createElement('div');
                effectInfo.className = 'enemy-effect-info';
                if (effect.hasDuration) {
                    effectInfo.textContent = Math.ceil((effect.duration - (Date.now() - effect.appliedAt))/1000);
                } else if (effect.remainingUses !== null) {
                    effectInfo.textContent = effect.remainingUses;
                }
                effectElement.appendChild(effectInfo);
            }
            this.effectContainer.appendChild(effectElement);
        });
    }

    destroy(isEscaping = false) {
        if (this._isDestroying) return;
        this._isDestroying = true;
        cancelAnimationFrame(this.animationFrame);
        if (this.moveType === 'FIXED') {
            this.element.removeEventListener('mousedown', this.startDrag);
            this.element.removeEventListener('touchstart', this.startDrag);
        }
        if (this.element) {
            if (isEscaping) {
                this.element.classList.add('enemy-escaping');
            } else {
                this.element.classList.add('enemy-dying');
            }
            setTimeout(() => {
                this.element?.parentNode?.removeChild(this.element);
                const index = enemies.indexOf(this);
                if (index !== -1) {
                    enemies.splice(index, 1);
                }
                this.element = null;
                if (enemies.length === 0) {
                    document.getElementById('btn-advance').textContent = 'ADVANCE';
                }
            }, isEscaping ? 800 : 500);
        }
    }

    isAlive() {
        return this.hp > 0 && this.element !== null && !this._isDestroying;
    }
}

export function clearAllEnemies() {
    enemies.forEach(enemy => enemy.destroy());
    enemies = [];
}

export function callEnemy(id){
    document.getElementById('btn-advance').textContent = 'FLEE';
    const selected = db.enemies.find(e => e.id === id);
    if (!selected) {
        logError(new Error(`Enemy ${id} not found`));
        return null;
    }
    const enemyInstance = new Enemy(selected);
    enemyInstance.setLevel();
    if (Math.random() < 0.2) {
        enemyInstance.nameElement.textContent = `[STRONG] ${enemyInstance.name}`;
        enemyInstance.maxHp += 10;
        enemyInstance.hp += 10;
        enemyInstance.hpBar.setMax(enemyInstance.maxHp);
        enemyInstance.hpBar.setCurrent(enemyInstance.hp);
        enemyInstance.attack += 2;
        enemyInstance.xpReward = Math.floor(enemyInstance.xpReward * 1.5);
    }
    return enemyInstance;
}
