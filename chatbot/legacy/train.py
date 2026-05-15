import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, LSTM, Dense, Embedding
from tensorflow.keras.callbacks import ModelCheckpoint

# ── 데이터 불러오기 ────────────────────────
questions = np.load("data/questions.npy")
answers   = np.load("data/answers.npy")
vocab     = np.load("data/vocab.npy", allow_pickle=True).item()

vocab_size = len(vocab)
max_len    = 30
embed_dim  = 64
lstm_units = 128

print(f"학습 데이터 수: {len(questions)}")
print(f"어휘 사전 크기: {vocab_size}")

# ── 입력/정답 데이터 준비 ──────────────────
# Decoder 입력: 답변 앞부분 (첫 글자 ~ 끝에서 1개 전)
decoder_input  = answers[:, :-1]
# Decoder 정답: 답변 뒷부분 (두 번째 글자 ~ 끝)
decoder_target = answers[:, 1:]

# ── 모델 구성 ─────────────────────────────
encoder_inputs = Input(shape=(max_len,))
enc_emb        = Embedding(vocab_size, embed_dim)(encoder_inputs)
_, state_h, state_c = LSTM(lstm_units, return_state=True)(enc_emb)
encoder_states = [state_h, state_c]

decoder_inputs = Input(shape=(max_len - 1,))
dec_emb        = Embedding(vocab_size, embed_dim)(decoder_inputs)
decoder_lstm   = LSTM(lstm_units, return_sequences=True, return_state=True)
dec_out, _, _  = decoder_lstm(dec_emb, initial_state=encoder_states)
decoder_dense  = Dense(vocab_size, activation="softmax")
decoder_outputs = decoder_dense(dec_out)

model = Model([encoder_inputs, decoder_inputs], decoder_outputs)
model.compile(
    optimizer="adam",
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)

# ── 학습 ──────────────────────────────────
print("\n학습 시작...")

# 가장 좋은 모델 자동 저장
checkpoint = ModelCheckpoint(
    "saved_model/best_model.keras",
    monitor="loss",
    save_best_only=True,
    verbose=1
)

import os
os.makedirs("saved_model", exist_ok=True)

history = model.fit(
    [questions, decoder_input],
    decoder_target,
    epochs=300,
    batch_size=32,
    validation_split=0.1,
    callbacks=[checkpoint],
    verbose=1
)

# ── 최종 모델 저장 ─────────────────────────
model.save("saved_model/final_model.keras")
np.save("saved_model/vocab.npy", vocab)

print("\n학습 완료!")
print(f"최종 loss: {history.history['loss'][-1]:.4f}")
print(f"최종 accuracy: {history.history['accuracy'][-1]:.4f}")