FROM python:3.10-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# System dependencies (kept minimal but safe for Django + PostgreSQL)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies first (better caching)
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . /app/

# ⚠️ IMPORTANT FIX:
# collectstatic should not fail build if static config is missing
RUN python manage.py collectstatic --noinput || true

# Expose port
EXPOSE 8000

# Run migrations + gunicorn (safer for Render deployment)
CMD ["sh", "-c", "python manage.py migrate && gunicorn breathe_esg.wsgi:application --bind 0.0.0.0:8000"]