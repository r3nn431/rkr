// js/player.js
import * as db from './database.js';
import ProgressBar from './progressBar.js';
import { playSFX, showDialog } from './config.js';
import { formatDate, logError } from './utils.js';
import { enemies, clearAllEnemies } from './enemy.js';
import { clearAllEvents } from './event.js';

export class Player {
    constructor() {
        this.title = 'Newborn';
        // ATTRIBUTES
        this.constituition = 1;
        this.strength = 5;
        this.dexterity = 5;
        this.intelligence = 5;
        // MODIFIERS
        this.defense = 2;
        this.luck = 5;
        this.accuracy = 90;
        this.knowledge = 1;
        this.alchemy = 5;
        this.craftsmanship = 5;
        this.criticalChance = 15;
        this.criticalMultiplier = 1.5;
        this.criticalResistance = 0;
        // CALCULATED STATS
        this.evasion = 5;
        this.attack = 10;
        this.attackSpeed = 3000;
        this.maxHp = this.calculateMaxHp();
        this.hp = this.maxHp;
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = this.calculateXpToNextLevel();
        // UI
        this.hpBar = new ProgressBar({
            id: 'player-bar-hp',
            containerId: 'player-hp-container',
            min: 0,
            max: this.maxHp,
            current: this.maxHp,
            color: 'var(--hp)',
            textTemplate: (min, current, max) => `HP ${current}/${max}`,
            label: 'HP',
            enableLowEffect: true
        });
        this.xpBar = new ProgressBar({
            id: 'player-bar-xp',
            containerId: 'player-xp-container',
            containerClass: 'progress-bar-container',
            barClass: 'progress-bar',
            min: 0,
            max: this.xpToNextLevel,
            current: this.xp,
            color: 'var(--xp)',
            textTemplate: (min, current, max) => `XP ${current}/${max} (Lv.${this.level})`,
            label: 'XP',
            enableLowEffect: false
        });
        this.attackCooldown = 0;
        this.attackReady = true;
        this.attackCooldownBar = new ProgressBar({
            id: 'player-bar-attackcd',
            containerId: 'player-attackcd-container',
            min: 0,
            max: this.attackSpeed,
            current: this.attackSpeed,
            color: 'var(--cooldown)',
            textTemplate: () => this.attackReady ? 'READY' : `COOLDOWN ${Math.ceil(this.attackCooldown/1000)}s`,
            enableLowEffect: false
        });
        this.elements = {
            title: document.getElementById('player-title'),
            con: document.getElementById('player-con'),
            str: document.getElementById('player-str'),
            dex: document.getElementById('player-dex'),
            int: document.getElementById('player-int'),
            def: document.getElementById('player-def'),
            att: document.getElementById('player-att'),
            acc: document.getElementById('player-acc'),
            alc: document.getElementById('player-alc'),
            craft: document.getElementById('player-craft'),
            know: document.getElementById('player-know'),
            luck: document.getElementById('player-luck'),
            crit: document.getElementById('player-crit'),
            playtime: document.getElementById('current-playtime'),
            distance: document.getElementById('current-distance'),
            kills: document.getElementById('current-total-kills'),
            abilities: document.getElementById('abilities-container'),
            effects: document.getElementById('effects-container'),
            inventory: document.getElementById('inventory-container'),
            log: document.getElementById('log-container')
        };

        this.playtime = 0;
        this.playtimeInterval = null;
        this.startDate = new Date();
        document.getElementById('current-startdate').textContent = formatDate(this.startDate, true);
        this.distance = 0;
        this.log = [];
        this.inventory = {
            items: {}
        };
        this.kills = {};
        this.abilities = {};
        this.activeEffects = {};
        this.effectTimers = {};
        this.currentTargetingAbility = null;
        this.startPlaytime();
        this.isDead = false;
    }

    calculateMaxHp() {
        return 100 + 20 * (this.constituition - 1);
    }

    calculateXpToNextLevel() {
        return Math.floor(100 * Math.pow(1.2, this.level - 1));
    }

    takeDamage(damage, causeOfDeath) {
        this.hp = Math.max(0, this.hp - damage);
        this.hpBar.setCurrent(this.hp);
        if(this.hp <= 0) gameOver(causeOfDeath);
    }

