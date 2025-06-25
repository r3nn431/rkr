// js/player.js
import * as db from './database.js';
import ProgressBar from './progressBar.js';
import { playSFX, showDialog } from './config.js';
import { formatDate, logError, attachTooltips, showToast } from './utils.js';
import { enemies, clearAllEnemies } from './enemy.js';
import { clearAllEvents } from './event.js';

const attributes = ['constitution', 'strength', 'dexterity', 'arcane', 'defense', 'attack', 'evasion', 'stealth', 'accuracy', 'alchemy', 'craftsmanship', 'luck'];

export class Player {
    constructor() {
        this.title = 'Newborn';
        this.attributePoints = 0;
        // ATTRIBUTES
        this.constitution = { 
            value: 1,
            maxValue: 100,
            tempValue: 0
        };
        this.strength = { 
            value: 1,
            maxValue: 100,
            tempValue: 0
        };
        this.dexterity = { 
            value: 1,
            maxValue: 100,
            tempValue: 1
        };
        this.arcane = { 
            value: 1,
            maxValue: 100,
            tempValue: 0
        };
        // CALCULATED STATS
        this.defense = {
            value: 0,
            maxValue: 90,
            tempValue: 0
        }
        this.attack = {
            value: 0,
            maxValue: 200,
            tempValue: 0
        }
        this.evasion = {
            value: 0,
            maxValue: 90,
            tempValue: 0
        }
        this.stealth = {
            value: 0,
            maxValue: 100,
            tempValue: 0
        }
        // OTHERS
        this.alchemy = {
            value: 1,
            maxValue: 10,
            tempValue: 0,
            xp: 0,
            nextXp: 100,
            level: 1,
            maxLevel: 10
        };
        this.craftsmanship = {
            value: 1,
            maxValue: 10,
            tempValue: 0,
            xp: 0,
            nextXp: 100,
            level: 1,
            maxLevel: 10
        };
        this.luck = {
            value: 1,
            maxValue: 50,
            tempValue: 0
        }
        this.accuracy = {
            value: 90,
            maxValue: 100,
            tempValue: 0
        }
        this.criticalChance = 5;
        this.criticalMultiplier = 1.5;
        this.criticalResistance = 0;
        this.attackSpeed = 3000;
        this.maxHp = this.calculateMaxHp();
        this.hp = this.maxHp;
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = this.calculateXpToNextLevel();
        this.mpMax = this.calculateMaxMp();
        this.mp = this.mpMax;
        // UI
        this.hpBar = new ProgressBar({
            id: 'player-bar-hp',
            containerId: 'player-hp-container',
            min: 0,
            max: this.maxHp,
            current: this.maxHp,
            color: 'var(--hp)',
            textTemplate: (min, current, max) => `HP ${current}/${max}`,
            enableLowEffect: true
        });
        this.xpBar = new ProgressBar({
            id: 'player-bar-xp',
            containerId: 'player-xp-container',
            min: 0,
            max: this.xpToNextLevel,
            current: this.xp,
            color: 'var(--xp)',
            textTemplate: (min, current, max) => `XP ${current}/${max} (Lv.${this.level})`,
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
        this.mpBar = new ProgressBar({
            id: 'player-bar-mp',
            containerId: 'player-mp-container',
            min: 0,
            max: this.mpMax,
            current: this.mpMax,
            color: 'var(--mp)',
            textTemplate: (min, current, max) => `MP ${current}/${max}`,
            enableLowEffect: false
        })
        this.elements = {
            title: document.getElementById('player-title'),
            constitution: document.getElementById('player-con'),
            strength: document.getElementById('player-str'),
            dexterity: document.getElementById('player-dex'),
            arcane: document.getElementById('player-arc'),
            defense: document.getElementById('player-def'),
            attack: document.getElementById('player-att'),
            accuracy: document.getElementById('player-acc'),
            alchemy: document.getElementById('player-alc'),
            craftsmanship: document.getElementById('player-craft'),
            crit: document.getElementById('player-crit'),
            evasion: document.getElementById('player-eva'),
            stealth: document.getElementById('player-ste'),
            ap: document.getElementById('player-ap'),
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
        this.distance = 0;
        this.log = [];
        this.inventory = {
            items: {},
            equipped: []
        };
        this.kills = {};
        this.abilities = {};
        this.activeEffects = {};
        this.effectsModifiers = {};
        this.currentTargetingAbility = null;
        this.unlockedRecipes = {};
        this.isDead = false;
        this.startPlaytime();
    }
    
    //@title UTILITARY METHODS
    updateStats() {
        document.getElementById('current-startdate').textContent = formatDate(this.startDate, true);
        this.elements.title.textContent = this.title || 'Player';
        this.elements.constitution.textContent = this.getAttributeValue('constitution') || 0;
        this.elements.strength.textContent = this.getAttributeValue('strength') || 0;
        this.elements.dexterity.textContent = this.getAttributeValue('dexterity') || 0;
        this.elements.arcane.textContent = this.getAttributeValue('arcane') || 0;
        this.elements.defense.textContent = this.getDefenseValue() || 0;
        this.elements.attack.textContent = this.getAttackValue() || 0;
        this.elements.evasion.textContent = this.getEvasionValue() || 0;
        this.elements.stealth.textContent = this.getStealthValue() || 0;
        this.elements.accuracy.textContent = this.getAttributeValue('accuracy') || 0;
        this.elements.alchemy.textContent = `${this.getAttributeValue('alchemy')} (${this.alchemy.xp}/${this.alchemy.nextXp})` || 0;
        this.elements.craftsmanship.textContent = `${this.getAttributeValue('craftsmanship')} (${this.craftsmanship.xp}/${this.craftsmanship.nextXp})` || 0;
        this.elements.crit.textContent = `${this.criticalChance}% (${this.criticalMultiplier})` || 0;
        this.elements.kills.textContent = this.getTotalKills() || 0;
        this.elements.playtime.textContent = this.formatPlaytime() || '00:00:00';
        this.elements.distance.textContent = this.distance || 0;
        this.elements.ap.textContent = this.attributePoints || 0;
        this.updateInventoryUI();
        this.updateAbilitiesUI();
        this.updateEffectsUI();
    }

    startPlaytime() {
        this.playtime = 0;
        this.playtimeInterval = setInterval(() => {
            if (this.isDead) {
                clearInterval(this.playtimeInterval);
                this.playtimeInterval = null;
                return;
            }
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

    resetBattle(){
        Object.values(this.abilities).forEach(ab => {
            ab.usedThisBattle = false;
        });
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

    //@title ATTRIBUTE CALCULATIONS
    getAttributeValue(attribute) {
        if (!this[attribute]) {
            logError(new Error(`Attribute "${attribute}" does not exist`));
            return 0;
        }
        if (this[attribute].value > this[attribute].maxValue) this[attribute].value = this[attribute].maxValue;
        return Math.min(Math.floor(this[attribute].value + this[attribute].tempValue), this[attribute].maxValue + this[attribute].tempValue);
    }

    getDefenseValue(){
        return Math.min(Math.floor(0.5 * this.getAttributeValue('constitution') + this.getAttributeValue('defense')), this.defense.maxValue);
    }

    getAttackValue(){
        return Math.min(Math.floor(2 * this.getAttributeValue('strength') + this.getAttributeValue('attack') + 5), this.attack.maxValue);
    }

    getEvasionValue(){
        return Math.min(Math.floor(0.5 * this.getAttributeValue('dexterity') + 0.3 * this.getAttributeValue('luck') + this.getAttributeValue('evasion')), this.evasion.maxValue);
    }

    getStealthValue(){
        return Math.min(Math.floor(0.7 * this.getAttributeValue('dexterity') + 0.3 * this.getAttributeValue('luck') + this.getAttributeValue('stealth')), this.stealth.maxValue);
    }

    calculateMaxHp() {
        return Math.min(Math.floor(100 + 20 * (this.getAttributeValue('constitution') - 1)), 1000);
    }

    calculateMaxMp() {
        return Math.min(Math.floor(10 + 2 * (this.getAttributeValue('arcane') - 1)), 500);
    }

    calculateXpToNextLevel() {
        return Math.floor(100 * Math.pow(1.2, this.level - 1));
    }

    //@title LEVELING
    addSkillXp(name, amount) {
        const skill = this[name];
        skill.xp += amount;
        while (skill.xp >= skill.nextXp && skill.level < skill.maxLevel) {
            skill.xp -= skill.nextXp;
            skill.level++;
            skill.value++;
            skill.nextXp = Math.floor(skill.nextXp * 1.2);
        }
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
        this.attributePoints++;
        this.elements.ap.textContent = this.attributePoints;
        this.xpToNextLevel = this.calculateXpToNextLevel();
        this.heal(this.maxHp);
        showDialog(`Level up! Now you're level ${this.level}!`);
    }

    applyModifier(attribute, amount = 1, isTemporary = false) {
        if (attribute == null) {
            attribute = attributes[Math.floor(Math.random() * attributes.length)];
        }
        if (isTemporary){
            this[attribute].tempValue += amount;
        } else {
            this[attribute].value += amount;
        }

        if (this[attribute].value >= this[attribute].maxValue) {
            this.elements[attribute].classList.add('attribute-max');
        } else {
            this.elements[attribute].classList.remove('attribute-max');
        }

        this.elements[attribute].textContent = this.getAttributeValue(attribute);
        switch (attribute) {
            case 'constitution': {
                this.maxHp = this.calculateMaxHp();
                this.hpBar.setMax(this.maxHp);
            }
            case 'defense': {
                this.elements.defense.textContent = this.getDefenseValue();
                break;
            }
            case 'arcane':{
                this.maxMp = this.calculateMaxMp();
                this.mpBar.setMax(this.maxMp);
                break;
            }
            case 'strength':
            case 'attack': {
                this.elements.attack.textContent = this.getAttackValue();
                break;
            }
            case 'dexterity': {
                this.elements.evasion.textContent = this.getEvasionValue();
                this.elements.stealth.textContent = this.getStealthValue();
                break;
            }
            case 'evasion': {
                this.elements.evasion.textContent = this.getEvasionValue();
                break;
            }
            case 'stealth': {
                this.elements.stealth.textContent = this.getStealthValue();
                break;
            }
            case 'alchemy': {
                this.elements.alchemy.textContent = `${this.getAttributeValue('alchemy')} (${this.alchemy.xp}/${this.alchemy.nextXp})`;
                break;
            }
            case 'craftsmanship': {
                this.elements.craftsmanship.textContent = `${this.getAttributeValue('craftsmanship')} (${this.craftsmanship.xp}/${this.craftsmanship.nextXp})`;
                break;
            }
        }
        //this.elements.crit.textContent = `${this.criticalChance}% (${this.criticalMultiplier})` || 0;

        if (this[attribute].tempValue > 0) this.elements[attribute].style.color = 'green';
        else if (this[attribute].tempValue < 0) this.elements[attribute].style.color = 'red';
        else this.elements[attribute].style.color = 'var(--text-primary)';
    }

    increaseAttribute(attribute) {
        if (this.attributePoints <= 0) return false;
        if (this[attribute].value >= this[attribute].maxValue) return false;
        this.applyModifier(attribute, 1);
        this.attributePoints -= 1;
        this.elements.ap.textContent = this.attributePoints;
        return true;
    }

    decreaseAttribute(attribute) {
        if (this[attribute].value <= 1) return false;
        this.applyModifier(attribute, -1);
        this.attributePoints += 1;
        this.elements.ap.textContent = this.attributePoints;
        return true;
    }

    showAttributesControls() {
        const showControls = this.attributePoints > 0;
        document.querySelectorAll('.attribute-controls').forEach(control => {
            control.classList.toggle('visible', showControls);
        });
    }

    //@title HANDLE DAMAGE
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

    //@title KILLS
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

    //@title ABILITIES
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
        showToast(`New ${template.isPassive ? 'passive' : 'power'} added!`, `${template.isPassive && template.isCurse ? 'debuff' : 'buff'}`, {targetElement: document.getElementById('btn-abilities')});
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
        switch(ability.target) {
            case "SELF":{
                if (ability.effectId) {
                    if (!this.addEffect(ability.effectId, 'player')) return false;
                }
                showDialog(`Used ${ability.name} on yourself!`);
                break;
            }
            case "ENEMY":{
                if (enemies.length === 1) {
                    if(!this.applyAbilityToEnemy(abilityId, enemies[0])) return false;
                } else {
                    this.startTargetSelection(abilityId);
                }
                break;
            }
            case "ALL_ENEMIES":{
                if (ability.effectId){
                    const canApplyToAny = enemies.some(enemy => !enemy.hasEffect(ability.effectId));
                    if (!canApplyToAny) {
                        showDialog(`All enemies are already affected by this effect!`, {doLog: false});
                        return false;
                    }
                    let affectedCount = 0;
                    enemies.forEach(enemy => {
                        if (!enemy.hasEffect(ability.effectId)) {
                            enemy.addEffect(ability.effectId, 'player');
                            affectedCount++;
                        }
                    });
                    showDialog(`Used ${ability.name} on ${affectedCount} enem${affectedCount !== 1 ? 'ies' : 'y'}!`);
                }
                break;
            }
            default: return false;
        }
        ability.usedThisBattle = true;
        if (ability.cooldown) {
            ability.remainingCooldown = Date.now() + ability.cooldown;
            this.startAbilityCooldown(ability.id);
        }
        return true;
    }

    applyAbilityToEnemy(abilityId, enemy) {
        const ability = this.abilities[abilityId];
        if (!ability || !ability.effectId) return;
        if (ability.effectId){
            if (enemy.hasEffect(ability.effectId)) {
                showDialog(`${enemy.name} is already affected by this effect.`, {doLog: false});
                return false;
            }
            enemy.addEffect(ability.effectId, 'player');
        }
        showDialog(`Used ${ability.name} on ${enemy.name}!`);
        return true;
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
        const powersAbilities = Object.values(this.abilities).filter(a => !a.isPassive);
        if (passiveAbilities.length === 0 && powersAbilities.length === 0) {
            this.elements.abilities.innerHTML = 'You currently have no abilities.';
            return;
        }
        let html = '';
        if (powersAbilities.length > 0) {
            html += `
                <div class="ability-category">
                    <h4 class="category-title">Powers</h4>
                    ${powersAbilities
                        .sort((a, b) => b.obtainedAt - a.obtainedAt)
                        .map(ability => this.createAbilityHTML(ability))
                        .join('')}
                </div>
            `;
        }
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
            if (template.source) {
                metadataElements.push(
                    `<div class="ability-meta"><span class="meta-label">Source:</span>${template.source}</div>`
                );
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

    //@title EFFECTS
    addEffect(effectId, source = null) {
        const template = db.effects.find(e => e.id === effectId);
        if (!template) {
            logError(new Error(`Effect ${effectId} not found`));
            return false;
        }
        if (this.hasEffect(effectId)) {
            showDialog(`You are already affected by ${template.name}.`, {doLog: false});
            return false;
        }
        this.removeEffect(effectId);
        const effect = {
            ...template,
            appliedAt: Date.now(),
            remainingUses: template.uses || null,
            source: source,
            timer: null,
            interval: null
        };
        this.activeEffects[effectId] = effect;
        this.startEffectTimer(effectId);
        this.updateEffectsUI();
        showToast(`New effect added!`, `${template.isDebuff ? 'debuff' : 'buff'}`, {targetElement: document.getElementById('btn-effects')});
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
        showToast(`Effect removed!`, `${effect.isDebuff ? 'debuff' : 'buff'}`, {targetElement: document.getElementById('btn-effects')});
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
            if (this.isDead || !this.activeEffects[effectId]) return;
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

    //@title INVENTORY
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
        showToast('New item added!', 'added', {targetElement: document.getElementById('btn-inventory')});
        return true;
    }

    removeItem(itemId, quantity = 1) {
        if (!this.inventory.items[itemId]) return false;
        this.inventory.items[itemId].quantity -= quantity;
        if (this.inventory.items[itemId].quantity <= 0) {
            delete this.inventory.items[itemId];
        }
        this.updateInventoryUI();
        showToast('Item removed!', 'removed', {targetElement: document.getElementById('btn-inventory')});
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
            const type = item.details.type || 'Miscellaneous';
            const subType = item.details.subType || 'Unknown';
            if (!categorizedItems[type]) {
                categorizedItems[type] = {};
            }
            if (!categorizedItems[type][subType]) {
                categorizedItems[type][subType] = [];
            }
            categorizedItems[type][subType].push(item);
        });
        let html = '';
        const subTypeDescription = {
            'Enemy Drops': 'Materials to craft equipments and mix potions',
            'Costs': 'Use to pay the requested amount',
            'Valuables': 'These items sell for a good price',
            'Restores HP': 'Potions that restore life',
            'Purifiers': 'Potions that remove curses and debilitating effects',
            'Fortifiers': 'Potions that give effects and/or status modifiers',
            'Scrolls': 'Using a scroll allows you to perform a special action and then it disappears',
            'Accessories': 'Keep equipped to gain its effects and only 1 can be equipped at a time',
            'Weapons': 'Keep equipped to gain its effects and only 1 can be equipped at a time',
            'Armors': 'Keep equipped to gain its effects and only 1 can be equipped at a time',
            'Unknown': 'This is not supposed to be here'
        };
        for (const [type, subTypes] of Object.entries(categorizedItems)) {
            html += `<div class="inventory-category">
                        <h4 class="category-title">${type.toUpperCase()}</h4>`;
            for (const [subType, items] of Object.entries(subTypes)) {
                const tooltipText = subTypeDescription[subType] || '';
                html += `<div class="inventory-subcategory">
                            <h5 class="subcategory-title tooltip" data-tooltip="${tooltipText}">${subType.toUpperCase()}</h5>
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
        attachTooltips();
        setupEquipmentCheckboxes();
    }

    createItemHTML(item) {
        const isEquipment = item.details.type === 'Equipments';
        const isEquipped = this.isItemEquipped(item.details.id);
        const isConsumable = item.details.type === 'Consumables';
        return `
            <div class="item" data-item-id="${item.details.id}" data-sub-type="${item.details.subType}">
                <div class="item-info">
                    <h4>${item.details.name}</h4>
                    <p>${item.details.description}</p>
                    <div class="item-meta">
                        <span class="item-quantity">x${item.quantity}</span>
                    </div>
                </div>
                ${isEquipment ? `
                    <label class="equip-toggle">
                        <input type="checkbox" class="equip-checkbox" 
                            data-item-id="${item.details.id}" 
                            data-sub-type="${item.details.subType}"
                            ${isEquipped ? 'checked' : ''}>
                        <span>Equip</span>
                    </label>
                ` : ''}
                ${isConsumable ? `
                    <button class="btn-item-use" data-item-id="${item.details.id}">Use</button>
                ` : ''}
            </div>
        `;
    }

    isItemEquipped(itemId) {
        return this.inventory.equipped.some(e => e.id === itemId);
    }

    hasItem(itemId) {
        return !!this.inventory.items[itemId];
    }

    getItemQuantity(itemId) {
        return this.inventory.items[itemId]?.quantity || 0;
    }

    equipItem(itemId) {
        const item = this.inventory.items[itemId]?.details;
        if (!item || item.type !== 'Equipments') return false;
        this.unequipItemsBySubType(item.subType);
        this.inventory.equipped.push({
            id: itemId,
            subType: item.subType,
            effects: item.effects || []
        });
        this.applyItemEffects(itemId);
        return true;
    }

    unequipItemsBySubType(subType) {
        const itemsToRemove = this.inventory.equipped.filter(item => item.subType === subType);
        itemsToRemove.forEach(item => {
            this.removeItemEffects(item.id);
            this.inventory.equipped = this.inventory.equipped.filter(e => e.id !== item.id);
        });
    }

    unequipItem(itemId) {
        this.removeItemEffects(itemId);
        this.inventory.equipped = this.inventory.equipped.filter(item => item.id !== itemId);
    }

    applyItemEffects(itemId) {
        const item = this.inventory.items[itemId]?.details;
        if (!item || !item.effects) return;
        item.effects.forEach(effect => {
            // this.applyModifier(effect.stat, effect.value);
        });
    }

    removeItemEffects(itemId) {
        const item = this.inventory.items[itemId]?.details;
        if (!item || !item.effects) return;
        item.effects.forEach(effect => {
            // this.applyModifier(effect.stat, -effect.value);
        });
    }
}

//@title PLAYER FUNCTIONS OUTSIDE CLASS
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
    playerStartingItems();
    playerDebug();
    return player;
}

function playerStartingItems() {
    player.addItem('currency-gold_coin', 10);
}

function playerDebug(){
    db.abilities.forEach(ability => {
        player.addAbility(ability.id);
    });
    db.items.forEach(item => {
        player.addItem(item.id);
    });
    player.showAttributesControls();
}

export { player };

document.querySelectorAll('.btn-attribute.increase').forEach(btn => {
    btn.addEventListener('click', () => {
        const attribute = btn.closest('.attribute-controls').dataset.attribute;
        player.increaseAttribute(attribute);
    });
});

document.querySelectorAll('.btn-attribute.decrease').forEach(btn => {
    btn.addEventListener('click', () => {
        const attribute = btn.closest('.attribute-controls').dataset.attribute;
        player.decreaseAttribute(attribute);
    });
});

function setupEquipmentCheckboxes() {
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('equip-checkbox')) {
            const itemId = e.target.dataset.itemId;
            const subType = e.target.dataset.subType;
            document.querySelectorAll(`.equip-checkbox[data-sub-type="${subType}"]`).forEach(cb => {
                if (cb !== e.target) {
                    cb.checked = false;
                    const otherItemId = cb.dataset.itemId;
                    player.unequipItem(otherItemId);
                }
            });
            if (e.target.checked) {
                player.equipItem(itemId);
            } else {
                player.unequipItem(itemId);
            }
        }
    });
}