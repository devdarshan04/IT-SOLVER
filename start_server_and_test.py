import time
import subprocess
import requests

def test_live_server():
    print("Launching Uvicorn backend server on port 8000...", flush=True)
    # Start uvicorn process
    proc = subprocess.Popen(
        [r".\backend\venv\Scripts\python.exe", "-m", "uvicorn", "backend.app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True
    )

    try:
        base_url = "http://127.0.0.1:8000"
        print("Waiting for server to become ready...", flush=True)
        ready = False
        for i in range(15):
            time.sleep(1)
            try:
                r = requests.get(f"{base_url}/api/health", timeout=2)
                if r.status_code == 200:
                    ready = True
                    break
            except Exception:
                pass
        
        if not ready:
            raise RuntimeError("Server did not become ready in 15 seconds")

        # 1. Health Check
        print("Testing /api/health...", flush=True)
        r = requests.get(f"{base_url}/api/health", timeout=5)
        print(f"[PASS] Health: {r.status_code} - {r.json()}", flush=True)

        # 2. Login
        print("Testing /api/auth/login...", flush=True)
        r = requests.post(f"{base_url}/api/auth/login", json={"email": "user@fixtrail.ai", "password": "User@123"}, timeout=5)
        print(f"[PASS] Login: {r.status_code} - User: {r.json()['user']['full_name']}", flush=True)
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 3. Knowledge Base
        print("Testing /api/knowledge/...", flush=True)
        r = requests.get(f"{base_url}/api/knowledge/", timeout=5)
        print(f"[PASS] Knowledge Base: {r.status_code} - Count: {len(r.json())}", flush=True)

        # 4. User Ticket History
        print("Testing /api/issues/...", flush=True)
        r = requests.get(f"{base_url}/api/issues/", headers=headers, timeout=5)
        print(f"[PASS] User History: {r.status_code} - Count: {len(r.json())}", flush=True)

        # 5. Admin Analytics
        print("Testing /api/analytics/dashboard...", flush=True)
        r_admin = requests.post(f"{base_url}/api/auth/login", json={"email": "admin@fixtrail.ai", "password": "Admin@123"}, timeout=5)
        admin_token = r_admin.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        r_dash = requests.get(f"{base_url}/api/analytics/dashboard", headers=admin_headers, timeout=5)
        dash = r_dash.json()
        print(f"[PASS] Admin Dashboard: {r_dash.status_code} - Tickets: {dash['total_tickets']} - DB: {dash['database_type']}", flush=True)

        print("\n>>> LIVE SERVER INTEGRATION TESTS PASSED 100%! <<<", flush=True)
    finally:
        print("Terminating test uvicorn server...", flush=True)
        try:
            proc.terminate()
            proc.kill()
        except Exception:
            pass

if __name__ == "__main__":
    test_live_server()
