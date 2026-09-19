#!/usr/bin/env python3
"""
Pasteport CLI - Pure Python Implementation
Cross-device clipboard and file sharing for terminals.
"""

import os
import sys
import json
import argparse
import urllib.request
import urllib.parse
import urllib.error
import mimetypes
import uuid
from pathlib import Path

VERSION = "1.0.1"
DEFAULT_SERVER = "https://pasteport.zain-imran.com"
STANDARD_MAX_FILE_SIZE = 10 * 1024 * 1024       # 10 MB
SECURE_MAX_FILE_SIZE = 600 * 1024 * 1024        # 600 MB

# ANSI Color Codes
class Colors:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    BLUE = "\033[34m"
    MAGENTA = "\033[35m"
    CYAN = "\033[36m"
    WHITE = "\033[37m"

def print_banner():
    print(f"""
  {Colors.CYAN}██████╗  █████╗ ███████╗████████╗███████╗██████╗  ██████╗ ██████╗ ████████╗{Colors.RESET}
  {Colors.CYAN}██╔══██╗██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝{Colors.RESET}
  {Colors.CYAN}██████╔╝███████║███████╗   ██║   █████╗  ██████╔╝██║   ██║██████╔╝   ██║   {Colors.RESET}
  {Colors.CYAN}██╔═══╝ ██╔══██║╚════██║   ██║   ██╔══╝  ██╔═══╝ ██║   ██║██╔══██╗   ██║   {Colors.RESET}
  {Colors.CYAN}██║     ██║  ██║███████║   ██║   ███████╗██║     ╚██████╔╝██║  ██║   ██║   {Colors.RESET}
  {Colors.CYAN}╚═╝     ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   {Colors.RESET}
  {Colors.DIM}Cross-device sharing + Developer Toolkit | Python CLI v{VERSION}{Colors.RESET}
""")

def log_error(title, message, suggestion=None):
    print(f"\n{Colors.RED}{Colors.BOLD}✖ Error: {title}{Colors.RESET}", file=sys.stderr)
    print(f"  {message}", file=sys.stderr)
    if suggestion:
        print(f"  {Colors.CYAN}Suggestion: {suggestion}{Colors.RESET}", file=sys.stderr)
    print("", file=sys.stderr)

def extract_code(raw_input):
    if not raw_input:
        return ""
    clean = raw_input.strip()
    if clean.startswith("http://") or clean.startswith("https://"):
        try:
            parsed = urllib.parse.urlparse(clean)
            qs = urllib.parse.parse_qs(parsed.query)
            if "code" in qs and qs["code"]:
                return qs["code"][0].strip()
            segments = [s for s in parsed.path.split("/") if s]
            if segments:
                last_seg = segments[-1]
                if last_seg not in ("view", "secure"):
                    return last_seg.strip()
        except Exception:
            pass
    return clean

