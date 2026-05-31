Supervisé :
 Régression / Classification
Non supervisé :
 PCA / Clustering

 Supervisé : RNN, CNN
 Non supervisé : Auto-encodeur, GANS, Transformateurs

Coefficients vs Poids Modifié par rapport au gradient

Descente de gradient | Optimiseurs : Adam / RMSprop / Momentum / AdaGrad

Biais / Variance 
 surapprentissage / sous-apprentissage

Regularisation -> Généralisation
Ridge / Lasso / ElasticNet

Augmentation de données (Image) :
 - Rotation
 - Zoom
 - Déformation
 - Recadrage
 - Ajout de bruit
 - Changement de contraste


--- 

Réseau de neurones : 
 
Forme du réseau : 
- Couches d'entrées 
- Couches cachées 
- Couches de sortie 

Anatomie du neurone artificiel : 
 - Poids
 - Biais
 - Fonction d'activation

Propagation avant :
 - Sommation Pondérée
 - Fonction d'activation

Propagation arrière :
 - Calcul de l'erreur 
 - Backpropagation

Fonctions d'activation :
 - Sigmoïde
 - Tanh
 - ReLU
 - Softmax

Vanishing gradient:
 - Dérivée > 1 : Gradient EXPLOSIF
 - Dérivée < 1 : Gradient DISPARAISSANT
 Solution : ReLU / LSTM / Normalisation / Initialisation 
 GRU ????

---

MLP : Par défaut 
RNN : Pile de feuilles / Dongons/ Magasin avec trésorerie
CNN : Convolution(Filtres) / Pooling(Sous-échantillonage) / Classification(MLP)
        -> Configuration Spatiale
        -> Évolution : VGG -> ResNet -> EfficientNet -> Vision Transformer
        -> Applications : YOLO (Détection d'objets en temps réel)
        -> Capsule Network : alternative au CNN, sensible aux relations spatiales

Autoencodeur : Espace latent (Compression / Décompression)
 -> VAE (Variational Autoencoder)
 -> VQ-VAE (Vector Quantized Variational Autoencoder)
 -> Débruitage
 -> Détection d'anomalie

Transfer Learning : Réutilisation de l'espace latent appris
 -> Pré-entrainement sur large corpus, adaptation sur tâche cible

Modèles génératifs :
GANs : Génération d'image
 -> Architecture GAN : 
    - Générateur (Fake) 
    - Discriminateur (Real/Fake)
    - Equilibre de Nash

    Architectures GAN avancées : DCGAN, StyleGAN et Conditional GAN

DDPM (Denoising Diffusion Probabilistic Model) : Débruitage probabiliste itératif

Graph Neural Networks : GNN
 -> GCN (Graph Convolutional Network)
 -> GAT (Graph Attention Network)
 -> GraphSAGE
 -> GNN + Autoencodeur

---
    
Transformateurs : Traitement du langage naturel

Représentations de texte (précurseurs) :
 BoW, TF-IDF -> Word2Vec, GloVe, FastText -> ELMo (contextualisé)

Pipeline : Tokenisation -> Word Embedding -> Positional Encoding -> Attention

 -> Embedding
 -> Positional encoding
    -> Sinusoidale 
    -> BERT (Embeddings appris)
    -> RoPE (Rotation Positional Encoding)
    -> ALiBi (Attention with Linear Biases)

 -> Bloc Attention
    -> Attention : {Q, K, V} (Matrice de pertinence)
    -> Normalisation ( stabilise le gradient Moyenne 0 Variance 1)
    -> MLP
    -> Connectivité résiduelle

Fine-tuning LLM :
 - Pré-entrainement (sur large corpus)
 - Fine-tuning (sur tâche spécifique)

---

Apprentissage par renforcement (RL) :

Policy Gradient :
 - Monte-Carlo : estimation empirique du retour G(s,a)
 - G(s,a) : retour total actualisé
 - Q(s,a) : valeur action-état
 - V(s) : valeur d'état
 - D(s,a) Discret / D(s,a) Continu : avantage (advantage)

Progression : DQN -> A2C -> PPO -> SAC
 -> SAC (Soft Actor-Critic) : maximise récompense + entropie (exploration)

RLHF : Aligner LLM avec les objectifs humains (via PPO sur feedback humain)

---

Prompt Engineering / Retrieval Augmented Generation : RAG / Langchain / MCP, etc
