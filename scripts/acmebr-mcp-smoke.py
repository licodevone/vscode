# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root.
"""Exercise real MCP initialization, discovery, and an in-memory browser call."""

import argparse
import json
import os
from pathlib import Path
import queue
import shutil
import signal
import subprocess
import threading
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]


def smoke_stdio(name, config):
    executable = shutil.which(config["command"])
    if not executable:
        raise RuntimeError(f"Executável ausente: {config['command']}")
    process = subprocess.Popen(
        [executable, *config["args"]], cwd=ROOT, stdin=subprocess.PIPE,
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
        encoding="utf-8", errors="replace", bufsize=1,
        start_new_session=os.name != "nt",
        creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
    )
    output = queue.Queue()
    diagnostics = []

    def read_output():
        for line in process.stdout:
            try:
                output.put(json.loads(line))
            except json.JSONDecodeError:
                diagnostics.append(line.strip())
        output.put(None)

    def read_errors():
        for line in process.stderr:
            diagnostics.append(line.strip())

    threading.Thread(target=read_output, daemon=True).start()
    threading.Thread(target=read_errors, daemon=True).start()

    def send(message):
        process.stdin.write(json.dumps({"jsonrpc": "2.0", **message}) + "\n")
        process.stdin.flush()

    def request(identifier, method, params):
        send({"id": identifier, "method": method, "params": params})
        deadline = time.monotonic() + 60
        while True:
            try:
                response = output.get(timeout=max(0.01, deadline - time.monotonic()))
            except queue.Empty as error:
                raise RuntimeError(f"Timeout em {method}: {'; '.join(diagnostics[-5:])}") from error
            if response is None:
                raise RuntimeError(f"Servidor encerrou em {method}: {'; '.join(diagnostics[-5:])}")
            if "method" in response and "id" in response:
                if response["method"] == "roots/list":
                    send({"id": response["id"], "result": {"roots": [{"uri": ROOT.as_uri(), "name": "acmebr-ide"}]}})
                elif response["method"] == "ping":
                    send({"id": response["id"], "result": {}})
                else:
                    send({"id": response["id"], "error": {"code": -32601, "message": "Unsupported method"}})
            elif response.get("id") == identifier:
                if "error" in response:
                    raise RuntimeError(f"{method}: {response['error']}")
                return response["result"]
            if time.monotonic() >= deadline:
                raise RuntimeError(f"Timeout em {method}")

    try:
        info = request(1, "initialize", {
            "protocolVersion": "2025-03-26", "capabilities": {"roots": {"listChanged": False}},
            "clientInfo": {"name": "acmebr-smoke", "version": "1.0.0"},
        })
        send({"method": "notifications/initialized"})
        tools = request(2, "tools/list", {})["tools"]
        if not tools:
            raise RuntimeError("Servidor não expôs ferramentas")
        print(f"OK {name}: initialize ({info['serverInfo']['name']}), tools/list ({len(tools)} ferramentas)")
        if name == "playwright":
            available = {tool["name"] for tool in tools}
            for required in ["browser_navigate", "browser_evaluate", "browser_close"]:
                if required not in available:
                    raise RuntimeError(f"Ferramenta ausente: {required}; disponíveis: {sorted(available)}")
            opened = request(3, "tools/call", {"name": "browser_navigate", "arguments": {"url": "about:blank"}})
            if opened.get("isError"):
                raise RuntimeError(f"Falha ao abrir navegador: {opened}")
            result = request(4, "tools/call", {
                "name": "browser_evaluate",
                "arguments": {"function": "() => { document.body.innerHTML = '<main><h1>ACME BR MCP OK</h1></main>'; return document.querySelector('h1').innerText; }"},
            })
            if result.get("isError") or "ACME BR MCP OK" not in json.dumps(result):
                raise RuntimeError(f"Falha na chamada real do navegador: {result}")
            closed = request(5, "tools/call", {"name": "browser_close", "arguments": {}})
            if closed.get("isError"):
                raise RuntimeError(f"Falha ao fechar navegador: {closed}")
            print("OK playwright: página em memória renderizada, conteúdo lido, navegador fechado")
    finally:
        if os.name == "nt":
            subprocess.run(["taskkill", "/PID", str(process.pid), "/T", "/F"], capture_output=True, creationflags=subprocess.CREATE_NO_WINDOW)
        else:
            try:
                os.killpg(process.pid, signal.SIGTERM)
            except ProcessLookupError:
                pass
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=5)


def smoke_http(name, config):
    headers = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}

    def request(identifier, method, params):
        payload = {"jsonrpc": "2.0", "method": method, "params": params}
        if identifier is not None:
            payload["id"] = identifier
        req = urllib.request.Request(config["url"], json.dumps(payload).encode(), headers=headers)
        with urllib.request.urlopen(req, timeout=30) as response:
            session = response.headers.get("Mcp-Session-Id")
            if session:
                headers["Mcp-Session-Id"] = session
            if identifier is None:
                return None
            if "text/event-stream" in response.headers.get("Content-Type", ""):
                for line in response:
                    if line.startswith(b"data:"):
                        data = json.loads(line[5:])
                        if data.get("id") == identifier:
                            break
                else:
                    raise RuntimeError("Resposta SSE sem resultado JSON-RPC")
            else:
                data = json.loads(response.read())
            if "error" in data:
                raise RuntimeError(str(data["error"]))
            return data["result"]

    info = request(1, "initialize", {"protocolVersion": "2025-03-26", "capabilities": {}, "clientInfo": {"name": "acmebr-smoke", "version": "1.0.0"}})
    headers["MCP-Protocol-Version"] = info["protocolVersion"]
    request(None, "notifications/initialized", {})
    tools = request(2, "tools/list", {})["tools"]
    if not tools:
        raise RuntimeError("Servidor não expôs ferramentas")
    print(f"OK {name}: initialize, tools/list ({len(tools)} ferramentas); sem chamada de ferramenta remota")


if __name__ == "__main__":
    servers = json.loads((ROOT / ".mcp.json").read_text(encoding="utf-8"))["mcpServers"]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("server", choices=servers)
    args = parser.parse_args()
    try:
        config = servers[args.server]
        if config["type"] == "stdio":
            smoke_stdio(args.server, config)
        else:
            smoke_http(args.server, config)
    except Exception as error:
        parser.exit(1, f"FALHA: {error}\n")
