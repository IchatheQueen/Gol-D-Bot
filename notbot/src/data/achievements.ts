export interface Achievement {
    id: string;
    name: string;
    description: string;
    emoji: string;
    hidden?: boolean;
}

export const ACHIEVEMENTS: Record<string, Achievement> = {
    // Economy
    'first_pay': { id: 'first_pay', name: 'Philanthropist', description: 'Give money to another user.', emoji: '💸' },
    'millionaire': { id: 'millionaire', name: 'Millionaire', description: 'Have 1,000,000 credits in your wallet.', emoji: '💰' },
    'billionaire': { id: 'billionaire', name: 'Billionaire', description: 'Have 1,000,000,000 credits in your wallet.', emoji: '🏦' },

    // Social
    'married': { id: 'married', name: 'Bound for Life', description: 'Get married.', emoji: '💍' },
    'recruiter': { id: 'recruiter', name: 'Puppet Master', description: 'Recruit another user.', emoji: '🧵' },

    // Combat / Interactive
    'killer': { id: 'killer', name: 'Cold Blooded', description: 'Kill another user or pet.', emoji: '💀' },
    'hunter': { id: 'hunter', name: 'Survivalist', description: 'Successfully hunt for food.', emoji: '🏹' },
    'trained': { id: 'trained', name: 'Gym Rat', description: 'Train your pet.', emoji: '💪' },

    // Collection
    'collector': { id: 'collector', name: 'Hoarder', description: 'Have 10 different items in your inventory.', emoji: '🎒' }
};
