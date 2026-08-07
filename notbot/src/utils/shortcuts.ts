// Shortcuts utility for processing command arguments

import { expandDigitShorthand } from './bigNumbers';

export function processShortcuts(args: string[], userId: string): string[] {
    return args.map(arg => {
        // Number shortcuts with & (e.g., 1&5 = 10000, 123456&10 = 1234560000).
        // Shares one BigInt implementation with parseBigNumber so the two can
        // no longer disagree, and so huge inputs don't degrade into "1e+24".
        if (arg.includes('&')) {
            const expanded = expandDigitShorthand(arg);
            if (expanded !== null) {
                return expanded.toString();
            }
        }

        // "All" phrases
        const allPhrases: { [key: string]: string } = {
            'allmoney': 'all',
            'allbeer': 'all_beer',
            'allweed': 'all_weed',
            'allopioid': 'all_opioid',
            'allopi': 'all_opioid',
            'allster': 'all_steroid',
            'allcan': 'all_cannabis',
            'allcot': 'all_cotton',
            'alllin': 'all_linen',
        };

        const lowerArg = arg.toLowerCase();
        if (allPhrases[lowerArg]) {
            return allPhrases[lowerArg];
        }

        // Player shortcuts
        if (lowerArg === 'myid') {
            return userId;
        }

        // Cat stat shortcuts (first 3 letters)
        const statShortcuts: { [key: string]: string } = {
            'str': 'strength',
            'agi': 'agility',
            'int': 'intellect',
            'end': 'endurance',
            'met': 'metabolism',
            'pot': 'potency',
        };

        if (statShortcuts[lowerArg]) {
            return statShortcuts[lowerArg];
        }

        // Consumable shortcuts
        const consumableShortcuts: { [key: string]: string } = {
            'c': 'coffee',
            'opi': 'opioid',
            'ster': 'steroid',
            'ene': 'energy_drink',
            'p': 'pill',
        };

        if (consumableShortcuts[lowerArg]) {
            return consumableShortcuts[lowerArg];
        }

        return arg;
    });
}