    heal(amount) {
        this.hp += amount;
        if (this.hp > this.maxHp) this.hp = this.maxHp;
        this.hpBar.setCurrent(this.hp);
    }

    addXp(amount) {
        this.xp += amount;
        while (this.xp >= this.xpToNextLevel) {
            this.xp -= this.xpToNextLevel;
            this.levelUp();
        }
        this.xpBar.setMax(this.xpToNextLevel);
        this.xpBar.setCurrent(this.xp);
    }

    levelUp() {
        this.level++;
        this.xpToNextLevel = this.calculateXpToNextLevel();
        this.heal(this.maxHp);
        showDialog(`Level up! Now you're level ${this.level}!`);
    }

    addBonus(type, amount) {
        switch (type) {
            case 'constitution': {
                this.constituition += amount;
                this.maxHp = this.calculateMaxHp();
                this.hpBar.setMax(this.maxHp);
                break;
            }
        }
    }

    async startAttackCooldown() {
        this.attackReady = false;
        enemies.forEach(enemy => {
            if (enemy !== null) enemy.attackButton.disabled = true;
        });
        this.attackCooldown = this.attackSpeed;
        this.attackCooldownBar.setCurrent(0);
        const cooldownInterval = setInterval( async () => {
            this.attackCooldown -= 1000;
            if (this.attackCooldown <= 0) {
                if (player === null) return;
                this.attackReady = true;
                this.attackCooldownBar.setCurrent(this.attackSpeed);
                clearInterval(cooldownInterval);
                enemies.forEach(enemy => {
                    if (enemy !== null) enemy.attackButton.disabled = false;
                });
            } else {
                this.attackCooldownBar.setCurrent(this.attackSpeed - this.attackCooldown);
            }
        }, 1000);
    }

    addKill(enemyTemplateId) {
        if (!this.kills[enemyTemplateId]) {
            this.kills[enemyTemplateId] = 0;
        }
        this.kills[enemyTemplateId]++;
        this.elements.kills.textContent = this.getTotalKills();
    }

    getTotalKills() {
        return Object.values(this.kills).reduce((total, count) => total + count, 0);
    }
    
    getKillsByType(enemyType) {
        return Object.entries(this.kills).reduce((total, [templateId, count]) => {
            const enemyTemplate = db.enemies.find(e => e.id === templateId);
            if (enemyTemplate && enemyTemplate.type === enemyType) {
                return total + count;
            }
            return total;
        }, 0);
    }

    getAllKillsByType() {
        const killsByType = {};
        db.enemies.forEach(enemy => {
            if (!killsByType[enemy.type]) {
                killsByType[enemy.type] = 0;
            }
        });
        Object.entries(this.kills).forEach(([templateId, count]) => {
            const enemyTemplate = db.enemies.find(e => e.id === templateId);
            if (enemyTemplate) {
                killsByType[enemyTemplate.type] += count;
            }
        });
        return killsByType;
    }

    showDetailedKills() {
        const killsList = Object.entries(this.kills).map(([templateId, count]) => ({
                templateId,
                kills: count
            }))
            .sort((a, b) => b.kills - a.kills)
            .map(kill => 
                `<div class="kill-item">
                    ${db.enemies.find(e => e.id === kill.templateId)?.name || kill.templateId}: ${kill.kills}
                </div>`
            ).join('');
        
        this.elements.kills.innerHTML = killsList.length 
            ? killsList 
            : 'No enemies killed yet.';
    }

    updateStats() {
        this.elements.title.textContent = this.title || 'Player';
        this.elements.con.textContent = this.constituition || 0;
        this.elements.str.textContent = this.strength || 0;
        this.elements.dex.textContent = this.dexterity || 0;
        this.elements.int.textContent = this.intelligence || 0;
        this.elements.def.textContent = this.defense || 0;
        this.elements.att.textContent = this.attack || 0;
        this.elements.acc.textContent = this.accuracy || 0;
        this.elements.know.textContent = this.knowledge || 0;
        this.elements.alc.textContent = this.alchemy || 0;
        this.elements.craft.textContent = this.craftsmanship || 0;
        this.elements.luck.textContent = this.luck || 0;
        this.elements.crit.textContent = `${this.criticalChance}% of ${this.criticalMultiplier}` || 0;
        this.elements.kills.textContent = this.getTotalKills() || 0;
        this.elements.playtime.textContent = this.formatPlaytime() || '00:00:00';
        this.elements.distance.textContent = this.distance || 0;
        this.updateInventoryUI();
        this.updateAbilitiesUI();
        this.updateEffectsUI();
    }

