// js/database.js
export const players = [
    {
        name: 'Hero',
        attack: 10,
        defense: 5,
        constituition: 10,
        strength: 5,
        dexterity: 5,
        intelligence: 5,
        luck: 5,
        criticalChance: 5, // 5%
        criticalDamage: 1.5, // 150%
        evasion: 5 
    }
];

export const enemies = [
    {
        id: "rat1",
        name: 'Rat',
        rarity: 80,
        list: "normal",
        xpReward: 8,
        hp: 80,
        attack: 20,
        defense: 3,
        ability: 'NONE',
        element: 'NONE',
        type: 'MUTANT',
        moveType: 'MIXED',
        moveSpeed: 90,
        attackSpeed: 3000,
        canEscape: true,
        escapeRate: 70,
        criticalChance: 5,
        criticalDamage: 1.2,
        accuracy: 80,
        evasion: 10,
        allowSwarm: true,
        canAttack: true,
        info: 'A common enemy here',
        img: [
            "rat.webp"
        ]
    }
];

export const events = [
    {
        id: "chest",
        rarity: 50,
        subEvents: [
            {
                id: "loot",
                rarity: 6
            },
            {
                id: "mimic",
                rarity: 1
            }
        ]
    },
    {
        id: "trap",
        rarity: 30
    },
    {
        id: 'enemy',
        rarity: 70
    }
]

export const items = [
    {
        value: 30,
        type: 'consumable',
        sprite: 'potion_red.png'
    }
];