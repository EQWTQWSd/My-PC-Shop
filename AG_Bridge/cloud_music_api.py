"""
Cloud Music Bridge API v1.2 (24/7 Hosted Service - Enhanced YouTube Cloud Bypass)
Supports YouTube Search, MP3 Audio Extraction with Android Client Bypass, Shared Job Tracking across Gunicorn Workers, and Direct HTTP Audio Streaming.
"""

import os
import re
import uuid
import json
import threading
import subprocess
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

AUDIO_CACHE_DIR = os.path.join(os.getcwd(), "audio_cache")
JOBS_CACHE_DIR = os.path.join(AUDIO_CACHE_DIR, "jobs")
os.makedirs(JOBS_CACHE_DIR, exist_ok=True)

def save_job_status(job_id, data):
    job_file = os.path.join(JOBS_CACHE_DIR, f"{job_id}.json")
    try:
        with open(job_file, "w", encoding="utf-8") as f:
            json.dump(data, f)
    except Exception as e:
        print(f"Error saving job {job_id}: {e}")

def get_job_status(job_id):
    job_file = os.path.join(JOBS_CACHE_DIR, f"{job_id}.json")
    if os.path.exists(job_file):
        try:
            with open(job_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
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
        "version": "1.2",
        "endpoints": ["/search", "/download", "/job_status", "/stream/<filename>"]
    })

@app.route("/search", methods=["POST"])
def search_youtube():
    data = request.get_json(silent=True) or {}
    query = data.get("query", "").strip()
    max_results = int(data.get("max_results", 5))

    if not query:
        return jsonify({"error": "Missing 'query' parameter"}), 400

    try:
        cmd = [
            "yt-dlp",
            f"ytsearch{max_results}:{query}",
            "--dump-single-json",
            "--flat-playlist",
            "--no-warnings",
            "--extractor-args", "youtube:player_client=android,web"
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
            return jsonify({"status": "success", "results": results})
        else:
            return jsonify({"status": "error", "message": "No search results found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def async_download_job(job_id, url):
    filename = f"{job_id}.mp3"
    filepath = os.path.join(AUDIO_CACHE_DIR, filename)

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
        "--extractor-args", "youtube:player_client=android,web",
        url
    ]

    try:
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="ignore")
        for line in process.stdout:
            line_str = line.strip()
            if "[download]" in line_str and "%" in line_str:
                match = re.search(r'(\d+(?:\.\d+)?%)', line_str)
                if match:
                    save_job_status(job_id, {
                        "status": "downloading",
                        "url": url,
                        "progress": match.group(1),
                        "filename": filename
                    })
        process.wait()

        if process.returncode == 0 and os.path.exists(filepath):
            save_job_status(job_id, {
                "status": "completed",
                "progress": "100%",
                "filename": filename,
                "stream_url": f"/stream/{filename}"
            })
        else:
            save_job_status(job_id, {
                "status": "failed",
                "progress": "0%",
                "error": "yt-dlp execution failed"
            })
    except Exception as e:
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
        return jsonify({"error": "Missing 'url' parameter"}), 400

    job_id = str(uuid.uuid4())[:8]
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
        return send_file(filepath, mimetype="audio/mpeg")
    return jsonify({"error": "File not found"}), 404

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8081))
    print(f"[Cloud API] Starting server on port {port}...")
    app.run(host="0.0.0.0", port=port)