    startPlaytime() {
        this.playtime = 0;
        this.playtimeInterval = setInterval(() => {
            this.playtime += 1000;
            this.elements.playtime.textContent = this.formatPlaytime();
        }, 1000);
    }

    formatPlaytime() {
        const time = Math.floor(this.playtime / 1000);
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = time % 60;
        return [hours, minutes, seconds]
            .map(v => String(v).padStart(2, '0'))
            .join(':');
    }

    hasAbility(id) {
        return !!this.abilities[id];
    }

    addAbility(id) {
        const template = db.abilities.find(p => p.id === id);
        if (!template) {
            logError(new Error(`Ability ${id} not found`));
            return false;
        }
        if (this.abilities[id]) {
            return false;
        }
        this.abilities[id] = {
            ...template,
            obtainedAt: Date.now(),
            remainingCooldown: 0,
            usedThisBattle: false
        };
        this.applyAbilityEffects(id);
        this.updateAbilitiesUI();
        return true;
    }
    
    applyAbilityEffects(id) {
        const ability = this.abilities[id];
        if (!ability || !ability.isPassive) return;
        const template = db.abilities.find(p => p.id === id);
        // TO-DO
    }

    startAbilityCooldown(abilityId) {
        const ability = this.abilities[abilityId];
        if (!ability || !ability.cooldown) return;
        const cooldownEnd = ability.remainingCooldown;
        const cooldownElement = document.querySelector(`.ability-item[data-ability-id="${abilityId}"] .btn-ability-use`);
        if (!cooldownElement) return;
        const updateCooldown = () => {
            const remaining = cooldownEnd - Date.now();
            if (remaining <= 0) {
                cooldownElement.textContent = 'Use';
                cooldownElement.disabled = false;
                return;
            }
            cooldownElement.textContent = `${Math.ceil(remaining / 1000)}s`;
            cooldownElement.disabled = true;
            requestAnimationFrame(updateCooldown);
        };
        updateCooldown();
    }

    canUseAbility(ability) {
        if (this.isDead) return false;
        if (ability.cooldown && ability.remainingCooldown > Date.now()) return false;
        switch (ability.usage) {
            case 'COMBAT': {
                if (enemies.length === 0) {
                    showDialog('You can only use this ability in combat.', {doLog: false});
                    return false;
                }
                break;
            }
            case 'SAFE': {
                if (enemies.length > 0) {
                    showDialog('You can only use this ability outside combat.', {doLog: false});
                    return false;
                }
                break;
            }
        }
        //if (ability.costType) {}
        return true;
    }

    usePower(abilityId) {
        const ability = this.abilities[abilityId];
        if (!ability || ability.isPassive) return false;
        if (!this.canUseAbility(ability)) return false;
        if (ability.cooldown) {
            ability.remainingCooldown = Date.now() + ability.cooldown;
            this.startAbilityCooldown(ability.id);
        }
        switch(ability.target) {
            case "SELF":{
                this.addEffect(ability.effectId, 'player');
                showDialog(`Used ${ability.name} on yourself!`);
                break;
            }
            case "ENEMY":{
                if (enemies.length === 1) {
                    enemies[0].addEffect(ability.effectId, 'player');
                    showDialog(`Used ${ability.name} on ${enemies[0].name}!`);
                } else {
                    this.startTargetSelection(abilityId);
                }
                break;
            }
            case "ALL_ENEMIES":{
                enemies.forEach(enemy => enemy.addEffect(ability.effectId, 'player'));
                showDialog(`Used ${ability.name} on all enemies!`);
                break;
            }
            default: return false;
        }
        return true;
    }

    applyAbilityToEnemy(abilityId, enemy) {
        const ability = this.abilities[abilityId];
        if (!ability || !ability.effectId) return;
        
        enemy.addEffect(ability.effectId, 'player');
        showDialog(`Used ${ability.name} on ${enemy.name}!`);
    }

