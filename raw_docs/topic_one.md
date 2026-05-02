  # Transformer Architecture


## Overview
The Transformer is a deep learning architecture introduced in "Attention Is All
You Need" (Vaswani et al., 2017). It replaced recurrent networks with a
self-attention mechanism, enabling parallel training and better long-range
dependency modelling.


## Key Components
- **Multi-Head Self-Attention**: Computes attention in h parallel heads, each
    with its own learned Q/K/V projections, then concatenates and projects.
- **Feed-Forward Network (FFN)**: Two linear layers with a ReLU activation,
    applied position-wise.
- **Positional Encoding**: Sinusoidal or learned embeddings that inject
    sequence-order information, since attention is permutation-invariant.
- **Layer Normalisation**: Applied before (Pre-LN) or after (Post-LN) each
    sub-layer, stabilising gradients.
- **Residual Connections**: Added around each sub-layer to ease gradient flow.


## Encoder vs Decoder
The encoder stack processes input tokens bidirectionally (e.g. BERT).
The decoder stack uses causal (masked) attention over previous outputs plus
cross-attention over encoder outputs (e.g. GPT, T5).


## Scaling Laws
Kaplan et al. (2020) showed that model loss decreases predictably as a power
law with compute, data, and parameter count. This motivated GPT-3 (175B) and
subsequent large language models.


## Limitations
- Quadratic complexity in sequence length: O(n^2)
- No inherent recurrence -> long-context challenges
- High memory footprint during training


## References
Vaswani et al. (2017). Attention Is All You Need. NeurIPS.
Kaplan et al. (2020). Scaling Laws for Neural Language Models. arXiv:2001.08361.