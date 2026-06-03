// ==========================================
// index.js — Public API Barrel
// Single re-export point for all platform utilities.
// This file is the public entry point loaded by Quarto.
// ==========================================

export * from "./core/core.js";
export * from "./core/networks.js";
export * from "./core/plots.js";

export * from "./components/card.js";
export * from "./components/dynamic-svg.js";
export * from "./components/lever.js";
export * from "./components/token-stream.js";

export * from "./simulations/activation.js";
export * from "./simulations/augmentation.js";
export * from "./simulations/autoencoder.js";
export * from "./simulations/bow-tfidf.js";
export * from "./simulations/convolution.js";
export * from "./simulations/diffusion.js";
export * from "./simulations/gan.js";
export * from "./simulations/gradient-descent.js";
export * from "./simulations/kl-divergence.js";
export * from "./simulations/learning-curves.js";
export * from "./simulations/lora.js";
export * from "./simulations/mobo.js";
export * from "./simulations/neuron.js";
export * from "./simulations/positional-encoding.js";
export * from "./simulations/ram.js";
export * from "./simulations/regularization.js";
export * from "./simulations/reparam.js";
export * from "./simulations/word-embeddings.js";
