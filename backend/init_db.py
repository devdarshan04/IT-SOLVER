import json
import logging
from backend.app.core.database import SessionLocal, engine, Base, ACTIVE_DB_TYPE
from backend.app.core.security import hash_password
from backend.app.models.models import User, IssueTicket, KnowledgeArticle, SystemSetting

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("init_db")

def seed_database():
    logger.info(f"Connecting to database ({ACTIVE_DB_TYPE}) and creating tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Create Default Users
        admin = db.query(User).filter(User.email == "admin@fixtrail.ai").first()
        if not admin:
            admin = User(
                email="admin@fixtrail.ai",
                full_name="Alex Mercer (Admin)",
                hashed_password=hash_password("Admin@123"),
                role="admin",
                is_active=True
            )
            db.add(admin)
            logger.info("Created Admin user: admin@fixtrail.ai / Admin@123")

        user = db.query(User).filter(User.email == "user@fixtrail.ai").first()
        if not user:
            user = User(
                email="user@fixtrail.ai",
                full_name="Sarah Jenkins",
                hashed_password=hash_password("User@123"),
                role="user",
                is_active=True
            )
            db.add(user)
            logger.info("Created Demo user: user@fixtrail.ai / User@123")

        db.commit()
        db.refresh(admin)
        db.refresh(user)

        # 2. Seed Knowledge Base Articles if empty
        kb_count = db.query(KnowledgeArticle).count()
        if kb_count == 0:
            logger.info("Seeding initial Knowledge Base articles...")
            
            kb_articles = [
                KnowledgeArticle(
                    title="Resolving 'EADDRINUSE: Address already in use' Port 3000 / 8080",
                    problem_summary="Occurs when launching Node/Express, Vite, or Spring Boot servers while another process or zombie worker still occupies the port.",
                    symptoms="Error: listen EADDRINUSE: address already in use :::3000\ncode: 'EADDRINUSE'",
                    root_cause="A previous server crash or IDE background terminal failed to release the network socket.",
                    steps_json=json.dumps([
                        {
                            "step_number": 1,
                            "title": "Find Conflicting Process PID",
                            "action": "Query network port binding table to identify the PID occupying the port.",
                            "command": "netstat -ano | findstr :3000   # Windows\nlsof -i :3000                # Linux/macOS",
                            "explanation": "Extracts the exact numerical Process ID listed in the rightmost column.",
                            "caution": "Avoid terminating PID 0 or PID 4 which belong to System."
                        },
                        {
                            "step_number": 2,
                            "title": "Terminate Process Safely",
                            "action": "Force kill the dangling process ID.",
                            "command": "taskkill /PID <PID> /F   # Windows\nkill -9 <PID>             # Linux/macOS",
                            "explanation": "Frees up the port socket immediately.",
                            "caution": "Ensure the target process is not a production database."
                        },
                        {
                            "step_number": 3,
                            "title": "Configure Dynamic Port Fallback",
                            "action": "Update application entrypoint to use environment variable PORT with fallback.",
                            "command": "const PORT = process.env.PORT || 3000;",
                            "explanation": "Allows seamless alternate port selection during local microservice conflicts.",
                            "caution": None
                        }
                    ]),
                    verification_command="curl -I http://localhost:3000",
                    tags="networking,node,express,react,ports",
                    category="Networking",
                    os_platform="Multi-Platform",
                    upvotes=42,
                    helpful_count=38,
                    views_count=182,
                    created_by="FixTrail AI Team"
                ),
                KnowledgeArticle(
                    title="Fixing 'Cannot connect to the Docker daemon at unix:///var/run/docker.sock'",
                    problem_summary="Docker CLI commands fail with connection refused or socket permission denied.",
                    symptoms="Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?",
                    root_cause="The dockerd background service is stopped or the current user is not in the 'docker' user group.",
                    steps_json=json.dumps([
                        {
                            "step_number": 1,
                            "title": "Start Docker Engine Service",
                            "action": "Trigger service startup via systemctl or launch Docker Desktop.",
                            "command": "sudo systemctl start docker   # Linux\nStart-Process 'Docker Desktop'   # Windows",
                            "explanation": "Boots the dockerd daemon and initializes socket listener.",
                            "caution": "Allow WSL2 backend 20 seconds to boot on Windows."
                        },
                        {
                            "step_number": 2,
                            "title": "Add User to Docker Group",
                            "action": "Grant non-root execution permissions to avoid needing sudo.",
                            "command": "sudo usermod -aG docker $USER && newgrp docker",
                            "explanation": "Grants write permissions to /var/run/docker.sock.",
                            "caution": "Requires active terminal session refresh."
                        }
                    ]),
                    verification_command="docker ps && docker version",
                    tags="docker,devops,containers,linux,wsl",
                    category="DevOps & Cloud",
                    os_platform="Linux",
                    upvotes=64,
                    helpful_count=59,
                    views_count=310,
                    created_by="FixTrail AI Team"
                ),
                KnowledgeArticle(
                    title="Blocked by CORS Policy: No 'Access-Control-Allow-Origin' Header",
                    problem_summary="Frontend web client is blocked from fetching REST/GraphQL API resources due to Same-Origin Policy.",
                    symptoms="Access to fetch at 'http://localhost:8000/api' from origin 'http://localhost:5173' has been blocked by CORS policy.",
                    root_cause="API server omitted Access-Control-Allow-Origin or rejected preflight HTTP OPTIONS request.",
                    steps_json=json.dumps([
                        {
                            "step_number": 1,
                            "title": "Enable CORS in Backend Middleware",
                            "action": "Inject CORS middleware with explicit allowed origins.",
                            "command": "from fastapi.middleware.cors import CORSMiddleware\napp.add_middleware(CORSMiddleware, allow_origins=['http://localhost:5173'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])",
                            "explanation": "Configures headers returned to browser preflight requests.",
                            "caution": "Do not combine allow_origins=['*'] with allow_credentials=True in production."
                        },
                        {
                            "step_number": 2,
                            "title": "Configure Dev Proxy in Vite / Webpack",
                            "action": "Proxy requests through local dev server to bypass browser cross-origin boundaries.",
                            "command": "// vite.config.js\nserver: { proxy: { '/api': 'http://localhost:8000' } }",
                            "explanation": "Browser communicates with the same origin, while Vite forwards requests upstream.",
                            "caution": None
                        }
                    ]),
                    verification_command="curl -H 'Origin: http://localhost:5173' -I http://localhost:8000/api/health",
                    tags="cors,web,frontend,react,fastapi,security",
                    category="Web & Frontend",
                    os_platform="Web/Browser",
                    upvotes=89,
                    helpful_count=82,
                    views_count=450,
                    created_by="FixTrail AI Team"
                ),
                KnowledgeArticle(
                    title="MySQL Error 2003 (HY000): Can't connect to MySQL server on '127.0.0.1'",
                    problem_summary="Client applications cannot establish TCP socket connection to local or remote MySQL database.",
                    symptoms="OperationalError: (2003, \"Can't connect to MySQL server on 'localhost:3306' (10061)\")",
                    root_cause="MySQL daemon is stopped, port 3306 is firewalled, or bind-address is restricted in my.ini.",
                    steps_json=json.dumps([
                        {
                            "step_number": 1,
                            "title": "Verify MySQL Service Execution",
                            "action": "Check if MySQL 8.0 or MariaDB service is in RUNNING status.",
                            "command": "Get-Service -Name *mysql*   # Windows\nsudo systemctl status mysql    # Linux",
                            "explanation": "Confirms if the relational database process is listening.",
                            "caution": "Ensure port 3306 is not in conflict with another database."
                        },
                        {
                            "step_number": 2,
                            "title": "Start Database Service",
                            "action": "Start the service via administrative terminal.",
                            "command": "net start MySQL80   # Windows\nsudo systemctl start mysql    # Linux",
                            "explanation": "Spawns the mysqld daemon and creates connection socket.",
                            "caution": None
                        }
                    ]),
                    verification_command="mysqladmin -u root -p status",
                    tags="mysql,database,sql,backend,connection",
                    category="Database",
                    os_platform="Multi-Platform",
                    upvotes=51,
                    helpful_count=47,
                    views_count=230,
                    created_by="FixTrail AI Team"
                ),
                KnowledgeArticle(
                    title="Troubleshooting Windows BSOD: KMODE_EXCEPTION_NOT_HANDLED",
                    problem_summary="System abruptly halts with blue screen error code 0x0000001E or KMODE_EXCEPTION.",
                    symptoms="Stop code: KMODE_EXCEPTION_NOT_HANDLED\nWhat failed: ndis.sys or nvlddmkm.sys",
                    root_cause="Kernel mode program generated an exception which the error handler did not catch, usually caused by driver or memory fault.",
                    steps_json=json.dumps([
                        {
                            "step_number": 1,
                            "title": "Execute Windows System File Integrity Scan",
                            "action": "Scan and restore damaged Windows core files using DISM and SFC.",
                            "command": "DISM.exe /Online /Cleanup-image /Restorehealth\nsfc /scannow",
                            "explanation": "Compares system binaries against official Microsoft component store.",
                            "caution": "Must run Command Prompt as Administrator."
                        },
                        {
                            "step_number": 2,
                            "title": "Run Memory Diagnostic",
                            "action": "Check physical RAM modules for bad memory sectors.",
                            "command": "mdsched.exe",
                            "explanation": "Schedules memory test on reboot.",
                            "caution": "Save open work before rebooting."
                        }
                    ]),
                    verification_command="sfc /verifyonly",
                    tags="windows,bsod,kernel,hardware,drivers",
                    category="Operating System",
                    os_platform="Windows",
                    upvotes=37,
                    helpful_count=32,
                    views_count=190,
                    created_by="FixTrail AI Team"
                )
            ]
            for a in kb_articles:
                db.add(a)
            db.commit()
            logger.info("Knowledge Base seeded with 5 comprehensive articles.")

        # 3. Seed User Problem-Solving History for Demo User
        ticket_count = db.query(IssueTicket).filter(IssueTicket.user_id == user.id).count()
        if ticket_count == 0:
            logger.info("Seeding realistic sample issues for user history...")
            
            sample_tickets = [
                IssueTicket(
                    user_id=user.id,
                    title="Port 5173 occupied by dangling Node development process",
                    description="Vite dev server failed to bind to port 5173 and switched to 5174. Needed to release port 5173.",
                    detected_error_code="ERR_EADDRINUSE",
                    category="Networking",
                    severity="Medium",
                    status="solved",
                    ai_diagnosis="Process PID 14280 was holding the socket listener.",
                    ai_steps=json.dumps([
                        {
                            "step_number": 1,
                            "title": "Check Port 5173 PID",
                            "action": "Run netstat -ano | findstr :5173",
                            "command": "netstat -ano | findstr :5173",
                            "explanation": "Identified PID 14280",
                            "caution": None
                        },
                        {
                            "step_number": 2,
                            "title": "Terminate Dangling Process",
                            "action": "Run taskkill /PID 14280 /F",
                            "command": "taskkill /PID 14280 /F",
                            "explanation": "Process terminated and socket released.",
                            "caution": None
                        }
                    ]),
                    verification_command="netstat -ano | findstr :5173",
                    root_cause="Node exited uncleanly after VS Code window closed.",
                    confidence_score=97.0,
                    resolution_notes="Ran taskkill and Vite immediately started on port 5173. Problem completely solved!",
                    rating=5,
                    is_public_kb=True
                ),
                IssueTicket(
                    user_id=user.id,
                    title="Docker container cannot reach host MySQL database",
                    description="Spring Boot container throws connection refused when connecting to host.docker.internal:3306.",
                    detected_error_code="ERR_HOST_UNREACHABLE",
                    category="Database",
                    severity="High",
                    status="in_progress",
                    ai_diagnosis="Windows firewall blocking Docker network bridge traffic on port 3306.",
                    ai_steps=json.dumps([
                        {
                            "step_number": 1,
                            "title": "Configure MySQL Bind Address",
                            "action": "Ensure MySQL bind-address in my.ini is set to 0.0.0.0 instead of 127.0.0.1.",
                            "command": "bind-address = 0.0.0.0",
                            "explanation": "Allows external interface connections.",
                            "caution": "Do not expose 3306 to public WAN without VPN."
                        },
                        {
                            "step_number": 2,
                            "title": "Add Firewall Inbound Rule",
                            "action": "Allow Docker NAT subnet into port 3306.",
                            "command": "New-NetFirewallRule -DisplayName 'MySQL Docker' -Direction Inbound -LocalPort 3306 -Protocol TCP -Action Allow",
                            "explanation": "Unblocks traffic across virtual vEthernet adapter.",
                            "caution": None
                        }
                    ]),
                    verification_command="docker run --rm curlimages/curl curl -v host.docker.internal:3306",
                    root_cause="MySQL bound only to loopback adapter 127.0.0.1.",
                    confidence_score=94.0,
                    resolution_notes="Updated bind-address, restarting MySQL now to test.",
                    rating=4,
                    is_public_kb=False
                ),
                IssueTicket(
                    user_id=user.id,
                    title="Git Push Rejected: Updates were rejected because remote contains work",
                    description="Attempted to push local commit to main branch but failed with fast-forward error.",
                    detected_error_code="GIT_NON_FAST_FORWARD",
                    category="DevOps & Cloud",
                    severity="Low",
                    status="solved",
                    ai_diagnosis="Remote branch has new commits not present locally.",
                    ai_steps=json.dumps([
                        {
                            "step_number": 1,
                            "title": "Pull with Rebase",
                            "action": "Fetch and replay local commits on top of remote branch.",
                            "command": "git pull --rebase origin main",
                            "explanation": "Prevents redundant merge commits and linearizes git log.",
                            "caution": "Resolve any code conflicts carefully."
                        },
                        {
                            "step_number": 2,
                            "title": "Push Resolved Branch",
                            "action": "Push rebased commits to upstream repository.",
                            "command": "git push origin main",
                            "explanation": "Synchronizes local commits cleanly.",
                            "caution": None
                        }
                    ]),
                    verification_command="git status",
                    root_cause="Teammate merged a PR while local branch was unpulled.",
                    confidence_score=99.0,
                    resolution_notes="Cleanly rebased and pushed without issues.",
                    rating=5,
                    is_public_kb=True
                )
            ]
            for t in sample_tickets:
                db.add(t)
            db.commit()
            logger.info("Sample issue tickets seeded successfully.")

        logger.info("Database seeding completed successfully!")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
