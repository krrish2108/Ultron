"""
Code Sandbox Tool — SIH26117 — DOCKER VERSION
Owner: Sangam

Contract (unchanged from the subprocess version):
    execute_code(code: str, language: str) -> {
        "stdout": str,
        "stderr": str,
        "exit_code": int,
        "files_produced": list[str],
    }

Why this version exists: the subprocess+rlimits version could not stop
absolute-path file access (e.g. reading /etc/passwd) or block network
access at all. Docker fixes both because isolation is enforced by the
OS/Docker daemon, not by our own Python logic.

Requirements on the host machine:
  - Docker Desktop installed and running
  - The image built once: docker build -t code-sandbox ./docker
"""

import os
import uuid
import shutil
import subprocess
import time
from pathlib import Path

TIMEOUT_SECONDS = 10
MEMORY_LIMIT = "512m"
CPU_LIMIT = "1.0"

SCRATCH_ROOT = Path(__file__).parent / "scratch"

LANGUAGE_CONFIG = {
    "python": {
        "image": "code-sandbox",
        "filename": "script.py",
        "compile_cmd": None,
        "run_cmd": ["python3", "script.py"]
    },
    "javascript": {
        "image": "node:alpine",
        "filename": "script.js",
        "compile_cmd": None,
        "run_cmd": ["node", "script.js"]
    },
    "cpp": {
        "image": "gcc:latest",
        "filename": "main.cpp",
        "compile_cmd": ["g++", "main.cpp", "-o", "main"],
        "run_cmd": ["./main"]
    },
    "java": {
        "image": "openjdk:slim",
        "filename": "Main.java",
        "compile_cmd": ["javac", "Main.java"],
        "run_cmd": ["java", "Main"]
    }
}

def _build_docker_cmd(image: str, run_dir: Path, cmd_args: list[str]) -> list[str]:
    return [
        "docker", "run",
        "--rm",
        "--network", "none",
        "--memory", MEMORY_LIMIT,
        "--cpus", CPU_LIMIT,
        "--read-only",
        "--tmpfs", "/tmp",
        "-v", f"{run_dir.resolve()}:/sandbox",
        "--workdir", "/sandbox",
        image,
        *cmd_args,
    ]

def execute_code(code: str, language: str = "python") -> dict:
    if language not in LANGUAGE_CONFIG:
        return {
            "stdout": "",
            "stderr": f"Unsupported language: {language!r}",
            "exit_code": -1,
            "files_produced": [],
        }

    config = LANGUAGE_CONFIG[language]
    run_id = uuid.uuid4().hex[:8]
    run_dir = SCRATCH_ROOT / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    script_name = config["filename"]
    (run_dir / script_name).write_text(code)

    files_before = set(os.listdir(run_dir))

    # Phase 1: Compilation (if needed)
    if config["compile_cmd"]:
        compile_cmd = _build_docker_cmd(config["image"], run_dir, config["compile_cmd"])
        try:
            compile_result = subprocess.run(
                compile_cmd, capture_output=True, text=True, timeout=TIMEOUT_SECONDS
            )
            if compile_result.returncode != 0:
                # Compilation failed, return early
                return {
                    "stdout": compile_result.stdout,
                    "stderr": compile_result.stderr,
                    "exit_code": compile_result.returncode,
                    "files_produced": [],
                }
        except subprocess.TimeoutExpired:
            return {
                "stdout": "",
                "stderr": f"[sandbox] Compilation killed: exceeded {TIMEOUT_SECONDS}s timeout.",
                "exit_code": -1,
                "files_produced": [],
            }
        except FileNotFoundError:
            return {
                "stdout": "",
                "stderr": "[sandbox] Docker not found. Is Docker Desktop running?",
                "exit_code": -1,
                "files_produced": [],
            }

    # Phase 2: Execution
    run_cmd = _build_docker_cmd(config["image"], run_dir, config["run_cmd"])
    try:
        result = subprocess.run(
            run_cmd, capture_output=True, text=True, timeout=TIMEOUT_SECONDS
        )
        stdout, stderr, exit_code = result.stdout, result.stderr, result.returncode

    except subprocess.TimeoutExpired:
        stdout, stderr, exit_code = "", f"[sandbox] Exec killed: exceeded {TIMEOUT_SECONDS}s timeout.", -1

    except FileNotFoundError:
        stdout, stderr, exit_code = "", "[sandbox] Docker not found. Is Docker Desktop running?", -1

    files_after = set(os.listdir(run_dir))
    new_files = sorted(files_after - files_before - {script_name})
    files_produced = [str(run_dir / f) for f in new_files]

    return {
        "stdout": stdout,
        "stderr": stderr,
        "exit_code": exit_code,
        "files_produced": files_produced,
    }