    startTargetSelection(abilityId) {
        if (this.currentTargetingAbility) return;
        const ability = this.abilities[abilityId];
        if (!ability || ability.target !== "ENEMY") return;
        this.currentTargetingAbility = abilityId;
        enemies.forEach(enemy => {
            enemy.element.classList.add('selectable');
            enemy.element.addEventListener('click', this.handleEnemySelection);
        });

        const container = document.createElement('div');
        container.className = 'target-selection-container';
        container.innerHTML = `
            <p>Select a target for ${ability.name}</p>
            <button class="target-selection-cancel">Cancel</button>
        `;
        document.getElementById('main-game').appendChild(container);
        container.querySelector('.target-selection-cancel').addEventListener('click', () => {
            this.cancelTargetSelection();
        });
        enemies.forEach(enemy => {
            enemy.element.addEventListener('mouseenter', enemy.handleMouseEnter);
            enemy.element.addEventListener('mouseleave', enemy.handleMouseLeave);
        });
    }

    handleEnemySelection = (event) => {
        const enemyElement = event.currentTarget;
        const enemyId = enemyElement.dataset.enemyId;
        const enemy = enemies.find(e => e.id === enemyId);
        if (enemy && this.currentTargetingAbility) {
            this.applyAbilityToEnemy(this.currentTargetingAbility, enemy);
            this.cancelTargetSelection();
        }
    }

    cancelTargetSelection() {
        if (!this.currentTargetingAbility) return;
        enemies.forEach(enemy => {
            enemy.element.classList.remove('selectable', 'highlighted');
            enemy.element.removeEventListener('click', this.handleEnemySelection);
            enemy.element.removeEventListener('mouseenter', enemy.handleMouseEnter);
            enemy.element.removeEventListener('mouseleave', enemy.handleMouseLeave);
        });
        const selectionUI = document.querySelector('.target-selection-container');
        if (selectionUI) {
            selectionUI.remove();
        }
        this.currentTargetingAbility = null;
    }

