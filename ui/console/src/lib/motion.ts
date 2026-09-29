/** Motion curves shared by JS-driven animation (motion/react). The CSS side has the same
 * enter curve as `--ease-out-expo` in index.css; keep the two in step. */

/** Fast start, long settle - for things arriving. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** Gentle both ends and quicker than the enter - for things leaving, which should never
 * hold the eye longer than they took to arrive. */
export const EASE_EXIT = [0.4, 0, 0.6, 1] as const;
