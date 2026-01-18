import asyncio
import json
import os
import httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from miner_client import get_miner_client

# Persistence
DATA_FILE = "/data/miners.json"

class Miner(BaseModel):
    id: str
    ip: str
    type: str 
    status: str = "offline" 
    stats: dict = {}

class NetworkStats(BaseModel):
    price_usd: float = 0
    block_height: int = 0
    fees: dict = {} # fastestFee, halfHourFee, hourFee
    difficulty: float = 0
    mempool_tx_count: int = 0
    
miners_db = []
network_cache = NetworkStats()

def load_miners():
    global miners_db
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r') as f:
                data = json.load(f)
                miners_db = [Miner(**m) for m in data]
        except Exception:
            miners_db = []

def save_miners():
    with open(DATA_FILE, 'w') as f:
        json.dump([m.model_dump() for m in miners_db], f)

# Background Polling
async def poll_miners():
    while True:
        for miner in miners_db:
            client = get_miner_client(miner.type, miner.ip)
            if client:
                stats = await client.get_stats()
                miner.status = 'online' if stats.get('online') else 'offline'
                miner.stats = stats
        await asyncio.sleep(5)

async def poll_network_data():
    global network_cache
    async with httpx.AsyncClient() as client:
        while True:
            try:
                # 1. Price
                r_price = await client.get("https://mempool.space/api/v1/prices")
                price = r_price.json().get("USD", 0)
                
                # 2. Block Height / Tip
                r_blocks = await client.get("https://mempool.space/api/blocks/tip/height")
                height = int(r_blocks.text)
                
                # 3. Fees
                r_fees = await client.get("https://mempool.space/api/v1/fees/recommended")
                fees = r_fees.json()
                
                # 4. Mempool
                r_mem = await client.get("https://mempool.space/api/mempool")
                mempool_count = r_mem.json().get("count", 0)

                # 5. Difficulty (for odds)
                # Currently usually fetched from last block or specific endpoint
                # We can approximate or get from a block detail if needed, but for now let's assume a known recent value or fetch it.
                # https://mempool.space/api/v1/difficulty-adjustment
                r_diff = await client.get("https://mempool.space/api/v1/difficulty-adjustment")
                # This returns diff for *next* period usually, and current.
                # Let's take 'difficulty'
                diff_data = r_diff.json()
                difficulty = diff_data.get("difficulty", 1) # Current epoch diff

                network_cache = NetworkStats(
                    price_usd=price,
                    block_height=height,
                    fees=fees,
                    mempool_tx_count=mempool_count,
                    difficulty=difficulty
                )
            except Exception as e:
                print(f"Network Poll Error: {e}")
            
            await asyncio.sleep(60) # Poll every minute

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    if not os.path.exists("/data"):
        os.makedirs("/data", exist_ok=True)
    load_miners()
    task_miners = asyncio.create_task(poll_miners())
    task_network = asyncio.create_task(poll_network_data())
    yield
    # Shutdown
    task_miners.cancel()
    task_network.cancel()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class MinerCreate(BaseModel):
    ip: str
    type: str

@app.get("/api/miners")
def get_miners():
    return miners_db

@app.get("/api/network-stats")
def get_network_stats():
    return network_cache

@app.get("/api/odds")
def get_odds():
    # Calculate probabilities based on total hashrate
    total_hashrate_mh = sum([m.stats.get('hashrate', 0) for m in miners_db if m.status == 'online'])
    total_hashrate_h = total_hashrate_mh * 1e6
    
    if network_cache.difficulty == 0:
        return {"error": "No network data"}

    difficulty = network_cache.difficulty
    
    # Hashes to solve a block = Difficulty * 2^32
    hashes_per_block = difficulty * (2**32)
    
    # Expected time (seconds) = Hashes per block / Hashrate
    if total_hashrate_h > 0:
        seconds_to_block = hashes_per_block / total_hashrate_h
    else:
        seconds_to_block = 0
        
    # Probabilities (Poisson)
    # P(find block in time T) = 1 - e^(-Hashrate * T / HashesPerBlock)
    # Or simply: Hashrate * T / HashesPerBlock for small probs
    
    day_hashes = total_hashrate_h * 86400
    prob_day = day_hashes / hashes_per_block
    prob_month = day_hashes * 30 / hashes_per_block
    prob_year = day_hashes * 365 / hashes_per_block
    
    # Lottery Odds
    # Powerball Jackpot: 1 in 292,201,338
    # Mega Millions: 1 in 302,575,350
    powerball_odds = 1 / 292201338
    megamillion_odds = 1 / 302575350
    
    return {
        "time_to_block_seconds": seconds_to_block,
        "prob_day": prob_day,
        "prob_month": prob_month,
        "prob_year": prob_year,
        "lottery": {
            "powerball": powerball_odds,
            "megamillion": megamillion_odds,
            "comparison_msg": f"You are {prob_day / powerball_odds:.2f}x more likely to find a block today than win Powerball!" if prob_day > 0 else "Start mining to compare!"
        }
    }

@app.post("/api/miners")
def add_miner(miner: MinerCreate):
    import uuid
    new_miner = Miner(
        id=str(uuid.uuid4()),
        ip=miner.ip,
        type=miner.type
    )
    miners_db.append(new_miner)
    save_miners()
    return new_miner

@app.delete("/api/miners/{miner_id}")
def delete_miner(miner_id: str):
    global miners_db
    miners_db = [m for m in miners_db if m.id != miner_id]
    save_miners()
    return {"status": "success"}

# Serve Frontend Static Files
# In Docker, we will copy build output to /app/static
if os.path.exists("static"):
    app.mount("/", StaticFiles(directory="static", html=True), name="static")