    updateAbilitiesUI() {
        const passiveAbilities = Object.values(this.abilities).filter(a => a.isPassive);
        const activeAbilities = Object.values(this.abilities).filter(a => !a.isPassive);
        if (passiveAbilities.length === 0 && activeAbilities.length === 0) {
            this.elements.abilities.innerHTML = 'You currently have no abilities.';
            return;
        }
        let html = '';
        if (passiveAbilities.length > 0) {
            html += `
                <div class="ability-category">
                    <h4 class="category-title">Passives</h4>
                    ${passiveAbilities
                        .sort((a, b) => b.obtainedAt - a.obtainedAt)
                        .map(ability => this.createAbilityHTML(ability))
                        .join('')}
                </div>
            `;
        }
        if (activeAbilities.length > 0) {
            html += `
                <div class="ability-category">
                    <h4 class="category-title">Powers</h4>
                    ${activeAbilities
                        .sort((a, b) => b.obtainedAt - a.obtainedAt)
                        .map(ability => this.createAbilityHTML(ability))
                        .join('')}
                </div>
            `;
        }
        this.elements.abilities.innerHTML = html;
        this.elements.abilities.querySelectorAll('.btn-ability-use').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const abilityId = e.target.closest('.ability-item').dataset.abilityId;
                this.usePower(abilityId);
            });
        });
    }

    createAbilityHTML(ability) {
        const template = db.abilities.find(a => a.id === ability.id);
        if (!template) return '';
        const isCurse = template.isCurse ? ' (Curse)' : '';
        const formatValue = (val) => val !== undefined ? val : 'N/A';
        const costText = template.costValue ? `${formatValue(template.costValue)}x${template.costType || ''}` : 'None';
        const cooldownText = template.cooldown ? `${formatValue(template.cooldown) ? `${formatValue(template.cooldown)/1000}s` : ''}` : '0s';
        const metadataElements = [];
        if (!template.isPassive) {
            metadataElements.push(
                `<div class="ability-meta"><span class="meta-label">Cost:</span> ${costText}</div>`,
                `<div class="ability-meta"><span class="meta-label">Cooldown:</span> ${cooldownText}</div>`,
                `<div class="ability-meta"><span class="meta-label">Target:</span> ${template.target || 'NONE'}</div>`
            );
        } else {
            if (template.effects) {
                metadataElements.push(
                    `<div class="ability-meta"><span class="meta-label">Effects:\n</span>`
                );
                template.effects.forEach(effect => {
                    metadataElements.push(
                        `${effect.stat} +${effect.value}\n`
                    );
                });
                metadataElements.push(`</div>`);
            }
        }
        let effectInfo = '';
        if (template.effectId){
            const effect = db.effects.find(e => e.id === template.effectId);
            effectInfo = `<small class="ability-effect">'${effect.name}' Effect: ${effect.description}</small>`;
        }
        return `
            <div class="ability-item ${template.isPassive ? 'passive' : 'power'} ${template.isCurse ? 'curse' : ''}" 
            data-ability-id="${ability.id}">
                <div class="ability-header">
                    <div class="ability-title">
                        <h4>${template.name} ${isCurse}</h4>
                    </div>
                    ${!template.isPassive ? 
                        `<button class="btn-ability-use" data-ability-id="${ability.id}">Use</button>` : ''}
                </div>
                <p class="ability-description">${template.description}</p>
                ${effectInfo}
                <div class="ability-metadata">
                    ${metadataElements.join('')}
                </div>
            </div>
        `;
    }

    addEffect(effectId, source = null) {
        const effectTemplate = db.effects.find(e => e.id === effectId);
        if (!effectTemplate) {
            logError(new Error(`Effect ${effectId} not found`));
            return false;
        }
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
        this.startEffectTimer(effectId);
        this.updateEffectsUI();
        return true;
    }

    removeEffect(effectId) {
        if (!this.activeEffects[effectId]) return false;
        if (this.effectTimers[effectId]) {
            clearInterval(this.effectTimers[effectId]);
            delete this.effectTimers[effectId];
        }
        delete this.activeEffects[effectId];
        this.updateEffectsUI();
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
            this.updateEffectsUI();
        }, 1000);
    }

    processEffectTick(effectId) {
        const effect = this.activeEffects[effectId];
        if (!effect) return;
        switch(effect.usage) {
            case "DAMAGE_OVER_TIME":{
                this.takeDamage(effect.value, {name: effect.name});
                break;
            }
        }
    }

    updateEffectsUI() {
        const container = this.elements.effects;
        const activeEffects = Object.values(this.activeEffects);
        if (activeEffects.length === 0) {
            container.innerHTML = '<p>No active effects</p>';
            return;
        }
        container.innerHTML = activeEffects.map(effect => {
            const effectTemplate = db.effects.find(e => e.id === effect.id);
            const effectTypeClass = effectTemplate.isDebuff ? 'debuff' : 'buff';
            return `
            <div class="effect-item ${effectTypeClass}" data-effect-id="${effect.id}">
                <div class="effect-icon ${effect.icon}"></div>
                <div class="effect-info">
                    <h4>${effect.name}</h4>
                    <p>${effect.description}</p>
                    ${effect.hasDuration ? `
                        <div class="effect-timer">
                            <progress value="${Date.now() - effect.appliedAt}" max="${effect.duration}"></progress>
                            <span>${Math.ceil((effect.duration - (Date.now() - effect.appliedAt)) / 1000)}s</span>
                        </div>
                    ` : ''}
                    ${effect.remainingUses !== null ? `
                        <div class="effect-uses">Remaining: <strong>${effect.remainingUses}</strong></div>
                    ` : ''}
                </div>
            </div>
            `;
        }).join('');
    }

    hasEffect(effectId) {
        return !!this.activeEffects[effectId];
    }

    addItem(itemId, quantity = 1) {
        const itemTemplate = db.items.find(item => item.id === itemId);
        if (!itemTemplate) {
            logError(new Error(`Item ${itemId} not found`));
            return false;
        }
        if (this.inventory.items[itemId]) {
            this.inventory.items[itemId].quantity += quantity;
        } else {
            this.inventory.items[itemId] = {
                details: { ...itemTemplate },
                quantity: quantity,
                obtainedAt: Date.now()
            };
        }
        this.updateInventoryUI();
        return true;
    }

    removeItem(itemId, quantity = 1) {
        if (!this.inventory.items[itemId]) return false;
        this.inventory.items[itemId].quantity -= quantity;
        if (this.inventory.items[itemId].quantity <= 0) {
            delete this.inventory.items[itemId];
        }
        this.updateInventoryUI();
        return true;
    }

    useItem(itemId) {
        if (this.isDead) return false;
        const item = this.inventory.items[itemId];
        if (!item) return false;
        const itemSubType = item.details.subType.toUpperCase();
        switch (itemSubType) {
            case 'RESTORES HP':{
                if (this.hp === this.maxHp) {
                    showDialog('You are already at full health.', {doLog: false});
                    return false;
                }
                const heal = Math.min(Math.round(this.maxHp * item.details.effect.value), this.maxHp - this.hp);
                this.heal(heal);
                showDialog(`Used ${item.details.name}! Healed ${heal} HP.`);
                this.removeItem(itemId);
                return true;
            }
            case 'PURIFIERS': {
                if (item.details.effect.type === "EFFECT") {
                    const effectId = item.details.effect.id;
                    if (!this.hasEffect(effectId)) {
                        showDialog("You aren't being affected by this effect.", {doLog: false});
                        return false;
                    }
                    this.removeEffect(effectId);
                    this.removeItem(itemId);
                    return true;
                }
            }
            default: {
                logError(new Error(`Unknown item subtype: ${itemSubType}`));
                return false;
            }
        }
    }

    updateInventoryUI() {
        const container = this.elements.inventory;
        const itemsList = Object.values(this.inventory.items);
        if (itemsList.length === 0) {
            container.innerHTML = 'Your inventory is empty.';
            return;
        }
        const categorizedItems = {};
        itemsList.forEach(item => {
            const type = item.details.type;
            const subType = item.details.subType || 'Miscellaneous';
            if (!categorizedItems[type]) {
                categorizedItems[type] = {};
            }
            if (!categorizedItems[type][subType]) {
                categorizedItems[type][subType] = [];
            }
            categorizedItems[type][subType].push(item);
        });
        let html = '';
        for (const [type, subTypes] of Object.entries(categorizedItems)) {
            html += `<div class="inventory-category">
                        <h4 class="category-title">${type.toUpperCase()}</h4>`;
            for (const [subType, items] of Object.entries(subTypes)) {
                html += `<div class="inventory-subcategory">
                            <h5 class="subcategory-title">${subType.toUpperCase()}</h5>
                            ${items
                                .sort((a, b) => b.obtainedAt - a.obtainedAt)
                                .map(item => this.createItemHTML(item))
                                .join('')}
                        </div>`;
            }
            html += `</div>`;
        }
        container.innerHTML = html;
        container.querySelectorAll('.btn-item-use').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.useItem(e.target.dataset.itemId);
            });
        });
    }

    createItemHTML(item) {
        return `
            <div class="item" data-item-id="${item.details.id}">
                <div class="item-info">
                    <h4>${item.details.name}</h4>
                    <p>${item.details.description}</p>
                    <div class="item-meta">
                        <span class="item-quantity">x${item.quantity}</span>
                    </div>
                </div>
                ${item.details.type === 'Consumables' ? 
                    `<button class="btn-item-use" data-item-id="${item.details.id}">Use</button>` : ''}
            </div>
        `;
    }

    hasItem(itemId) {
        return !!this.inventory.items[itemId];
    }

    getItemQuantity(itemId) {
        return this.inventory.items[itemId]?.quantity || 0;
    }

    destroy() {
        if (this.playtimeInterval) {
            clearInterval(this.playtimeInterval);
            this.playtimeInterval = null;
        }
        this.elements.log.innerHTML = '';
        this.elements.inventory.innerHTML = '';
        player = null;
    }
}

function gameOver(causeOfDeath) {
    showDialog(`You have been slain by ${causeOfDeath.name}...`, { speed: 110 });
    clearAllEnemies();
    clearAllEvents();
    player.isDead = true;
    document.getElementById('btn-advance').disabled = true;
}

let player = null;

export function createPlayer() {
    player = new Player();
    player.updateStats();
    playerDebug();
    return player;
}

function playerDebug(){
    db.abilities.forEach(ability => {
        player.addAbility(ability.id);
    });
    db.items.forEach(item => {
        player.addItem(item.id);
    });
}

export { player };