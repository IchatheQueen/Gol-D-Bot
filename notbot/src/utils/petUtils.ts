import db from '../database/db';
import { getInventoryItem, removeInventoryItem } from '../database/inventory';

export interface Pet {
    user_id: string;
    name: string;
    health: number;
    max_health: number;
    hunger: number;
    thirst: number;
    energy: number;
    happiness: number;
    level: number;
    experience: number;
    credits: number;
    strength: number;
    agility: number;
    intellect: number;
    endurance: number;
    metabolism: number;
    skin_id: number;
    last_updated: number;
    boostedStrength?: number;
    boostedAgility?: number;
    boostedIntellect?: number;
    boostedEndurance?: number;
}

// Stats decrease per hour
const DECAY_RATES = {
    HUNGER: 10,
    THIRST: 15,
    ENERGY: 5,
    ENERGY_PENALTY: 20, // Extra energy decay if hungry/thirsty
    HEALTH_PENALTY: 10 // Health decay if no energy
};

export interface PetBuff {
    stat: string;
    multiplier: number;
    expires_at: number;
}

export const getPetBuffs = async (userId: string): Promise<PetBuff[]> => {
    const now = Date.now();
    const result = await db.execute({
        sql: 'SELECT * FROM pet_buffs WHERE user_id = ? AND expires_at > ?',
        args: [userId, now]
    });
    return (result.rows as any[]).map(row => ({
        stat: row.stat,
        multiplier: row.multiplier,
        expires_at: row.expires_at
    }));
};

export const getPet = async (userId: string): Promise<Pet | undefined> => {
    const result = await db.execute({
        sql: 'SELECT * FROM pets WHERE user_id = ?',
        args: [userId]
    });
    return result.rows[0] as any;
};

export const updatePetStats = async (userId: string): Promise<Pet | undefined> => {
    let pet = await getPet(userId);
    if (!pet) return undefined;

    const now = Date.now();
    const lastUpdate = pet.last_updated || (now - 1000);
    const diffMs = now - lastUpdate;
    const hoursPassed = diffMs / (1000 * 60 * 60);

    let { hunger, thirst, energy, health } = pet;

    // 1. Decay Hunger & Thirst (No strict upper clamp, but floor at 0)
    hunger = Math.max(0, hunger - (DECAY_RATES.HUNGER * hoursPassed));
    thirst = Math.max(0, thirst - (DECAY_RATES.THIRST * hoursPassed));

    // 2. Decay Energy
    let energyDecay = DECAY_RATES.ENERGY;
    if (hunger < 20 || thirst < 20) {
        energyDecay += DECAY_RATES.ENERGY_PENALTY;
    }
    energy = Math.max(0, Math.min(100, energy - (energyDecay * hoursPassed)));

    // 3. Decay Health (if Energy is 0)
    if (energy <= 0) {
        health = Math.max(0, health - (DECAY_RATES.HEALTH_PENALTY * hoursPassed));
    }

    // 4. Auto-Feeder Logic
    if (hunger < 20) {
        const hasFeeder = await getInventoryItem(userId, 'auto_feeder');
        if (hasFeeder > 0n) {
            const foodCount = await getInventoryItem(userId, 'cat_food');
            if (foodCount > 0n) {
                hunger += 20; // Allow stacking above 100
                await removeInventoryItem(userId, 'cat_food', 1n);
            }
        }
    }

    // Apply updates
    await db.execute({
        sql: `UPDATE pets SET 
                hunger = ?, thirst = ?, energy = ?, health = ?, last_updated = ?
              WHERE user_id = ?`,
        args: [Math.floor(hunger), Math.floor(thirst), Math.floor(energy), Math.floor(health), now, userId]
    });

    const boosters = await getPetBuffs(userId);
    const applyBuff = (val: number, stat: string) => {
        const buff = boosters.find(b => b.stat === stat);
        return buff ? Math.floor(val * buff.multiplier) : val;
    };

    return {
        ...pet,
        hunger, thirst, energy, health, last_updated: now,
        boostedStrength: applyBuff(pet.strength, 'strength'),
        boostedAgility: applyBuff(pet.agility, 'agility'),
        boostedIntellect: applyBuff(pet.intellect, 'intellect'),
        boostedEndurance: applyBuff(pet.endurance, 'endurance')
    } as any;
};

export const addPetBuff = async (userId: string, stat: string, multiplier: number, durationMs: number) => {
    const expiresAt = Date.now() + durationMs;
    await db.execute({
        sql: 'INSERT OR REPLACE INTO pet_buffs (user_id, stat, multiplier, expires_at) VALUES (?, ?, ?, ?)',
        args: [userId, stat, multiplier, expiresAt]
    });
};

export const isPetDead = (pet: Pet): boolean => {
    return pet.health <= 0;
};
