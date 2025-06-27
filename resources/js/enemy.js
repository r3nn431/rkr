// js/enemy.js
import * as db from './database.js';
import ProgressBar from './progressBar.js';
import { player } from './player.js';
import { 
    config, playSFX, showDialog 
} from './config.js';
import { attachTooltips, showDamageNumber } from './utils.js';

const gameContainer = document.getElementById('game-container');
export let enemies = [];

export class Enemy {
    constructor(data) {
        this.id = `enemy-${Date.now()}`;
        this.templateId = data.id;
        this.name = data.name || 'Unnamed';
        this.rarity = data.rarity || 50;
        this.list = data.list || "NORMAL";
        this.ability = data.ability || {};
        this.type = data.type || 'UNKNOWN';
        this.moveType = data.moveType || 'HORIZONTAL';
        this.canEscape = data.canEscape || false;
        this.escapeChance = data.escapeChance || 30;
        this.escapeRate = data.escapeRate || 20;
        this.disablePlayerEscape = data.disablePlayerEscape || false;
        this.allowSwarm = data.allowSwarm || false;
        this.canAttack = data.canAttack !== undefined ? data.canAttack : true;
        this.info = data.info || 'A dangerous enemy';
        this.img = data.img || ["default.png"];
        this.loot = data.loot || [];

        this.level = this.setLevel();
        this.xpReward = data.xpReward || 10;
        this.hp = data.hp || 20;
        this.maxHp = this.hp;

        this.defense = {
            value: data.defense || 0,
            maxValue: 90,
            tempValue: 0
        }
        this.attack = {
            value: data.attack || 10,
            maxValue: 200,
            tempValue: 0
        }
        this.evasion = {
            value: data.evasion || 5,
            maxValue: 90,
            tempValue: 0
        }
        this.stealth = {
            value: data.stealth || 10,
            maxValue: 100,
            tempValue: 0
        }
        this.accuracy = {
            value: data.accuracy || 90,
            maxValue: 100,
            tempValue: 0
        }
        
        this.moveSpeed = data.moveSpeed || 100;
        this.attackSpeed = data.attackSpeed || 3000;
        this.criticalChance = data.criticalChance || 0;
        this.criticalMultiplier = data.criticalMultiplier || 1.5;
        this.criticalResistance = data.criticalResistance || 0;
        this.adjustEnemyByLevel();

        this.isDestroying = false;
        this.activeEffects = {};

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

        this.setupLocation();
        this.startMovement();
        if(this.canAttack) this.startAttackCooldown();
        this.handleMouseEnter = () => this.element.classList.add('highlighted');
        this.handleMouseLeave = () => this.element.classList.remove('highlighted');
        enemies.push(this);
    }

