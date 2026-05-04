import { atom } from "jotai";

// Global state for the current page index
export const pageAtom = atom(0);

// Global state for the pause animation
export const pauseAtom = atom(false);