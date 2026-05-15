FROM python:3.11-slim
WORKDIR /app

RUN pip install --no-cache-dir flask flask-cors requests rapidfuzz numpy scikit-learn transformers
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

COPY . .

EXPOSE 5000
CMD ["python", "-m", "flask", "run", "--host=0.0.0.0", "--port=5000"]
