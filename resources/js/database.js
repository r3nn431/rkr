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
            id: `potion-cure_${effect.id.replace('effect-', '')}`,
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
    //@subtitle Miscellaneous
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
        id: 'valuable-diamond',
        name: 'Diamond',
        description: "A very rare gemstone. Sell for 500 gold coins.",
        price: 500,
        type: 'Miscellaneous',
        subType: 'Valuables'
    },
    //@subtitle Consumables
    {
        id: 'potion-small_hp',
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
        id: 'potion-medium_hp',
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
        id: 'potion-full_hp',
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
        id: 'potion-small_mp',
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
        id: 'potion-medium_mp',
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
        id: 'potion-full_mp',
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
        id: 'potion-curse_dispel',
        name: 'Curse Dispel Potion',
        description: 'Removes a random curse from you',
        type: 'Consumables',
        subType: 'Purifiers',
        effect: { type: 'CURSE' }
    },
    {
        id: 'potion-strange',
        name: 'Strange Potion',
        description: 'A failed potion with unpredictable effects',
        type: 'Consumables',
        subType: 'Enhancers'
    },
    {
        id: 'potion-reset_ap',
        name: 'Potion of Doubt',
        description: 'Resets all your attributes to 1 and gives your points back',
        type: 'Consumables',
        subType: 'Enhancers'
    },
    {
        id: 'scroll-teleport',
        name: 'Teleport Scroll',
        description: 'Teleports you further into the dungeon ending your current battle',
        type: 'Consumables',
        subType: 'Scrolls',
        rarity: 3,
        price: 50,
        currency: 'currency-gold_coin',
        effect: { type: 'TELEPORT', usage: 'ANY' }
    },
    {
        id: 'scroll-summon_seller',
        name: 'Summon Seller Scroll',
        description: 'If not in a battle, summons the Goblin Salesman',
        type: 'Consumables',
        subType: 'Scrolls',
        rarity: 1,
        price: 30,
        currency: 'currency-gold_coin',
        effect: { type: 'SUMMON_ID', list: 'events', id: 'event-seller', usage: 'SAFE' }
    },
    {
        id: 'scroll-summon_mutant',
        name: 'Summon Mutant Scroll',
        description: 'If not in a battle, summons a mutant enemy',
        type: 'Consumables',
        subType: 'Scrolls',
        rarity: 1,
        price: 15,
        currency: 'currency-gold_coin',
        effect: { type: 'SUMMON_TYPE', list: 'enemies', id: 'MUTANT', usage: 'SAFE' }
    },
    //@subtitle Equipments
    {
        id: 'acessory-amulet_const',
        name: 'Amulet of Constitution',
        type: 'Equipments',
        subType: 'Accessories',
        description: 'Increases your constitution by 5 points',
        effects: [
            { type: 'MODIFIER', id: 'constitution', value: 5, isDebuff: false }
        ]
    },
    {
        id: 'weapon-basic_sword',
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
        id: 'weapon-dagger',
        name: 'Dagger',
        type: 'Equipments',
        subType: 'Weapons',
        description: 'An ordinary dagger',
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
    //@subtitle Resources
    {
        id: 'resource-soul_residue',
        name: 'Soul Residue',
        description: 'A fragment of a fallen enemy\'s soul',
        type: "Resources",
        subType: "Common"
    },
    {
        id: 'resource-bone_fragment',
        name: 'Bone Fragment',
        description: 'A fragment of bone from a fallen enemy',
        type: "Resources",
        subType: "Common"
    },
    {
        id: 'resource-toxic_gland',
        name: 'Toxic Gland',
        description: 'A poisonous gland extracted from a venomous creature',
        type: "Resources",
        subType: "Common"
    },
    {
        id: 'resource-rags',
        name: 'Rags',
        description: 'Pieces of clothing',
        type: "Resources",
        subType: "Common"
    },
    {
        id: 'resource-iron_ore',
        name: 'Iron Ore',
        description: 'A chunk of unrefined iron ore',
        type: "Resources",
        subType: "Common"
    },
    {
        id: 'resource-mystic_shard',
        name: 'Mystic Shard',
        description: 'A crystal shard imbued with arcane energy',
        type: "Resources",
        subType: "Rare",
        rarity: 5,
        price: 60,
        currency: 'currency-gold_coin'
    },
    {
        id: 'resource-honey',
        name: 'Honey',
        description: 'A sweet honey produced by bees',
        type: "Resources",
        subType: "Rare",
        rarity: 7,
        price: 160,
        currency: 'currency-gold_coin'
    }
];

//@title RECIPES
export const recipes = [
    //@subtitle Alchemy - Mixtures
    {
        id: "mixture-small_hp",
        skill: "alchemy",
        skillLevel: 1,
        ingredients: [
            { id: "resource-toxic_gland", quantity: 1 }
        ],
        result: "potion-small_hp",
        failure: "potion-strange"
    },
    {
        id: "mixture-minor_mp",
        skill: "alchemy",
        skillLevel: 2,
        ingredients: [
            { id: "resource-mystic_shard", quantity: 1 }
        ],
        result: "potion-small_mp",
        failure: "potion-strange"
    },
    //@subtitle Craftsmanship - Crafting
    {
        id: "craft-basic_sword",
        skill: "craftsmanship",
        skillLevel: 1,
        ingredients: [
            { id: "resource-iron_ore", quantity: 3 }
        ],
        result: "weapon-basic_sword",
        failure: "resource-iron_ore"
    }
];

//@title LOOT TABLES
export const lootTables = {
    MUTANT: [
        { id: "resource-bone_fragment", quantity: 1, chance: 100 }
    ],
    ANOMALY: [
        { id: "resource-soul_residue", quantity: 1, chance: 100 },
        { id: "resource-mystic_shard", quantity: 1, chance: 5 }
    ],
    UNDEAD: [
        { id: "resource-bone_fragment", quantity: 1, chance: 100 },
        { id: "resource-bone_fragment", quantity: 1, chance: 60 },
        { id: "resource-rags", quantity: 1, chance: 40 },
    ],
    PLAGUED: [
        { id: "currency-gold_coin", quantity: 1, chance: 30 }
    ],
    CHEST: [
        { id: "potion-small_hp", quantity: 1, chance: 80 },
        { id: "potion-small_hp", quantity: 1, chance: 20 },
        { id: "currency-gold_coin", quantity: 1, chance: 100 },
        { id: "currency-gold_coin", quantity: 5, chance: 85 },
        { id: "currency-gold_coin", quantity: 3, chance: 65 }
    ]
};
