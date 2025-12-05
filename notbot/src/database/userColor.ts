import db from './db';

const DEFAULT_COLOR = '#39C5BB';

export function getUserColor(userId: string): number {
    return parseInt(DEFAULT_COLOR.replace('#', ''), 16);
}
