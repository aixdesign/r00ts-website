FROM python:3.15-alpine

WORKDIR /data

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1

RUN pip install --no-cache-dir peeringdb

RUN peeringdb config set -n

CMD ["peeringdb", "sync"]
