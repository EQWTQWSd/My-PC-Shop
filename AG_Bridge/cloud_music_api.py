"""
Cloud Music Bridge API v1.6 (Production Cloud Version - Anti-Bot Bypass Edition)
Supports YouTube Search, MP3 Audio Extraction via android/ios/mweb client skip, Disk-Based Logging, and Direct HTTP Audio Streaming.
"""

import os
import re
import sys
import uuid
import json
import datetime
import threading
import subprocess
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

AUDIO_CACHE_DIR = os.path.join(os.getcwd(), "audio_cache")
JOBS_CACHE_DIR = os.path.join(AUDIO_CACHE_DIR, "jobs")
LOG_FILE_PATH = os.path.join(os.getcwd(), "server_logs.txt")
os.makedirs(JOBS_CACHE_DIR, exist_ok=True)

def log_event(level, message):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted_log = f"[{timestamp}] [{level.upper()}] {message}"
    print(formatted_log, flush=True)
    try:
        with open(LOG_FILE_PATH, "a", encoding="utf-8") as f:
            f.write(formatted_log + "\n")
    except Exception as e:
        print(f"Error writing log file: {e}")

log_event("INFO", "=== Cloud Music Bridge API Server v1.6 Initialized ===")

def auto_update_ytdlp():
    try:
        log_event("INFO", "Checking for yt-dlp updates...")
        res = subprocess.run([sys.executable, "-m", "pip", "install", "--upgrade", "yt-dlp"], capture_output=True, text=True)
        if res.returncode == 0:
            log_event("INFO", "yt-dlp is updated to the latest version.")
        else:
            log_event("WARNING", f"yt-dlp update notice: {res.stderr[:200]}")
    except Exception as e:
        log_event("ERROR", f"Failed to check yt-dlp update: {e}")

threading.Thread(target=auto_update_ytdlp, daemon=True).start()

def save_job_status(job_id, data):
    job_file = os.path.join(JOBS_CACHE_DIR, f"{job_id}.json")
    try:
        with open(job_file, "w", encoding="utf-8") as f:
            json.dump(data, f)
    except Exception as e:
        log_event("ERROR", f"Error saving job {job_id}: {e}")

