# 1. Start with a Python 3.11 base image for the FastAPI API
FROM python:3.11-slim

# 2. Install Bun (JavaScript runtime) for the ElizaOS agents
RUN apt-get update && apt-get install -y curl unzip
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# 3. Setup work directory
WORKDIR /app/backend

# 4. Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Install Bun dependencies
COPY package.json .
COPY bun.lock .
RUN bun install

# 6. Copy the entire project structure
COPY . .

# 7. Expose the FastAPI port
EXPOSE 8000

# 8. Start the FastAPI server (which orchestrates the agents)
CMD ["python", "python/main.py"]
