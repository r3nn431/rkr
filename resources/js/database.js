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
        defense: 0,
        ability: {},
        type: 'MUTANT',
        moveType: 'HORIZONTAL',
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
        canAttack: true,
        info: 'A common enemy here',
        img: ["rat.png"],
        loot: []
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
        canAttack: true,
        info: 'Be careful when opening chests',
        img: ["chest_mimic.png"],
        loot: [
            { id: "currency-gold_coin", quantity: 30, chance: 100 }
        ]
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
        source: "Obtained from killing 50 enemies"
    },
    {
        id: "power-protect",
        name: "Protect",
        description: "Applies the 'Protected' condition to the target",
        rarity: 4,
        isPassive: false,
        cooldown: 10000,
        costValue: 2,
        costType: "MP",
        target: "SELF",
        usage: "ANY",
        effects: ["effect-protected"]
    },
    {
        id: "power-poison",
        name: "Poison Strike",
        description: "Applies the 'Poisoned' condition to the target",
        rarity: 3,
        isPassive: false,
        cooldown: 5000,
        costValue: 2,
        costType: "MP",
        target: "ENEMY",
        usage: "BATTLE",
        effects: ["effect-poisoned"]
    }
];

//@title EFFECTS
export const effects = [
    {
        id: "effect-poisoned",
        name: "Poisoned",
        relativeName: "Poison",
        description: "Does 2 damage every second for 10 seconds",
        usage: "DAMAGE_TICK",
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
        relativeName: "Reversal",
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
        usage: "MODIFIER",
        duration: 10000,
        hasDuration: true,
        stat: "defense",
        value: 40,
        icon: "icon-shield",
        isDebuff: false,
        target: "ANY"
    }
];

//@title EVENTS
export const events = [
    {
        id: "event-chest",
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
        isEnemySize: true
    },
    {
        id: "event-trap",
        rarity: 30,
        disableAdvance: true,
        name: "Arrow Trap",
        img: "arrow_trap.png",
        actionName: "DODGE",
        moveType: "HORIZONTAL",
        moveSpeed: 250,
        attack: 30,
        isEnemySize: false
    },
    {
        id: 'outcome-enemy',
        rarity: 70
    },
    {
        id: 'outcome-nothing',
        rarity: 5
    },
    {
        id: 'event-seller',
        rarity: 25,
        name: 'Goblin Salesman',
        img: 'seller.png',
        actionName: 'TRADE',
        moveType: 'FIXED',
        startPosition: 'MIDDLE',
        isEnemySize: true
    }
]

//@title ITEMS
function generatePurifiersFromEffects() {
    return effects
        .filter(effect => effect.isDebuff)
        .map(effect => ({
            id: `item-cure_${effect.id.replace('effect-', '')}`,
            name: `Cure ${effect.relativeName} Potion`,
            description: `Removes the "${effect.name}" effect`,
            price: 40,
            currency: 'currency-gold_coin',
            type: 'Consumables',
            subType: 'Purifiers',
            effect: { type: "EFFECT", id: effect.id }
        }));
}

export const items = [
    {
        id: 'currency-gold_coin',
        name: 'Gold Coin',
        description: "The dungeon's currency",
        type: 'Miscellaneous',
        subType: 'Currencies'
    },
    {
        id: 'valuable-ruby',
        name: 'Ruby',
        description: "A rare gemstone. Sell for 100 gold coins.",
        price: 100,
        type: 'Miscellaneous',
        subType: 'Valuables'
    },
    {
        id: 'item-small_hp_potion',
        name: 'Minor Vitality Potion',
        description: 'Restores 15% of your maximum HP',
        rarity: 1,
        price: 30,
        currency: 'currency-gold_coin',
        type: 'Consumables',
        subType: 'Restores HP',
        effect: { value: 0.15 }
    },
    {
        id: 'item-medium_hp_potion',
        name: 'Greater Vitality Potion',
        description: 'Restores 50% of your maximum HP',
        rarity: 3,
        price: 60,
        currency: 'currency-gold_coin',
        type: 'Consumables',
        subType: 'Restores HP',
        effect: { value: 0.50 }
    },
    {
        id: 'item-full_hp_potion',
        name: 'Elixir of Renewal',
        description: 'Restores 100% of your maximum HP',
        rarity: 5,
        price: 140,
        currency: 'currency-gold_coin',
        type: 'Consumables',
        subType: 'Restores HP',
        effect: { value: 1 }
    },
    {
        id: 'item-small_mp_potion',
        name: 'Minor Arcane Potion',
        description: 'Restores 15% of your maximum MP',
        rarity: 2,
        price: 50,
        currency: 'currency-gold_coin',
        type: 'Consumables',
        subType: 'Restores MP',
        effect: { value: 0.15 }
    },
    {
        id: 'item-medium_mp_potion',
        name: 'Greater Arcane Potion',
        description: 'Restores 50% of your maximum MP',
        rarity: 5,
        price: 90,
        currency: 'currency-gold_coin',
        type: 'Consumables',
        subType: 'Restores MP',
        effect: { value: 0.50 }
    },
    {
        id: 'item-full_mp_potion',
        name: 'Elixir of Enlightenment',
        description: 'Restores 100% of your maximum MP',
        rarity: 7,
        price: 170,
        currency: 'currency-gold_coin',
        type: 'Consumables',
        subType: 'Restores MP',
        effect: { value: 1 }
    },
    ...generatePurifiersFromEffects(),
    {
        id: 'weapon-sword',
        name: 'Sword',
        type: 'Equipments',
        subType: 'Weapons',
        description: 'An ordinary sword',
        effects: [
            { type: 'MODIFIER', id: 'attack', value: 15, isDebuff: false },
            { type: 'MODIFIER', id: 'attackSpeed', value: 2000, isDebuff: true }
        ]
    },
    {
        id: 'weapon-rapier',
        name: 'Rapier',
        type: 'Equipments',
        subType: 'Weapons',
        description: 'An ordinary rapier',
        effects: [
            { type: 'MODIFIER', id: 'attack', value: 2, isDebuff: false },
            { type: 'MODIFIER', id: 'attackSpeed', value: -1000, isDebuff: false },
            { type: 'EFFECT', id: 'effect-poisoned', value: 0.9, usage: "ON_ATTACK", target: "ENEMY", isDebuff: false }
        ]
    },
    {
        id: 'armor-light',
        name: 'Light Armor',
        type: 'Equipments',
        subType: 'Armors',
        description: 'An ordinary light armor',
        effects: [
            { type: 'MODIFIER', id: 'defense', value: 3 }
        ]
    },
];

//@title RECIPES
export const recipes = [];

//@title LOOT TABLES
export const lootTables = {
    MUTANT: [
        { id: "currency-gold_coin", quantity: 2, chance: 50 }
    ],
    ANOMALY: [
        { id: "currency-gold_coin", quantity: 5, chance: 40 }
    ],
    UNDEAD: [
        { id: "currency-gold_coin", quantity: 3, chance: 60 }
    ],
    PLAGUED: [
        { id: "currency-gold_coin", quantity: 1, chance: 30 }
    ],
    CHEST: [
        { id: "item-small_hp_potion", quantity: 1, chance: 80 },
        { id: "item-small_hp_potion", quantity: 1, chance: 20 },
        { id: "currency-gold_coin", quantity: 1, chance: 100 },
        { id: "currency-gold_coin", quantity: 5, chance: 85 },
        { id: "currency-gold_coin", quantity: 3, chance: 65 }
    ]
};