def get_job_status(job_id):
    job_file = os.path.join(JOBS_CACHE_DIR, f"{job_id}.json")
    if os.path.exists(job_file):
        try:
            with open(job_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            log_event("ERROR", f"Failed reading job file {job_id}: {e}")
    return {"status": "not_found", "progress": "0%"}

def parse_time(time_str):
    if not time_str:
        return "N/A"
    try:
        sec = int(time_str)
        mins = sec // 60
        secs = sec % 60
        return f"{mins:02d}:{secs:02d}"
    except Exception:
        return str(time_str)

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({
        "status": "online",
        "service": "Roblox Cloud Music Bridge API",
        "version": "1.6",
        "endpoints": ["/search", "/download", "/job_status", "/stream/<filename>", "/logs", "/logs/clear"]
    })

@app.route("/logs", methods=["GET"])
def view_server_logs():
    limit = request.args.get("limit", 100, type=int)
    logs = []
    if os.path.exists(LOG_FILE_PATH):
        try:
            with open(LOG_FILE_PATH, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()
                logs = [line.strip() for line in lines if line.strip()][-limit:]
        except Exception as e:
            logs = [f"Error reading log file: {e}"]
    return jsonify({
        "status": "success",
        "total_logs": len(logs),
        "logs": logs
    })

@app.route("/logs/clear", methods=["GET", "POST"])
def clear_server_logs():
    try:
        with open(LOG_FILE_PATH, "w", encoding="utf-8") as f:
            f.write(f"[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [INFO] Logs cleared.\n")
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    log_event("INFO", "Server logs cleared.")
    return jsonify({"status": "success", "message": "Logs cleared successfully"})

@app.route("/search", methods=["POST"])
def search_youtube():
    data = request.get_json(silent=True) or {}
    query = data.get("query", "").strip()
    max_results = int(data.get("max_results", 5))

    if not query:
        log_event("WARNING", "Search request rejected: missing query")
        return jsonify({"error": "Missing 'query' parameter"}), 400

    log_event("INFO", f"Searching YouTube for: '{query}'")

    try:
        cmd = [
            "yt-dlp",
            f"ytsearch{max_results}:{query}",
            "--dump-single-json",
            "--flat-playlist",
            "--no-warnings",
            "--force-ipv4",
            "--extractor-args", "youtube:player_skip=web,web_creator",
            "--extractor-args", "youtube:player_client=android,ios,mweb"
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="ignore")
        if result.returncode == 0 and result.stdout:
            raw_data = json.loads(result.stdout)
            entries = raw_data.get("entries", [])
            results = []
            for entry in entries:
                v_id = entry.get("id")
                url = entry.get("url") or (f"https://www.youtube.com/watch?v={v_id}" if v_id else None)
                if url:
                    results.append({
                        "title": entry.get("title", "Unknown Title"),
                        "url": url,
                        "uploader": entry.get("uploader") or entry.get("channel", "YouTube"),
                        "duration": parse_time(entry.get("duration"))
                    })
            log_event("INFO", f"Search succeeded for '{query}', found {len(results)} items")
            return jsonify({"status": "success", "results": results})
        else:
            log_event("ERROR", f"Search failed for '{query}': {result.stderr[:200]}")
            return jsonify({"status": "error", "message": "No search results found", "details": result.stderr[:200]}), 404
    except Exception as e:
        log_event("ERROR", f"Exception during search for '{query}': {e}")
        return jsonify({"error": str(e)}), 500

def async_download_job(job_id, url):
    filename = f"{job_id}.mp3"
    filepath = os.path.join(AUDIO_CACHE_DIR, filename)

    log_event("INFO", f"Job {job_id}: Starting audio download for URL: {url}")
    save_job_status(job_id, {
        "status": "downloading",
        "url": url,
        "progress": "0%",
        "filename": filename
    })

    cmd = [
        "yt-dlp",
        "-o", os.path.join(AUDIO_CACHE_DIR, f"{job_id}.%(ext)s"),
        "-x", "--audio-format", "mp3",
        "--newline",
        "--no-playlist",
        "--no-check-certificates",
        "--force-ipv4",
        "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "--extractor-args", "youtube:player_skip=web,web_creator",
        "--extractor-args", "youtube:player_client=android,ios,mweb",
        url
    ]

    try:
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="ignore")
        last_error_log = ""
        for line in process.stdout:
            line_str = line.strip()
            if line_str:
                last_error_log = line_str
            if "[download]" in line_str and "%" in line_str:
                match = re.search(r'(\d+(?:\.\d+)?%)', line_str)
                if match:
                    save_job_status(job_id, {
                        "status": "downloading",
                        "url": url,
                        "progress": match.group(1),
                        "filename": filename
                    })
            elif "ERROR:" in line_str or "WARNING:" in line_str:
                log_event("WARNING", f"Job {job_id}: {line_str}")

        process.wait()

        if process.returncode == 0 and os.path.exists(filepath):
            log_event("INFO", f"Job {job_id}: Download COMPLETED -> {filename}")
            save_job_status(job_id, {
                "status": "completed",
                "progress": "100%",
                "filename": filename,
                "stream_url": f"/stream/{filename}"
            })
        else:
            err_msg = f"yt-dlp exit code {process.returncode}: {last_error_log[:150]}"
            log_event("ERROR", f"Job {job_id} FAILED: {err_msg}")
            save_job_status(job_id, {
                "status": "failed",
                "progress": "0%",
                "error": err_msg
            })
    except Exception as e:
        log_event("ERROR", f"Job {job_id} Exception: {e}")
        save_job_status(job_id, {
            "status": "failed",
            "progress": "0%",
            "error": str(e)
        })

@app.route("/download", methods=["POST"])
def trigger_download():
    data = request.get_json(silent=True) or {}
    url = data.get("url", "").strip()

    if not url:
        log_event("WARNING", "Download request rejected: missing URL")
        return jsonify({"error": "Missing 'url' parameter"}), 400

    if not url.startswith("http://") and not url.startswith("https://"):
        log_event("INFO", f"Search term passed instead of URL, prepending ytsearch: '{url}'")
        url = f"ytsearch1:{url}"

    job_id = str(uuid.uuid4())[:8]
    log_event("INFO", f"Created Download Job {job_id} for: {url}")
    threading.Thread(target=async_download_job, args=(job_id, url), daemon=True).start()

    return jsonify({
        "status": "success",
        "job_id": job_id,
        "message": "Audio conversion started on Cloud Server!"
    })

@app.route("/job_status", methods=["GET"])
def check_job_status():
    job_id = request.args.get("id", "").strip()
    return jsonify(get_job_status(job_id))

@app.route("/stream/<filename>", methods=["GET"])
def stream_audio(filename):
    filepath = os.path.join(AUDIO_CACHE_DIR, filename)
    if os.path.exists(filepath):
        log_event("INFO", f"Streaming file to client: {filename}")
        return send_file(filepath, mimetype="audio/mpeg")
    log_event("WARNING", f"Stream requested for missing file: {filename}")
    return jsonify({"error": "File not found"}), 404

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8081))
    log_event("INFO", f"Starting Flask server on port {port}...")
    app.run(host="0.0.0.0", port=port)
