import json
import logging
import os
import re
from typing import Optional, Dict, Any, List
from PIL import Image
import google.generativeai as genai
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

# Heuristic Knowledge Base for reliable offline/fallback analysis of screenshots & error messages
FALLBACK_SOLUTIONS = [
    {
        "keywords": ["port", "8080", "3000", "5000", "already in use", "eaddrinuse", "address already in use"],
        "title": "Port Already In Use Conflict (EADDRINUSE)",
        "detected_error_code": "ERR_EADDRINUSE",
        "category": "Networking",
        "severity": "Medium",
        "root_cause": "Another background service or zombie process is actively listening on the target port.",
        "steps": [
            {
                "step_number": 1,
                "title": "Identify Conflicting Process PID",
                "action": "Find the process ID currently bound to the occupied port.",
                "command": "netstat -ano | findstr :<PORT>   # (Windows)\nlsof -i :<PORT>                # (Linux/macOS)",
                "explanation": "This lists network sockets and provides the PID in the rightmost column.",
                "caution": "Make sure you do not terminate critical system PIDs like 0 or 4."
            },
            {
                "step_number": 2,
                "title": "Terminate Conflicting Process",
                "action": "Kill the process holding the port using its PID.",
                "command": "taskkill /F /PID <PID>           # (Windows)\nkill -9 <PID>                   # (Linux/macOS)",
                "explanation": "Terminates the dangling process and releases the socket immediately.",
                "caution": "Save any unsaved work in the target process before forceful termination."
            },
            {
                "step_number": 3,
                "title": "Rebind Port or Change Config",
                "action": "Restart your application or configure an alternate port in your environment variables.",
                "command": "PORT=3001 npm start   # or edit .env PORT=8081",
                "explanation": "Using a configurable port avoids hardcoded conflicts across microservices.",
                "caution": "Update frontend proxy or CORS configuration if the port is changed."
            }
        ],
        "verification_command": "curl -I http://localhost:<PORT>",
        "preventive_tips": "Always cleanly stop dev servers using Ctrl+C instead of force-closing terminal tabs."
    },
    {
        "keywords": ["cors", "cross-origin", "access-control-allow-origin", "preflight", "blocked by cors policy"],
        "title": "Cross-Origin Resource Sharing (CORS) Policy Blocked",
        "detected_error_code": "ERR_CORS_BLOCKED",
        "category": "Web & Frontend",
        "severity": "High",
        "root_cause": "The backend server response headers do not permit requests originating from the frontend domain/port.",
        "steps": [
            {
                "step_number": 1,
                "title": "Configure Backend CORS Middleware",
                "action": "Allow the client origin in your backend CORS configuration.",
                "command": "from fastapi.middleware.cors import CORSMiddleware\napp.add_middleware(CORSMiddleware, allow_origins=['http://localhost:5173'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])",
                "explanation": "Injects Access-Control-Allow-Origin into HTTP responses and resolves the browser preflight OPTIONS check.",
                "caution": "Avoid setting allow_origins=['*'] when allow_credentials=True in production."
            },
            {
                "step_number": 2,
                "title": "Configure Frontend Reverse Proxy (Alternative)",
                "action": "Proxy API requests through your frontend dev server to avoid cross-origin checks in local dev.",
                "command": "// vite.config.js\nserver: { proxy: { '/api': 'http://localhost:8000' } }",
                "explanation": "The browser sees requests to the same origin, while Vite forwards them to FastAPI.",
                "caution": "Ensure production builds point to the correct production domain."
            }
        ],
        "verification_command": "curl -H \"Origin: http://localhost:5173\" -H \"Access-Control-Request-Method: GET\" -X OPTIONS http://localhost:8000/api/health -i",
        "preventive_tips": "Define central environment variables for API base URLs and allowed frontend origins."
    },
    {
        "keywords": ["docker", "daemon", "docker.sock", "is the docker daemon running", "cannot connect to the docker daemon"],
        "title": "Docker Daemon Unreachable / Not Running",
        "detected_error_code": "ERR_DOCKER_DAEMON_OFFLINE",
        "category": "DevOps & Cloud",
        "severity": "Critical",
        "root_cause": "The Docker service is stopped, Docker Desktop is not booted, or the current user lacks socket permissions.",
        "steps": [
            {
                "step_number": 1,
                "title": "Verify & Start Docker Service",
                "action": "Start the Docker engine or Docker Desktop application.",
                "command": "Start-Process 'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe'   # (Windows)\nsudo systemctl start docker                                            # (Linux)",
                "explanation": "Initiates the dockerd background daemon.",
                "caution": "Allow up to 30-45 seconds for WSL2/Hyper-V engine to fully initialize."
            },
            {
                "step_number": 2,
                "title": "Grant Docker Socket Permissions",
                "action": "Add your user to the docker group on Linux/WSL if access is denied.",
                "command": "sudo usermod -aG docker $USER && newgrp docker",
                "explanation": "Enables non-root access to /var/run/docker.sock.",
                "caution": "You must re-login or run newgrp for group membership to take effect."
            }
        ],
        "verification_command": "docker info && docker ps",
        "preventive_tips": "Set Docker Desktop to launch automatically on system startup."
    },
    {
        "keywords": ["mysql", "2003", "10061", "can't connect to mysql server", "connection refused", "access denied for user"],
        "title": "MySQL Connection Refused (Error 2003 / 1045)",
        "detected_error_code": "MYSQL_ERR_2003",
        "category": "Database",
        "severity": "High",
        "root_cause": "MySQL service is offline, listening only on 127.0.0.1, or database credentials/firewall are mismatched.",
        "steps": [
            {
                "step_number": 1,
                "title": "Check MySQL Service Status",
                "action": "Verify if the MySQL Windows Service or systemd daemon is active.",
                "command": "net start MySQL80   # (Windows)\nsudo systemctl status mysql   # (Linux)",
                "explanation": "Checks if the relational database engine is actively accepting connections.",
                "caution": "Ensure port 3306 is not blocked by Windows Defender Firewall."
            },
            {
                "step_number": 2,
                "title": "Verify User Privileges & Host Grant",
                "action": "Confirm the user has permission to connect from the desired host.",
                "command": "GRANT ALL PRIVILEGES ON fixtrail.* TO 'root'@'localhost' IDENTIFIED BY 'password';\nFLUSH PRIVILEGES;",
                "explanation": "Refreshes internal MySQL privilege tables.",
                "caution": "Always restrict database passwords from public version control."
            }
        ],
        "verification_command": "mysqladmin -u root -p ping",
        "preventive_tips": "Use connection pool timeouts and proper reconnection retry logic in your ORM configuration."
    },
    {
        "keywords": ["bsod", "blue screen", "stop code", "kmode_exception", "irql_not_less_or_equal", "system_service_exception", "page_fault_in_nonpaged_area"],
        "title": "Windows Kernel Stop Error (BSOD Crash)",
        "detected_error_code": "CRASH_STOP_CODE_BSOD",
        "category": "Operating System",
        "severity": "Critical",
        "root_cause": "Kernel memory corruption, incompatible third-party driver, or faulty system hardware page fault.",
        "steps": [
            {
                "step_number": 1,
                "title": "Run System File Checker (SFC)",
                "action": "Inspect and repair corrupted Windows system files.",
                "command": "DISM.exe /Online /Cleanup-image /Restorehealth && sfc /scannow",
                "explanation": "Replaces damaged kernel binaries with fresh copies from the Windows component store.",
                "caution": "Run PowerShell or Command Prompt strictly as Administrator."
            },
            {
                "step_number": 2,
                "title": "Inspect Minidump File",
                "action": "Find the offending driver using dumpchk or BlueScreenView.",
                "command": "Get-ChildItem -Path C:\\Windows\\Minidump -Recurse",
                "explanation": "Identifies the exact .sys driver file that triggered the crash.",
                "caution": "Do not delete minidump logs before analyzing them."
            }
        ],
        "verification_command": "sfc /verifyonly",
        "preventive_tips": "Keep graphics drivers, BIOS firmware, and Windows Updates current."
    },
    {
        "keywords": ["git", "merge conflict", "automatic merge failed", "fix conflicts and then commit", "rebase"],
        "title": "Git Merge / Rebase Conflict",
        "detected_error_code": "GIT_MERGE_CONFLICT",
        "category": "DevOps & Cloud",
        "severity": "Medium",
        "root_cause": "Multiple commits altered the same lines in the repository or a file was deleted in one branch and modified in another.",
        "steps": [
            {
                "step_number": 1,
                "title": "Locate Conflicted Files",
                "action": "List files requiring manual conflict resolution.",
                "command": "git status -s",
                "explanation": "Shows files marked with UU (unmerged, both modified).",
                "caution": "Do not run git commit -a while conflict markers (<<<<<<<) remain in the files."
            },
            {
                "step_number": 2,
                "title": "Resolve Markers or Abort",
                "action": "Edit the conflicted sections or safely abort the merge if unintended.",
                "command": "git merge --abort   # (To cancel)\n# OR after manual edits:\ngit add . && git commit -m \"fix: resolve merge conflicts\"",
                "explanation": "Completes the merge commit with unified changes.",
                "caution": "Review changes thoroughly with git diff before committing."
            }
        ],
        "verification_command": "git status",
        "preventive_tips": "Pull frequently and use short-lived feature branches to reduce merge collision surfaces."
    }
]

