// js/database.js

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
        ability: 'NONE',
        element: 'NONE',
        type: 'PARASITE',
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
        ability: 'NONE',
        element: 'NONE',
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

export const abilities = [
    {
        id: "passive-test",
        name: "Iron Skin",
        description: "Increases constitution by 2",
        rarity: 3,
        isSoulbound: false,
        isPassive: true,
        isCurse: false,
        unlockCondition: {
            method: "KILL",
            id: null,
            type: null,
            amount: 1
        },
        source: "Obtained from killing a rat",
        effects: [
            { stat: "CONSTITUTION", value: 2 }
        ]
    },
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
        id: "power-self_damage",
        name: "Curse of Return",
        description: "Applies the 'Damage Return' condition to the target",
        rarity: 4,
        isPassive: false,
        cooldown: 30000,
        costValue: 20,
        costType: "MP",
        target: "ENEMY",
        usage: "COMBAT",
        effectId: "effect-self_damage",
        useCondition: []
    },
    {
        id: "power-poison",
        name: "Poison Strike",
        description: "Applies the 'Poisoned' condition to the target",
        rarity: 3,
        isPassive: false,
        cooldown: 20000,
        costValue: 15,
        costType: "MP",
        target: "ENEMY",
        usage: "COMBAT",
        effectId: "effect-poisoned",
        useCondition: []
    }
];

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
        stackable: false,
        target: "ANY"
    },
    {
        id: "effect-self_damage",
        name: "Damage Return",
        description: "Target's next 3 attacks revert to itself",
        usage: "ON_ATTACK",
        hasDuration: false,
        uses: 3,
        multiplier: 1.0, // ?
        icon: "icon-divert",
        isDebuff: true,
        stackable: false,
        target: "ANY"
    }
];

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
        startPosition: "MIDDLE"
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
        rarity: 70,
        disableAdvance: false
    },
    {
        id: 'nothing',
        rarity: 5,
        disableAdvance: false
    }
]

export const items = [
    {
        id: 'item-gold_coin',
        name: 'Gold Coin',
        description: "The dungeon's currency",
        rarity: 90,
        type: 'Miscellaneous',
        subType: 'Currency',
        isLootable: true
    },
    {
        id: 'item-small_hp_potion',
        name: 'Small Health Potion',
        description: 'Restores 15% of your maximum HP',
        rarity: 80,
        price: 15,
        currency: 'item-gold_coin',
        type: 'Consumables',
        subType: 'Restores HP',
        isLootable: true,
        effect: { value: 0.15 }
    },
    {
        id: 'item-medium_hp_potion',
        name: 'Grand Health Potion',
        description: 'Restores 50% of your maximum HP',
        rarity: 40,
        price: 40,
        currency: 'item-gold_coin',
        type: 'Consumables',
        subType: 'Restores HP',
        isLootable: true,
        effect: { value: 0.50 }
    },
    {
        id: 'item-antidote',
        name: 'Antidote',
        description: 'Removes the "Poisoned" effect',
        rarity: 10,
        price: 35,
        currency: 'item-gold_coin',
        type: 'Consumables',
        subType: 'Purifiers',
        isLootable: false,
        effect: { type: "EFFECT", stat: "effect-poisoned", value: 1 }
    }
];