def encode_multipart_formdata(fields, files):
    boundary = f"----PasteportBoundary{uuid.uuid4().hex}"
    body = bytearray()

    for key, value in fields.items():
        if value is None:
            continue
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="{key}"\r\n\r\n'.encode("utf-8"))
        body.extend(f"{value}\r\n".encode("utf-8"))

    for key, (filename, content, content_type) in files.items():
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="{key}"; filename="{filename}"\r\n'.encode("utf-8"))
        body.extend(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
        body.extend(content)
        body.extend(b"\r\n")

    body.extend(f"--{boundary}--\r\n".encode("utf-8"))
    content_type_header = f"multipart/form-data; boundary={boundary}"
    return content_type_header, bytes(body)

def handle_send(target, pin="", expiry=24, self_destruct="", json_output=False, server=DEFAULT_SERVER):
    server = server.rstrip("/")
    send_url = f"{server}/api/cli/send"

    content_to_send = target
    is_file = False
    file_path = None

    if target and os.path.isfile(target):
        is_file = True
        file_path = Path(target).resolve()
    elif not target and not sys.stdin.isatty():
        content_to_send = sys.stdin.read()
    elif not content_to_send:
        try:
            content_to_send = input(f"{Colors.CYAN}Enter text to send to Pasteport: {Colors.RESET}")
        except (KeyboardInterrupt, EOFError):
            print("\nAborted.")
            sys.exit(0)

    if not content_to_send and not is_file:
        log_error("No content provided", "Provide text or a valid filepath.", "Example: pasteport send 'hello' or pasteport send ./archive.zip")
        sys.exit(1)

    try:
        if is_file:
            stat = file_path.stat()
            if stat.st_size > STANDARD_MAX_FILE_SIZE:
                log_error(
                    f"File exceeds 10 MB limit ({stat.st_size / (1024*1024):.1f} MB)",
                    "Standard Share supports files up to 10 MB.",
                    f"For files up to 600 MB, use Secret Share: pasteport secret <8-digit-code> {file_path}"
                )
                sys.exit(1)

            file_bytes = file_path.read_bytes()
            mime_type = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"

            fields = {"expiryHours": str(expiry)}
            if pin:
                fields["accessPin"] = pin
            if self_destruct:
                fields["deletePin"] = self_destruct

            files = {"file": (file_path.name, file_bytes, mime_type)}
            content_type, body = encode_multipart_formdata(fields, files)

            req = urllib.request.Request(send_url, data=body, headers={"Content-Type": content_type}, method="POST")
        else:
            payload = {
                "text": content_to_send,
                "expiryHours": expiry,
                "accessPin": pin or None,
                "deletePin": self_destruct or None,
            }
            body = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(send_url, data=body, headers={"Content-Type": "application/json"}, method="POST")

        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        if json_output:
            print(json.dumps(data, indent=2))
            return

        print("")
        print(f"{Colors.GREEN}{Colors.BOLD}✔ Clip Created Successfully!{Colors.RESET}")
        print("──────────────────────────────────────────────")
        print(f"  {Colors.BOLD}Share Code:{Colors.RESET}  {Colors.GREEN}{Colors.BOLD}{data.get('code')}{Colors.RESET}")
        print(f"  {Colors.BOLD}Direct Link:{Colors.RESET} {Colors.CYAN}{data.get('url')}{Colors.RESET}")
        print(f"  {Colors.BOLD}Type:{Colors.RESET}        {data.get('type', 'text').capitalize()}")
        print(f"  {Colors.BOLD}Expires:{Colors.RESET}     {expiry} hours")
        if data.get("hasAccessPin"):
            print(f"  {Colors.BOLD}Access PIN:{Colors.RESET}  {Colors.YELLOW}Locked with PIN{Colors.RESET}")
        print("──────────────────────────────────────────────")
        print(f"{Colors.dim}Retrieve anytime with: {Colors.reset}pasteport get {data.get('code')}")
        print(f"{Colors.dim}Or paste direct link into CLI: {Colors.reset}pasteport get {data.get('url')}\n")

    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        try:
            err_json = json.loads(err_msg)
            log_error("Upload Failed", err_json.get("error", err_msg))
        except Exception:
            log_error("Upload Failed", err_msg)
        sys.exit(1)
    except Exception as ex:
        log_error("Network / Connection Failed", str(ex))
        sys.exit(1)

def handle_get(target, pin="", output="", raw=False, json_output=False, server=DEFAULT_SERVER):
    server = server.rstrip("/")
    if not target:
        try:
            target = input(f"{Colors.CYAN}Enter 6-digit Code or Pasteport URL: {Colors.RESET}")
        except (KeyboardInterrupt, EOFError):
            print("\nAborted.")
            sys.exit(0)

    code = extract_code(target)
    if not code:
        log_error("Code Required", "Please provide a 6-digit code or URL to retrieve.")
        sys.exit(1)

    url = f"{server}/api/cli/get?code={urllib.parse.quote(code)}"
    if pin:
        url += f"&pin={urllib.parse.quote(pin)}"
    if raw:
        url += "&raw=true"

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Pasteport-Python-CLI/1.0"})
        with urllib.request.urlopen(req) as resp:
            content_type = resp.headers.get("Content-Type", "")
            raw_body = resp.read()

        if raw:
            sys.stdout.write(raw_body.decode("utf-8", errors="replace"))
            return

        data = json.loads(raw_body.decode("utf-8"))

        if json_output:
            print(json.dumps(data, indent=2))
            return

        if data.get("type") == "text":
            print(f"\n{Colors.BOLD}── Text Clip [Code: {data.get('code')}] ───────────────────{Colors.RESET}")
            print(data.get("content", ""))
            print(f"{Colors.BOLD}──────────────────────────────────────────────{Colors.RESET}\n")
            if output:
                Path(output).write_text(data.get("content", ""), encoding="utf-8")
                print(f"{Colors.GREEN}✔ Saved to {output}{Colors.RESET}\n")

        elif data.get("type") == "file":
            file_name = data.get("fileName", "downloaded_file")
            download_url = data.get("url")
            print(f"\n{Colors.BOLD}── File Clip [Code: {data.get('code')}] ───────────────────{Colors.RESET}")
            print(f"  {Colors.BOLD}Filename:{Colors.RESET} {file_name}")
            print(f"  {Colors.BOLD}Direct:{Colors.RESET}   {download_url}")
            print(f"{Colors.BOLD}──────────────────────────────────────────────{Colors.RESET}")

            dest = Path(output) if output else Path(file_name)
            print(f"{Colors.DIM}Downloading to {dest}...{Colors.RESET}")

            urllib.request.urlretrieve(download_url, dest)
            print(f"{Colors.GREEN}{Colors.BOLD}✔ Download complete: {dest.resolve()}{Colors.RESET}\n")

    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        try:
            err_json = json.loads(err_msg)
            log_error(err_json.get("error", "Retrieval Failed"), f"Server returned HTTP {e.code}")
        except Exception:
            log_error("Retrieval Failed", err_msg)
        sys.exit(1)
    except Exception as ex:
        log_error("Failed to Retrieve Clip", str(ex))
        sys.exit(1)

def handle_secret(access_code, file_path, json_output=False, server=DEFAULT_SERVER):
    server = server.rstrip("/")
    if not access_code:
        print(f"\n{Colors.MAGENTA}{Colors.BOLD}🔒 Pasteport Secret Share (Up to 600 MB Storage){Colors.RESET}")
        print("To send files up to 600 MB, mint an 8-digit access code at: " + server + "/secure\n")
        try:
            has_code = input(f"{Colors.CYAN}Do you have an 8-digit Secret Access Code? [y/N]: {Colors.RESET}")
            if not has_code.lower().startswith("y"):
                print(f"\n{Colors.YELLOW}No problem! Use Option 1 for standard shares up to 10 MB.{Colors.RESET}\n")
                return
            access_code = input(f"{Colors.CYAN}Enter 8-digit Secret Access Code: {Colors.RESET}")
        except (KeyboardInterrupt, EOFError):
            print("\nAborted.")
            sys.exit(0)

    access_code = access_code.strip()
    if len(access_code) != 8:
        log_error("Invalid Access Code", "Code must be exactly 8 digits.")
        sys.exit(1)

    if not file_path:
        try:
            file_path = input(f"{Colors.CYAN}Enter filepath to upload (up to 600 MB): {Colors.RESET}")
        except (KeyboardInterrupt, EOFError):
            print("\nAborted.")
            sys.exit(0)

    p = Path(file_path).resolve()
    if not p.is_file():
        log_error("File Not Found", f"Cannot find file at '{file_path}'")
        sys.exit(1)

    stat = p.stat()
    if stat.st_size > SECURE_MAX_FILE_SIZE:
        log_error(f"File Exceeds 600 MB Limit ({stat.st_size/(1024*1024):.1f} MB)", "Max size is 600 MB.")
        sys.exit(1)

    print(f"\n{Colors.DIM}Step 1/3: Authorizing secret code {access_code}...{Colors.RESET}")
    auth_url = f"{server}/api/secure/authorize"
    auth_payload = {
        "accessCode": access_code,
        "fileName": p.name,
        "fileType": "application/octet-stream",
        "fileSize": stat.st_size
    }
    req = urllib.request.Request(auth_url, data=json.dumps(auth_payload).encode("utf-8"), headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req) as resp:
        auth_data = json.loads(resp.read().decode("utf-8"))

    upload_url = auth_data["uploadUrl"]
    storage_key = auth_data["storageKey"]

    print(f"{Colors.DIM}Step 2/3: Streaming {p.name} directly to Cloudflare R2...{Colors.RESET}")
    upload_req = urllib.request.Request(upload_url, data=p.read_bytes(), headers={"Content-Type": "application/octet-stream"}, method="PUT")
    with urllib.request.urlopen(upload_req) as resp:
        pass

    print(f"{Colors.DIM}Step 3/3: Finalizing upload and generating Send Code...{Colors.RESET}")
    finalize_url = f"{server}/api/secure/finalize"
    fin_payload = {
        "accessCode": access_code,
        "storageKey": storage_key,
        "fileName": p.name,
        "fileType": "application/octet-stream"
    }
    fin_req = urllib.request.Request(finalize_url, data=json.dumps(fin_payload).encode("utf-8"), headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(fin_req) as resp:
        fin_data = json.loads(resp.read().decode("utf-8"))

    send_code = fin_data.get("sendCode")
    print(f"\n{Colors.GREEN}{Colors.BOLD}✔ Secret Share Upload Complete!{Colors.RESET}")
    print("──────────────────────────────────────────────")
    print(f"  {Colors.BOLD}Secret Send Code:{Colors.RESET} {Colors.MAGENTA}{Colors.BOLD}{send_code}{Colors.RESET}")
    print(f"  {Colors.BOLD}Direct Link:{Colors.RESET}      {Colors.CYAN}{server}/secure?code={send_code}{Colors.RESET}")
    print(f"  {Colors.BOLD}File Uploaded:{Colors.RESET}    {p.name} ({stat.st_size/(1024*1024):.2f} MB)")
    print(f"  {Colors.BOLD}Lifespan:{Colors.RESET}         6 hours")
    print("──────────────────────────────────────────────\n")

def handle_delete(target, pin="", server=DEFAULT_SERVER):
    server = server.rstrip("/")
    if not target:
        try:
            target = input(f"{Colors.CYAN}Enter 6-digit Code or Pasteport URL to delete: {Colors.RESET}")
        except (KeyboardInterrupt, EOFError):
            print("\nAborted.")
            sys.exit(0)

    code = extract_code(target)
    if not pin:
        try:
            pin = input(f"{Colors.CYAN}Enter Self-Destruct PIN (press Enter if none): {Colors.RESET}")
        except (KeyboardInterrupt, EOFError):
            print("\nAborted.")
            sys.exit(0)

    delete_url = f"{server}/api/clips/delete"
    payload = {"code": code}
    if pin:
        payload["pin"] = pin.strip()

    req = urllib.request.Request(delete_url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        print(f"\n{Colors.GREEN}{Colors.BOLD}✔ Clip '{code}' Permanently Destroyed!{Colors.RESET}")
        print(f"{Colors.DIM}Metadata and R2 objects wiped instantly.{Colors.RESET}\n")
    except urllib.error.HTTPError as e:
        log_error("Deletion Refused", e.read().decode("utf-8"))
        sys.exit(1)

def run_interactive_menu():
    print_banner()
    print(f"{Colors.BOLD}Select an action by typing 1, 2, 3, or 4:{Colors.RESET}\n")
    print(f"  {Colors.GREEN}[1]{Colors.RESET} {Colors.BOLD}Standard Share{Colors.RESET}  — Send text or file ({Colors.DIM}up to 10 MB{Colors.RESET})")
    print(f"  {Colors.MAGENTA}[2]{Colors.RESET} {Colors.BOLD}Secret Share{Colors.RESET}    — Send large file ({Colors.DIM}up to 600 MB via 8-digit Code{Colors.RESET})")
    print(f"  {Colors.CYAN}[3]{Colors.RESET} {Colors.BOLD}Retrieve / Get{Colors.RESET}  — View text or download file ({Colors.DIM}Code or URL{Colors.RESET})")
    print(f"  {Colors.RED}[4]{Colors.RESET} {Colors.BOLD}Delete / Wipe{Colors.RESET}   — Permanently destroy a clip with PIN")
    print(f"  {Colors.DIM}[5] Exit{Colors.RESET}\n")

    try:
        choice = input(f"{Colors.BLUE}Choose option [1-5]: {Colors.RESET}").strip()
    except (KeyboardInterrupt, EOFError):
        print("\nExiting.")
        return

    if choice == "1":
        handle_send("")
    elif choice == "2":
        handle_secret("", "")
    elif choice == "3":
        handle_get("")
    elif choice == "4":
        handle_delete("")
    else:
        print("Goodbye!")

def main():
    parser = argparse.ArgumentParser(
        prog="pasteport",
        description="Pasteport CLI: Cross-device sharing & developer toolkit.",
        add_help=False
    )
    subparsers = parser.add_subparsers(dest="command")

    # Send
    send_parser = subparsers.add_parser("send", help="Send text or file to Pasteport")
    send_parser.add_argument("target", nargs="?", default="", help="Text snippet or file path")
    send_parser.add_argument("-p", "--pin", default="", help="4-character access PIN")
    send_parser.add_argument("-e", "--expiry", type=int, default=24, help="Lifespan in hours")
    send_parser.add_argument("-d", "--self-destruct", default="", help="Self-destruct PIN")
    send_parser.add_argument("--json", action="store_true", help="JSON output")
    send_parser.add_argument("--server", default=DEFAULT_SERVER, help="Server override")

    # Secret
    secret_parser = subparsers.add_parser("secret", help="Secret Share large file (up to 600 MB)")
    secret_parser.add_argument("code", nargs="?", default="", help="8-digit access code")
    secret_parser.add_argument("file", nargs="?", default="", help="File path to upload")
    secret_parser.add_argument("--server", default=DEFAULT_SERVER, help="Server override")

    # Get
    get_parser = subparsers.add_parser("get", help="Retrieve text or download file")
    get_parser.add_argument("target", nargs="?", default="", help="6-digit code or URL")
    get_parser.add_argument("-p", "--pin", default="", help="4-character PIN")
    get_parser.add_argument("-o", "--output", default="", help="Destination filepath")
    get_parser.add_argument("--raw", action="store_true", help="Print raw stdout")
    get_parser.add_argument("--json", action="store_true", help="JSON output")
    get_parser.add_argument("--server", default=DEFAULT_SERVER, help="Server override")

    # Delete
    del_parser = subparsers.add_parser("delete", help="Permanently destroy a clip")
    del_parser.add_argument("target", nargs="?", default="", help="6-digit code or URL")
    del_parser.add_argument("-p", "--pin", default="", help="Self-destruct PIN")
    del_parser.add_argument("--server", default=DEFAULT_SERVER, help="Server override")

    parser.add_argument("-v", "--version", action="version", version=f"Pasteport CLI v{VERSION}")
    parser.add_argument("-h", "--help", action="store_true", help="Show help")

    if len(sys.argv) == 1:
        if sys.stdin.isatty():
            run_interactive_menu()
        else:
            handle_send("")
        return

    args, unknown = parser.parse_known_args()

    if args.help:
        print_banner()
        parser.print_help()
        return

    if args.command == "send":
        handle_send(args.target, pin=args.pin, expiry=args.expiry, self_destruct=args.self_destruct, json_output=args.json, server=args.server)
    elif args.command == "secret":
        handle_secret(args.code, args.file, server=args.server)
    elif args.command == "get":
        handle_get(args.target, pin=args.pin, output=args.output, raw=args.raw, json_output=args.json, server=args.server)
    elif args.command == "delete":
        handle_delete(args.target, pin=args.pin, server=args.server)
    else:
        run_interactive_menu()

if __name__ == "__main__":
    main()