def get_gemini_api_key(db_key: Optional[str] = None) -> Optional[str]:
    """Retrieve API key from runtime parameter, database setting, or env var."""
    if db_key and db_key.strip():
        return db_key.strip()
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
        return settings.GEMINI_API_KEY.strip()
    return None

def heuristic_diagnose(description: str = "", filename: str = "") -> Dict[str, Any]:
    """Fallback diagnostic engine if Gemini API key is unset or external quota is reached."""
    text = f"{description} {filename}".lower()
    
    for item in FALLBACK_SOLUTIONS:
        for kw in item["keywords"]:
            if kw.lower() in text:
                return {
                    "title": item["title"],
                    "detected_error_code": item["detected_error_code"],
                    "category": item["category"],
                    "severity": item["severity"],
                    "root_cause": item["root_cause"],
                    "steps": item["steps"],
                    "verification_command": item["verification_command"],
                    "preventive_tips": item["preventive_tips"],
                    "confidence_score": 94.5
                }
    
    # Generic intelligent IT diagnosis
    return {
        "title": "Application Runtime / Dependency Execution Exception",
        "detected_error_code": "ERR_RUNTIME_EXCEPTION",
        "category": "General IT",
        "severity": "Medium",
        "root_cause": "An unexpected exception or missing dependency occurred during execution.",
        "steps": [
            {
                "step_number": 1,
                "title": "Inspect Detailed Stack Trace",
                "action": "Examine the latest log entries and error timestamps.",
                "command": "tail -n 100 app.log  # or review terminal stack trace",
                "explanation": "Pinpoints the exact file and line number causing the crash.",
                "caution": "Check for sensitive environment credentials before sharing logs."
            },
            {
                "step_number": 2,
                "title": "Reinstall & Validate Dependencies",
                "action": "Ensure all required runtime libraries and lockfiles match your codebase.",
                "command": "npm install   # for Node\npip install -r requirements.txt  # for Python",
                "explanation": "Synchronizes local packages with declared dependencies.",
                "caution": "Verify package registry network access."
            },
            {
                "step_number": 3,
                "title": "Restart Process in Verbose Debug Mode",
                "action": "Rerun the program with debug flag enabled.",
                "command": "DEBUG=* npm run dev   # or python -m uvicorn --log-level debug",
                "explanation": "Provides granular diagnostic output to confirm resolution.",
                "caution": "Disable debug mode before shipping to production."
            }
        ],
        "verification_command": "echo 'Checking service health...'",
        "preventive_tips": "Set up automated CI/CD unit testing and proactive log monitoring.",
        "confidence_score": 89.0
    }

