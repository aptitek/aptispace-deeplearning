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
Autoencodeur : Compression / Décompression
 -> VAE (Variational Autoencoder)
 -> VQ-VAE (Vector Quantized Variational Autoencoder)
 -> Débruitage
 -> Détection d'anomalie
GANs : Génération d'image
 -> Architecture GAN : 
    - Générateur (Fake) 
    - Discriminateur (Real/Fake)
    - Equilibre de Nash

    Architectures GAN avancées : DCGAN, StyleGAN et Conditional GAN

---
    
Transformateurs : Traitement du langage naturel
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

---


Espace latent :
- Compression 
- Décompression
- Transfer learning

Policy Gradient : 
 - Monte-carlo
 - G(s,a)
 - Q(s,a)
 - V(s)
 - D(s,a) (Discr)
 - D(s,a) (Cont)

SAC


(Tokenisation, Word Embedding, Positional Encoding, Attention)

BoW, TF-IDF, Word2Vec, GloVe, FastText, ELMo ?

VGG -> EfficientNet -> Vision Transformer
ResNet ->  ?

DQN -> A2C -> PPO -> SAC

RLHF

Alligner LLM avec les objectifs humains

Fine-tuning : 
 - Pré-entrainement 
 - Fine-tuning

DDPM (Denoising Diffusion Probabilistic Model) : Modèle probabiliste de débruitage

Graph Neural Networks : GNN
 -> GraphSAGE
 -> GAT (Graph Attention Network)
 -> GCN (Graph Convolutional Network)
 -> GNN + Autoencodeur

Capsule Network :
 -> Émergence d'une nouvelle forme d'intelligence artificielle, plus performante et polyvalente.

DCGAN

Transfer Learning :
 - Transfert d'apprentissage (Réutilisation des connaissances)
 
YOLO

---

Prompt Engineering / Retrieval Augmented Generation : RAG / Langchain / MCP, etc