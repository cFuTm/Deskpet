<<<<<<< HEAD
/// <reference types="vite/client" />

declare module "*.png" {
    const src: string;
    export default src;
}

declare module "*.jpg" {
    const src: string;
    export default src;
}

declare module "*.jpeg" {
    const src: string;
    export default src;
}

declare module "*.svg" {
    const src: string;
    export default src;
=======
// src/vite-env.d.ts 或 src/global.d.ts

declare module "*.png" {
    const value: string;
    return value;
}

declare module "*.jpg" {
    const value: string;
    return value;
}

declare module "*.jpeg" {
    const value: string;
    return value;
}

declare module "*.svg" {
    const value: string;
    return value;
>>>>>>> be28e4a7ac11de98be10fbbbab996f6970242706
}