def execute_code_streaming(code: str, language: str = "python"):
    if language not in LANGUAGE_CONFIG:
        yield {"stage": "failed", "result": {
            "stdout": "", "stderr": f"Unsupported language: {language!r}",
            "exit_code": -1, "files_produced": [],
        }}
        return

    config = LANGUAGE_CONFIG[language]
    yield {"stage": "received"}

    run_id = uuid.uuid4().hex[:8]
    run_dir = SCRATCH_ROOT / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    script_name = config["filename"]
    (run_dir / script_name).write_text(code)
    files_before = set(os.listdir(run_dir))

    total_stdout_lines = []
    total_stderr_lines = []

    # Phase 1: Compilation
    if config["compile_cmd"]:
        yield {"stage": "compiling"}
        compile_cmd = _build_docker_cmd(config["image"], run_dir, config["compile_cmd"])
        exit_code = -1
        try:
            proc = subprocess.Popen(
                compile_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
            )
            start = time.time()
            for line in proc.stdout:
                line_stripped = line.rstrip("\n")
                total_stdout_lines.append(line_stripped)
                yield {"stream": "stdout", "line": line_stripped}
                if time.time() - start > TIMEOUT_SECONDS:
                    proc.kill()
                    err_msg = f"[sandbox] Compilation killed: exceeded {TIMEOUT_SECONDS}s timeout."
                    total_stderr_lines.append(err_msg)
                    yield {"stream": "stderr", "line": err_msg}
                    break
            else:
                proc.wait(timeout=TIMEOUT_SECONDS)
                exit_code = proc.returncode
                remaining_stderr = proc.stderr.read()
                if remaining_stderr:
                    for line in remaining_stderr.splitlines():
                        total_stderr_lines.append(line)
                        yield {"stream": "stderr", "line": line}
        except subprocess.TimeoutExpired:
            err_msg = f"[sandbox] Compilation killed: exceeded {TIMEOUT_SECONDS}s timeout."
            total_stderr_lines.append(err_msg)
            yield {"stream": "stderr", "line": err_msg}
        except FileNotFoundError:
            err_msg = "[sandbox] Docker not found. Is Docker Desktop running?"
            total_stderr_lines.append(err_msg)
            yield {"stream": "stderr", "line": err_msg}

        if exit_code != 0:
            yield {"stage": "failed", "result": {
                "stdout": "\n".join(total_stdout_lines) + ("\n" if total_stdout_lines else ""),
                "stderr": "\n".join(total_stderr_lines) + ("\n" if total_stderr_lines else ""),
                "exit_code": exit_code,
                "files_produced": [],
            }}
            return

    # Phase 2: Execution
    yield {"stage": "executing"}
    run_cmd = _build_docker_cmd(config["image"], run_dir, config["run_cmd"])
    exit_code = -1
    try:
        proc = subprocess.Popen(
            run_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
        )
        start = time.time()
        for line in proc.stdout:
            line_stripped = line.rstrip("\n")
            total_stdout_lines.append(line_stripped)
            yield {"stream": "stdout", "line": line_stripped}
            if time.time() - start > TIMEOUT_SECONDS:
                proc.kill()
                err_msg = f"[sandbox] Exec killed: exceeded {TIMEOUT_SECONDS}s timeout."
                total_stderr_lines.append(err_msg)
                yield {"stream": "stderr", "line": err_msg}
                break
        else:
            proc.wait(timeout=TIMEOUT_SECONDS)
            exit_code = proc.returncode
            remaining_stderr = proc.stderr.read()
            if remaining_stderr:
                for line in remaining_stderr.splitlines():
                    total_stderr_lines.append(line)
                    yield {"stream": "stderr", "line": line}
    except subprocess.TimeoutExpired:
        err_msg = f"[sandbox] Exec killed: exceeded {TIMEOUT_SECONDS}s timeout."
        total_stderr_lines.append(err_msg)
        yield {"stream": "stderr", "line": err_msg}
    except FileNotFoundError:
        err_msg = "[sandbox] Docker not found. Is Docker Desktop running?"
        total_stderr_lines.append(err_msg)
        yield {"stream": "stderr", "line": err_msg}

    yield {"stage": "capturing_output"}

    files_after = set(os.listdir(run_dir))
    new_files = sorted(files_after - files_before - {script_name})
    files_produced = [str(run_dir / f) for f in new_files]

    final_result = {
        "stdout": "\n".join(total_stdout_lines) + ("\n" if total_stdout_lines else ""),
        "stderr": "\n".join(total_stderr_lines) + ("\n" if total_stderr_lines else ""),
        "exit_code": exit_code,
        "files_produced": files_produced,
    }

    stage = "completed" if exit_code == 0 else "failed"
    yield {"stage": stage, "result": final_result}


if __name__ == "__main__":
    SCRATCH_ROOT.mkdir(exist_ok=True)

    print("=" * 60)
    print("TEST 1: Python normal")
    print("=" * 60)
    print(execute_code(
        "print('Pressure drop: 12.4 bar')\n"
        "with open('result.txt','w') as f: f.write('ok')",
        "python"
    ))

    print("\n" + "=" * 60)
    print("TEST 2: JS normal")
    print("=" * 60)
    print(execute_code("console.log('JS says hello');", "javascript"))

    print("\n" + "=" * 60)
    print("TEST 3: C++ compile and run")
    print("=" * 60)
    print(execute_code(
        "#include <iostream>\n"
        "int main() { std::cout << \"C++ Hello\" << std::endl; return 0; }",
        "cpp"
    ))

    print("\n" + "=" * 60)
    print("TEST 4: Java compile and run")
    print("=" * 60)
    print(execute_code(
        "public class Main { public static void main(String[] args) { System.out.println(\"Java Hello\"); } }",
        "java"
    ))

    print("\n" + "=" * 60)
    print("TEST 5: C++ compile error")
    print("=" * 60)
    print(execute_code(
        "#include <iostream>\n"
        "int main() { INVALID std::cout << \"C++ Hello\" << std::endl; return 0; }",
        "cpp"
    ))
