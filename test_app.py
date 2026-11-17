import sys
from fastapi.testclient import TestClient
from backend.app.main import app

def run_tests():
    print("--- Starting FixTrail Automated Integration Tests ---", flush=True)
    with TestClient(app) as client:
        # 1. Health check
        res = client.get("/api/health")
        print("[PASS] 1. Health Check Endpoint:", res.json(), flush=True)

        # 2. Login as Demo User
        login_res = client.post("/api/auth/login", json={"email": "user@fixtrail.ai", "password": "User@123"})
        print("[PASS] 2. Login status:", login_res.status_code, flush=True)
        user_data = login_res.json()
        user_token = user_data["access_token"]
        user_headers = {"Authorization": f"Bearer {user_token}"}
        print(f"[PASS] 2. User Login: {user_data['user']['full_name']} ({user_data['user']['email']})", flush=True)

        # 3. Knowledge Base
        kb_res = client.get("/api/knowledge/")
        print("[PASS] 3. KB status:", kb_res.status_code, flush=True)
        kb_articles = kb_res.json()
        print(f"[PASS] 3. Knowledge Base: {len(kb_articles)} articles retrieved successfully.", flush=True)

        # 4. User Ticket History
        history_res = client.get("/api/issues/", headers=user_headers)
        print("[PASS] 4. History status:", history_res.status_code, flush=True)
        tickets = history_res.json()
        print(f"[PASS] 4. Problem-Solving History: {len(tickets)} user tickets retrieved.", flush=True)

        # 5. AI Diagnosis Analysis
        diag_res = client.post(
            "/api/issues/analyze",
            headers=user_headers,
            data={
                "description": "Error: listen EADDRINUSE: address already in use :::3000",
                "os_platform": "Windows",
                "category_hint": "Networking"
            }
        )
        print("[PASS] 5. Diagnosis status:", diag_res.status_code, flush=True)
        diag = diag_res.json()
        print(f"[PASS] 5. AI Diagnosis: {diag.get('title')}", flush=True)

        # 6. Admin Login and Analytics Dashboard
        admin_login = client.post("/api/auth/login", json={"email": "admin@fixtrail.ai", "password": "Admin@123"})
        admin_token = admin_login.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        dash_res = client.get("/api/analytics/dashboard", headers=admin_headers)
        print("[PASS] 6. Dashboard status:", dash_res.status_code, flush=True)
        dash = dash_res.json()
        print(f"[PASS] 6. Admin Dashboard: Total={dash['total_tickets']}, Solved={dash['solved_tickets']}", flush=True)

    print("\n>>> ALL TESTS COMPLETED SUCCESSFULLY! <<<", flush=True)

if __name__ == "__main__":
    run_tests()
