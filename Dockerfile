FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip python3-venv \
  && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY package.json package-lock.json ./
RUN npm ci

COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip \
  && pip install --no-cache-dir -r requirements.txt

COPY . .

ENV NODE_ENV=production
ENV PYTHONUTF8=1
ENV PYTHONIOENCODING=utf-8

RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npm run start -- --hostname 0.0.0.0 --port ${PORT:-3000}"]
