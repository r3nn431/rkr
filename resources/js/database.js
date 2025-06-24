// js/database.js

//@title ENEMIES
export const enemies = [
    {
        id: "enemy-rat",
        name: 'Rat',
        rarity: 80,
        list: "NORMAL",
        xpReward: 8,
        hp: 15,
        attack: 10,
        defense: 1,
        ability: {},
        type: 'MUTANT',
        moveType: 'MIXED',
        moveSpeed: 90,
        attackSpeed: 4000,
        canEscape: false,
        escapeChance: 70,
        escapeRate: 30,
        disablePlayerEscape: false,
        stealth: 15,
        criticalChance: 5,
        criticalMultiplier: 1.2,
        criticalResistance: 0,
        accuracy: 80,
        evasion: 10,
        allowSwarm: true,
        canAttack: true,
        info: 'A common enemy here',
        img: ["rat.png"],
        loot: [
            {id: "item-small_hp_potion", quantity: 1, chance: 100}
        ]
    },
    {
        id: "enemy-chest_mimic",
        name: 'Mimic',
        rarity: 0,
        list: "SPECIAL",
        xpReward: 20,
        hp: 25,
        attack: 10,
        defense: 5,
        ability: {},
        type: 'ANOMALY',
        moveType: 'HORIZONTAL',
        moveSpeed: 40,
        attackSpeed: 4000,
        canEscape: false,
        escapeChance: 70,
        escapeRate: 30,
        disablePlayerEscape: false,
        stealth: 10,
        criticalChance: 1,
        criticalMultiplier: 1.2,
        criticalResistance: 0,
        accuracy: 90,
        evasion: 0,
        allowSwarm: false,
        canAttack: true,
        info: 'Be careful when opening chests',
        img: ["chest_mimic.png"],
        loot: []
    }
];

//@title ABILITIES
export const abilities = [
    {
        id: "passive-killall_50",
        name: "Bathed in blood",
        description: "You're getting the hang of this so it's easier to land attacks now",
        rarity: 3,
        isSoulbound: false,
        isPassive: true,
        isCurse: false,
        unlockCondition: {
            method: "KILL_ALL",
            id: null,
            type: null,
            amount: 50
        },
        source: "Obtained from killing 50 enemies",
        effects: [
            { stat: "ACCURACY", value: 10 }
        ]
    },
    {
        id: "power-protect",
        name: "Protect",
        description: "Applies the 'Protected' condition to the target",
        rarity: 4,
        isPassive: false,
        cooldown: 10000,
        costValue: 20,
        costType: "MP",
        target: "SELF",
        usage: "ANY",
        effectId: "effect-protected",
        useCondition: []
    },
    {
        id: "power-poison",
        name: "Poison Strike",
        description: "Applies the 'Poisoned' condition to the target",
        rarity: 3,
        isPassive: false,
        cooldown: 5000,
        costValue: 15,
        costType: "MP",
        target: "ENEMY",
        usage: "COMBAT",
        effectId: "effect-poisoned",
        useCondition: []
    }
];

//@title EFFECTS
export const effects = [
    {
        id: "effect-poisoned",
        name: "Poisoned",
        description: "Does 2 damage every second for 10 seconds",
        usage: "DAMAGE_OVER_TIME",
        duration: 10000,
        hasDuration: true,
        value: 2,
        icon: "icon-poison-bottle",
        isDebuff: true,
        target: "ANY"
    },
    {
        id: "effect-reverse_damage",
        name: "Reversed",
        description: "Target's next 3 attacks revert to itself",
        usage: "ON_ATTACK",
        hasDuration: false,
        uses: 3,
        icon: "icon-divert",
        isDebuff: true,
        target: "ANY"
    },
    {
        id: "effect-protected",
        name: "Protected",
        description: "Reduces damage taken by 40%",
        usage: "ON_HIT",
        duration: 10000,
        hasDuration: true,
        value: 0.4,
        icon: "icon-shield",
        isDebuff: false,
        target: "ANY"
    }
];

//@title EVENTS
export const events = [
    {
        id: "chest",
        rarity: 40,
        disableAdvance: false,
        subEvents: [
            {
                id: "loot",
                rarity: 5
            },
            {
                id: "mimic",
                rarity: 1
            }
        ],
        name: "Chest",
        img: "chest.png",
        actionName: "OPEN",
        moveType: "FIXED",
        startPosition: "MIDDLE",
        loot: [
            {id: "item-small_hp_potion", quantity: 1, chance: 80},
            {id: "item-small_hp_potion", quantity: 1, chance: 20},
            {id: "currency-gold_coin", quantity: 1, chance: 100},
            {id: "currency-gold_coin", quantity: 5, chance: 85},
            {id: "currency-gold_coin", quantity: 3, chance: 65}
        ]
    },
    {
        id: "trap",
        rarity: 30,
        disableAdvance: true,
        name: "Arrow Trap",
        img: "arrow_trap.png",
        actionName: "DODGE",
        moveType: "HORIZONTAL",
        moveSpeed: 250,
        attack: 30
    },
    {
        id: 'enemy',
        rarity: 70
    },
    {
        id: 'nothing',
        rarity: 5
    }
]

//@title ITEMS
export const items = [
    {
        id: 'currency-gold_coin',
        name: 'Gold Coin',
        description: "The dungeon's currency",
        type: 'Miscellaneous',
        subType: 'Costs'
    },
    {
        id: 'item-small_hp_potion',
        name: 'Lesser Healing Potion',
        description: 'Restores 15% of your maximum HP',
        price: 15,
        currency: 'currency-gold_coin',
        type: 'Consumables',
        subType: 'Restores HP',
        effect: { value: 0.15 }
    },
    {
        id: 'item-medium_hp_potion',
        name: 'Greater Healing Potion',
        description: 'Restores 50% of your maximum HP',
        price: 40,
        currency: 'currency-gold_coin',
        type: 'Consumables',
        subType: 'Restores HP',
        effect: { value: 0.50 }
    },
    {
        id: 'item-antidote',
        name: 'Cure Poison Potion',
        description: 'Removes the "Poisoned" effect',
        price: 35,
        currency: 'currency-gold_coin',
        type: 'Consumables',
        subType: 'Purifiers',
        effect: { type: "EFFECT", stat: "effect-poisoned", value: 1 }
    },
    {
        id: 'weapon-sword',
        name: 'Sword',
        type: 'Equipments',
        subType: 'Weapons',
        description: 'An ordinary sword',
        effects: [
            { stat: 'strength', value: 2 }
        ]
    },
    {
        id: 'weapon-rapier',
        name: 'Rapier',
        type: 'Equipments',
        subType: 'Weapons',
        description: 'An ordinary rapier',
        effects: [
            { stat: 'strength', value: 2 }
        ]
    },
    {
        id: 'armor-light',
        name: 'Light Armor',
        type: 'Equipments',
        subType: 'Armors',
        description: 'An ordinary light armor',
        effects: [
            { stat: 'defense', value: 3 }
        ]
    },
];

//@title RECIPES
export const recipes = [];