    //@title MOVEMENT
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
            case 'ULTRA_FAST': speedMultiplier = 2.5; break;
        }
        let lastTimestamp = 0;
        const move = (timestamp) => {
            if (!this.element || this.isDestroying) {
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

    //@title UTILS
    getTemplate() {
        return db.enemies.find(e => e.id === this.templateId);
    }

    setLevel(){
        const levelVariation = Math.floor(Math.random() * 3) - 1;
        return Math.max(1, player.level + levelVariation);
    }

    adjustEnemyByLevel(){
        const template = this.getTemplate();
        this.maxHp = Math.floor(template.hp * (1 + (this.level - 1) * 0.2));
        this.hp = this.maxHp;
        this.xpReward = Math.floor(template.xpReward * (1 + (this.level - 1) * 0.3));
        this.attack.value = Math.floor(template.attack * (1 + (this.level - 1) * 0.15));
    }

    getAttributeValue(attribute) {
        if (!this[attribute]) {
            logError(new Error(`Enemy attribute "${attribute}" does not exist`));
            return 0;
        }
        if (this[attribute].value > this[attribute].maxValue) {
            this[attribute].value = this[attribute].maxValue;
        }
        return Math.min(Math.floor(this[attribute].value + this[attribute].tempValue), this[attribute].maxValue + this[attribute].tempValue);
    }
    
    onPlayerAttemptEscape() {
        if (this.disablePlayerEscape) {
            return false;
        }
        const escapeChance = Math.min(90, Math.max(10, 30 + player.getAttributeValue('stealth') - this.getAttributeValue('stealth')));
        const roll = Math.random() * 100;
        return roll <= escapeChance;
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

    //@title PLAYER ATTACK
    handleAttack() {
        if (!player || !player.attackReady) return;

        const hitChance = Math.max(5, Math.min(95, this.getAttributeValue('evasion') - player.getAttributeValue('accuracy')));
        const hitRoll = Math.random() * 100;
        if (hitRoll < hitChance) {
            showDialog(`${this.name} dodged your attack!`, { doLog: false });
            player.startAttackCooldown();
            this.element.classList.add('dodge-effect');
            setTimeout(() => {
                if (!this.element) return;
                this.element.classList.remove('dodge-effect');
            }, 300);
            return;
        }

        let damage = player.getAttributeValue('attack');
        const damageReduction = Math.floor(damage * this.getAttributeValue('defense') / 100);
        damage = Math.max(1, damage - damageReduction);

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

    //@title REMOVE ENEMY
    onDeath() {
        player.addXp(this.xpReward);
        player.addKill(this.templateId);
        showDialog(`${this.name} was defeated! +${this.xpReward} XP`);
        this.dropLoot();
        this.destroy();
    }

    dropLoot() {
        if (!this.loot || this.loot.length === 0) return;
        const itemMap = {};
        const luckBonus = player.getAttributeValue('luck');
        this.loot.forEach(lootItem => {
            const effectiveChance = Math.min(lootItem.chance + Math.min(luckBonus, 30), 95);
            if (Math.random() * 100 <= effectiveChance) {
                const itemId = lootItem.id;
                const baseQuantity = lootItem.quantity || 1;
                let extraQuantity = 0;
                if (Math.random() * 100 < (luckBonus * 0.5)) {
                    extraQuantity = 1;
                }
                const quantity = baseQuantity + extraQuantity;
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
        }
    }

    destroy(isEscaping = false) {
        if (this.isDestroying) return;
        this.isDestroying = true;
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
            setTimeout( () => {
                this.element?.parentNode?.removeChild(this.element);
                const index = enemies.indexOf(this);
                if (index !== -1) {
                    enemies.splice(index, 1);
                }
                this.element = null;
                if (enemies.length === 0) {
                    document.getElementById('btn-advance').textContent = 'ADVANCE';
                    if(player) player.cancelTargetSelection();
                }
            }, isEscaping ? 800 : 500);
        }
    }

    isAlive() {
        return this.hp > 0 && this.element !== null && !this.isDestroying;
    }

    //@title ATTACK PLAYER
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
        const hitChance = Math.max(5, Math.min(95, this.getAttributeValue('accuracy') - player.getAttributeValue('evasion')));
        const hitRoll = Math.random() * 100;
        if (hitRoll < hitChance) {
            let damage = this.getAttributeValue('attack');
            const damageReduction = Math.floor(damage * player.getAttributeValue('defense') / 100);
            damage = Math.max(1, damage - damageReduction);

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

    //@title EFFECTS
    canReceiveEffect(effectId) {
        if (this.hasEffect(effectId)) return false;
        return true;
    }

    addEffect(effectId, source = null) {
        const effectTemplate = db.effects.find(e => e.id === effectId);
        if (!effectTemplate) {
            logError(new Error(`Effect ${effectId} not found`));
            return false;
        }
        this.removeEffect(effectId);
        const effect = {
            ...effectTemplate,
            appliedAt: Date.now(),
            remainingUses: effectTemplate.uses || null,
            source: source,
            timer: null,
            interval: null
        };
        this.activeEffects[effectId] = effect;
        if (effectTemplate.hasDuration) {
            this.startEffectTimer(effectId);
        }
        this.updateEffectsUI();
        return true;
    }

    removeEffect(effectId) {
        if (!this.activeEffects[effectId]) return false;
        const effect = this.activeEffects[effectId];
        if (effect.timer) {
            clearTimeout(effect.timer);
        }
        if (effect.interval) {
            clearInterval(effect.interval);
        }
        delete this.activeEffects[effectId];
        this.updateEffectsUI();
        return true;
    }

    startEffectTimer(effectId) {
        const effect = this.activeEffects[effectId];
        if (!effect || !effect.hasDuration) return;
        if (effect.timer) {
            clearTimeout(effect.timer);
        }
        effect.timer = setTimeout(() => {
            this.removeEffect(effectId);
        }, effect.duration);
        if (effect.interval) {
            clearInterval(effect.interval);
        }
        effect.interval = setInterval(() => {
            if (!this.isAlive() || !this.activeEffects[effectId]) return;
            this.processEffectTick(effectId);
            this.updateEffectsUI();
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

    updateEffectsUI() {
        if (!this.element) return;
        this.effectContainer.innerHTML = '';
        Object.entries(this.activeEffects).forEach(([effectId, effect]) => {
            const effectTemplate = db.effects.find(e => e.id === effectId);
            if (!effectTemplate) return;
            const effectElement = document.createElement('div');
            effectElement.className = `enemy-effect ${effectTemplate.hasDuration ? 'continuous' : 'static'} ${effectTemplate.isDebuff ? 'debuff' : 'buff'} tooltip`;
            const effectIcon = document.createElement('div');
            effectIcon.className = `${effect.icon}`;
            effectElement.appendChild(effectIcon);
            let duration = ''; 
            if (effect.hasDuration || effect.remainingUses !== null) {
                const effectInfo = document.createElement('div');
                effectInfo.className = 'enemy-effect-info';
                if (effect.hasDuration) {
                    duration = `${Math.ceil((effect.duration - (Date.now() - effect.appliedAt))/1000)}s`;
                    effectInfo.textContent = duration;
                } else if (effect.remainingUses !== null) {
                    duration = `x${effect.remainingUses}`;
                    effectInfo.textContent = effect.remainingUses;
                }
                effectElement.appendChild(effectInfo);
            }
            effectElement.dataset.tooltip = `${effect.name} (${duration}):\n${effect.description}`;
            this.effectContainer.appendChild(effectElement);
        });
        attachTooltips();
    }
}

//@title OUTSIDE CLASS FUNCTIONS
export function clearAllEnemies() {
    enemies.forEach(enemy => enemy.destroy());
    enemies = [];
}

function setEnemyVariation(instance){
    const prefixes = {
        'ANOMALY': 'Aberrant',
        'MUTANT': 'Evolved', 
        'UNDEAD': 'Ancient',
        'PLAGUED': ''
    };
    const enemyType = instance.type.toUpperCase();
    const prefix = prefixes[enemyType] || 'Strong';
    instance.name = `${prefix} ${instance.name}`;
    instance.nameElement.textContent = `${instance.name}`;
    instance.maxHp += 10;
    instance.hp += 10;
    instance.hpBar.setMax(instance.maxHp);
    instance.hpBar.setCurrent(instance.hp);
    instance.xpReward = Math.floor(instance.xpReward * 1.5);
    instance.attack.value += 2;
    // add an ability for strong enemies
}

export function callEnemy(id){
    document.getElementById('btn-advance').textContent = 'FLEE';
    const selected = db.enemies.find(e => e.id === id);
    if (!selected) {
        logError(new Error(`Enemy ${id} not found`));
        return null;
    }
    const enemyInstance = new Enemy(selected);
    if (Math.random() < 0.2) {
        setEnemyVariation(enemyInstance);
    }
    if(enemies.length === 1) {
        player.resetBattle();
    }
    return enemyInstance;
}