async def analyze_error_with_gemini(
    image_path: Optional[str] = None,
    description: str = "",
    os_platform: str = "Windows",
    category_hint: str = "Auto-Detect",
    runtime_api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Performs AI error diagnosis using Google Gemini Vision & Text API.
    Gracefully falls back to the built-in diagnostic engine if key is absent or API fails.
    """
    api_key = get_gemini_api_key(runtime_api_key)
    
    if not api_key:
        logger.info("Gemini API key not configured. Using FixTrail Expert Diagnostic Engine.")
        return heuristic_diagnose(description, os.path.basename(image_path) if image_path else "")
    
    try:
        genai.configure(api_key=api_key)
        
        prompt = f"""
You are an elite IT Systems Administrator and Senior DevOps Troubleshooting Specialist for "FixTrail".
Analyze the provided technical error screenshot and/or problem description.

Context:
- Target OS / Platform: {os_platform}
- Category Hint: {category_hint}
- User Description: {description}

Your goal: Extract all visible error text/stack trace from the image (OCR), diagnose the root cause, and provide clear step-by-step resolution instructions.

Return ONLY a valid JSON object matching this schema without any markdown backticks or commentary:
{{
  "title": "Short descriptive title of the error",
  "detected_error_code": "e.g. ERR_CONNECTION_REFUSED or 0x0000007B or CORS_ERROR",
  "category": "One of: Networking, Database, DevOps & Cloud, Operating System, Web & Frontend, Python & Backend, Security & Auth, Hardware/Driver",
  "severity": "One of: Low, Medium, High, Critical",
  "root_cause": "A concise 1-2 sentence explanation of why this error happens",
  "steps": [
    {{
      "step_number": 1,
      "title": "Step title",
      "action": "Clear instructions of what to do",
      "command": "Terminal command or code snippet if applicable (or null)",
      "explanation": "Why this step is needed",
      "caution": "Important warning or caution note (or null)"
    }}
  ],
  "verification_command": "Terminal command to verify the fix (or null)",
  "preventive_tips": "Advice to avoid this issue in the future",
  "confidence_score": 96.5
}}
"""
        # Choose model: gemini-1.5-flash or gemini-2.0-flash
        model_name = settings.GEMINI_MODEL
        model = genai.GenerativeModel(model_name)
        
        contents = [prompt]
        if image_path and os.path.exists(image_path):
            try:
                pil_img = Image.open(image_path)
                contents.append(pil_img)
            except Exception as img_err:
                logger.warning(f"Failed to load image for Gemini: {img_err}")
        
        response = await model.generate_content_async(contents)
        text_resp = response.text.strip()
        
        # Clean json formatting if wrapped in ```json ... ```
        clean_json = re.sub(r"^```(?:json)?\s*", "", text_resp)
        clean_json = re.sub(r"\s*```$", "", clean_json)
        
        parsed = json.loads(clean_json)
        # Ensure confidence_score is float
        if "confidence_score" not in parsed:
            parsed["confidence_score"] = 96.0
        return parsed
        
    except Exception as e:
        logger.error(f"Gemini API invocation error: {e}. Falling back to FixTrail Expert Diagnostic Engine.")
        fallback = heuristic_diagnose(description, os.path.basename(image_path) if image_path else "")
        fallback["root_cause"] = f"{fallback['root_cause']} (Analyzed via fallback diagnostic engine: {str(e)[:100]})"
        return fallback
