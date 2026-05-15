import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, LSTM, Dense, Embedding

# 저장된 전처리 데이터 불러오기
questions = np.load("data/questions.npy")
answers   = np.load("data/answers.npy")
vocab     = np.load("data/vocab.npy", allow_pickle=True).item()

vocab_size = len(vocab)
max_len    = 30
embed_dim  = 64
lstm_units = 128

print(f"어휘 사전 크기: {vocab_size}")
print(f"학습 데이터 수: {len(questions)}")

# ── Encoder ──────────────────────────────
encoder_inputs = Input(shape=(max_len,))
enc_emb        = Embedding(vocab_size, embed_dim)(encoder_inputs)
_, state_h, state_c = LSTM(lstm_units, return_state=True)(enc_emb)
encoder_states = [state_h, state_c]

# ── Decoder ──────────────────────────────
decoder_inputs = Input(shape=(max_len,))
dec_emb        = Embedding(vocab_size, embed_dim)(decoder_inputs)
decoder_lstm   = LSTM(lstm_units, return_sequences=True, return_state=True)
dec_out, _, _  = decoder_lstm(dec_emb, initial_state=encoder_states)
decoder_dense  = Dense(vocab_size, activation="softmax")
decoder_outputs = decoder_dense(dec_out)

# ── 모델 정의 ─────────────────────────────
model = Model([encoder_inputs, decoder_inputs], decoder_outputs)
model.compile(
    optimizer="adam",
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)

model.summary()
print("\n모델 설계 완료!")