FROM python:3.11-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    SGA_DATA_DIR=/app/data \
    SGA_IMAGES_DIR=/app/images \
    SGA_PUBLIC_HOST=localhost:8324

COPY src/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY src/app.py /app/app.py
COPY src/ui/ /app/ui/
COPY src/game/ /app/game/

EXPOSE 8324

# Daten + Bilder werden per Volume eingebunden (siehe docker-compose.yml)
VOLUME ["/app/data", "/app/images"]

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8324"]
