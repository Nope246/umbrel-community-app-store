import asyncio
import json
import httpx
import socket

class MinerClient:
    def __init__(self, ip, port=None):
        self.ip = ip
        self.port = port
        self.stats = {}

    async def get_stats(self):
        raise NotImplementedError

class BitaxeClient(MinerClient):
    def __init__(self, ip, port=80):
        super().__init__(ip, port)

    async def get_stats(self):
        url = f"http://{self.ip}:{self.port}/api/system/info"
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                data = resp.json()
                
                hashrate_gh = data.get('hashRate', 0)
                power = data.get('power', 0) # Watts
                temp = data.get('temp', 0)
                best_diff = data.get('bestDiff', 0) # Assumed field, sometimes bestShare
                
                # Fallback API check if fields missing (older AxeOS)
                if best_diff == 0 and 'bestShare' in data:
                     best_diff = data['bestShare']

                return {
                    "online": True,
                    "hashrate": hashrate_gh * 1000, # MH/s
                    "power": power,
                    "temp": temp,
                    "best_diff": best_diff,
                    "raw": data
                }
        except Exception as e:
            return {"online": False, "error": str(e)}

class BraiinsClient(MinerClient):
    def __init__(self, ip, port=4028):
        super().__init__(ip, port)

    async def get_stats(self):
        # CGMiner API 'summary' command
        command = {"command": "summary"} # summary usually has difficulty info
        stats_cmd = {"command": "stats"} # stats often has better power info
        
        try:
            # Run blocking socket call in thread pool
            summary_resp = await asyncio.to_thread(self._socket_command, command)
            # stats_resp = await asyncio.to_thread(self._socket_command, stats_cmd) # Optional optimization
            
            if not summary_resp:
                return {"online": False, "error": "No response"}
            
            summary = summary_resp.get('SUMMARY', [{}])[0]
            
            hashrate_mhs = summary.get('MHS 5s', 0)
            temp = summary.get('Temperature', 0)
            best_diff = summary.get('Best Share', 0)
            
            # Power is tricky in CGMiner, sometimes missing or in different place
            # We will try to parse it, default to 0
            power = 0
            # Try to infer or check specific fields if available
            
            return {
                "online": True,
                "hashrate": hashrate_mhs, 
                "power": power, # Often needs custom API call or config
                "temp": temp,
                "best_diff": best_diff,
                "raw": summary
            }
        except Exception as e:
            return {"online": False, "error": str(e)}

    def _socket_command(self, cmd):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(3)
            s.connect((self.ip, self.port))
            s.sendall(json.dumps(cmd).encode('utf-8'))
            
            # Read response
            data = b""
            while True:
                chunk = s.recv(4096)
                if not chunk:
                    break
                data += chunk
                # Check for null terminator if applicable, but usually just JSON
                if data.strip().endswith(b'}'):
                     break
            
            s.close()
            # CGMiner returns invalid JSON often (concatenated), but usually single response is fine
            # It sends null byte at end sometimes
            clean_data = data.replace(b'\x00', b'').strip()
            return json.loads(clean_data)
        except Exception:
            return None

def get_miner_client(type, ip):
    if type == 'bitaxe':
        return BitaxeClient(ip)
    elif type == 'braiins':
        return BraiinsClient(ip)
    return None
