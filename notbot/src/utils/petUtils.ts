import db from '../database/db';

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
}

// Stats decrease per hour
const DECAY_RATES = {
    HUNGER: 10,
    THIRST: 15,
    ENERGY: 5,
    ENERGY_PENALTY: 20, // Extra energy decay if hungry/thirsty
    HEALTH_PENALTY: 10 // Health decay if no energy
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
    const lastUpdate = pet.last_updated || now;
    const diffMs = now - lastUpdate;
    const hoursPassed = diffMs / (1000 * 60 * 60);

    if (hoursPassed < 0.1) return pet; // Only update if > 6 mins have passed to save DB calls? 
    // Actually, calculate exact decay based on float hours

    let { hunger, thirst, energy, health } = pet;

    // 1. Decay Hunger & Thirst
    hunger = Math.max(0, hunger - (DECAY_RATES.HUNGER * hoursPassed));
    thirst = Math.max(0, thirst - (DECAY_RATES.THIRST * hoursPassed));

    // 2. Decay Energy
    let energyDecay = DECAY_RATES.ENERGY;
    if (hunger < 20 || thirst < 20) {
        energyDecay += DECAY_RATES.ENERGY_PENALTY;
    }
    energy = Math.max(0, energy - (energyDecay * hoursPassed));

    // 3. Decay Health (if Energy is 0)
    if (energy <= 0) {
        health = Math.max(0, health - (DECAY_RATES.HEALTH_PENALTY * hoursPassed));
    }

    // Apply updates
    await db.execute({
        sql: `UPDATE pets SET 
                hunger = ?, thirst = ?, energy = ?, health = ?, last_updated = ?
              WHERE user_id = ?`,
        args: [Math.floor(hunger), Math.floor(thirst), Math.floor(energy), Math.floor(health), now, userId]
    });

    return { ...pet, hunger, thirst, energy, health, last_updated: now };
};

export const isPetDead = (pet: Pet): boolean => {
    return pet.health <= 0;
};
