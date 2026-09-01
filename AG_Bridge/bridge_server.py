import threading
import time
import logging
import os
import queue
from flask import Flask, request, jsonify
from flask_cors import CORS
import customtkinter as ctk
import pyautogui

# Disable flask logging to keep console clean
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

app = Flask(__name__)
CORS(app)

# --- THREAD-SAFE STATE CONTAINER ---
class BridgeState:
    def __init__(self):
        self._lock = threading.Lock()
        self._is_attached = False
        self._script_queue = queue.Queue()
        self._last_result = None

    @property
    def is_attached(self):
        with self._lock:
            return self._is_attached

    @is_attached.setter
    def is_attached(self, value):
        with self._lock:
            self._is_attached = value

    def push_script(self, script_str):
        self._script_queue.put(script_str)

    def pop_script(self):
        try:
            return self._script_queue.get_nowait()
        except queue.Empty:
            return None

    @property
    def last_result(self):
        with self._lock:
            return self._last_result

    @last_result.setter
    def last_result(self, value):
        with self._lock:
            self._last_result = value

state = BridgeState()
ui_app = None

# --- FLASK ENDPOINTS ---

@app.route('/connect', methods=['POST'])
def handle_connect():
    state.is_attached = True
    if ui_app:
        ui_app.update_status(True)
        ui_app.log_message("SYS", "Lua Linker connected from Roblox client.")
    return jsonify({"status": "connected", "message": "Bridge attached successfully."}), 200

@app.route('/script/queue', methods=['GET'])
def get_script_queue():
    script = state.pop_script()
    if script is not None:
        if ui_app:
            ui_app.log_message("LUA", f"Executor pulled script ({len(script)} bytes).")
        return script, 200
    return "", 204

@app.route('/script/result', methods=['POST'])
def handle_script_result():
    data = request.json or {}
    state.last_result = data
    if ui_app:
        status = data.get("status", "unknown")
        msg = data.get("message", "")
        if status == "success":
            ui_app.log_message("RES", f"Success: {msg}")
        else:
            ui_app.log_message("ERR", f"Execution error ({data.get('type')}): {msg}")
    return jsonify({"status": "received"}), 200

@app.route('/ag/queue', methods=['POST'])
def ag_queue_script():
    if not state.is_attached:
        return jsonify({"error": "Potassium is not attached yet!"}), 403
    
    script = request.data.decode('utf-8')
    state.push_script(script)
    state.last_result = None  # Reset result
    if ui_app:
        ui_app.log_message("SYS", f"AI queued a new script ({len(script)} bytes).")
    return jsonify({"status": "queued"}), 200

@app.route('/in_game_command', methods=['POST'])
def handle_in_game_command():
    data = request.json or {}
    cmd = data.get("command", "").strip()
    if not cmd:
        return jsonify({"status": "error", "message": "Empty command"}), 400
    
    if ui_app:
        ui_app.log_message("LUA", f"In-Game AG Command received: {cmd}")
    
    lower_cmd = cmd.lower()
    lua_script = None

    if lower_cmd == "fly" or lower_cmd == "make me fly":
        lua_script = '''
local LocalPlayer = game:GetService("Players").LocalPlayer
local UserInputService = game:GetService("UserInputService")
local char = LocalPlayer.Character
if char and char:FindFirstChild("HumanoidRootPart") then
    local hrp = char.HumanoidRootPart
    local existing = hrp:FindFirstChild("CyberFlyBodyVelocity")
    if not existing then
        local bv = Instance.new("BodyVelocity")
        bv.Name = "CyberFlyBodyVelocity"
        bv.MaxForce = Vector3.new(1e5, 1e5, 1e5)
        bv.Velocity = Vector3.new(0, 0, 0)
        bv.Parent = hrp

        local bg = Instance.new("BodyGyro")
        bg.Name = "CyberFlyBodyGyro"
        bg.MaxTorque = Vector3.new(1e5, 1e5, 1e5)
        bg.CFrame = hrp.CFrame
        bg.Parent = hrp

        task.spawn(function()
            local camera = workspace.CurrentCamera
            while hrp:FindFirstChild("CyberFlyBodyVelocity") do
                local moveDir = Vector3.zero
                if UserInputService:IsKeyDown(Enum.KeyCode.W) then moveDir = moveDir + camera.CFrame.LookVector end
                if UserInputService:IsKeyDown(Enum.KeyCode.S) then moveDir = moveDir - camera.CFrame.LookVector end
                if UserInputService:IsKeyDown(Enum.KeyCode.A) then moveDir = moveDir - camera.CFrame.RightVector end
                if UserInputService:IsKeyDown(Enum.KeyCode.D) then moveDir = moveDir + camera.CFrame.RightVector end
                if UserInputService:IsKeyDown(Enum.KeyCode.E) or UserInputService:IsKeyDown(Enum.KeyCode.Space) then moveDir = moveDir + Vector3.new(0, 1, 0) end
                if UserInputService:IsKeyDown(Enum.KeyCode.Q) then moveDir = moveDir - Vector3.new(0, 1, 0) end
                bv.Velocity = moveDir * 50
                bg.CFrame = camera.CFrame
                task.wait()
            end
        end)
    end
end
'''
    elif lower_cmd == "unfly":
        lua_script = '''
local LocalPlayer = game:GetService("Players").LocalPlayer
local char = LocalPlayer.Character
if char and char:FindFirstChild("HumanoidRootPart") then
    local hrp = char.HumanoidRootPart
    local bv = hrp:FindFirstChild("CyberFlyBodyVelocity")
    local bg = hrp:FindFirstChild("CyberFlyBodyGyro")
    if bv then bv:Destroy() end
    if bg then bg:Destroy() end
end
'''
    elif "deleted esp" in lower_cmd or "remove esp" in lower_cmd:
        lua_script = '''
local Players = game:GetService("Players")
for _, p in ipairs(Players:GetPlayers()) do
    if p.Character then
        local hl = p.Character:FindFirstChild("CyberHighlight")
        if hl then hl:Destroy() end
    end
end
'''
    elif lower_cmd.startswith("speed"):
        import re
        match = re.search(r'\d+', lower_cmd)
        spd = match.group(0) if match else "32"
        lua_script = f'''
local LocalPlayer = game:GetService("Players").LocalPlayer
if LocalPlayer.Character and LocalPlayer.Character:FindFirstChildOfClass("Humanoid") then
    LocalPlayer.Character:FindFirstChildOfClass("Humanoid").WalkSpeed = {spd}
end
'''

    reply_msg = "Command processed by Bridge Server."
    if lower_cmd in ["hi", "hello", "hey"]:
        reply_msg = "Hello! Antigravity AI Linker is online and ready for commands."
    elif lower_cmd == "fly" or lower_cmd == "make me fly":
        reply_msg = "Fly Mode activated via AI Bridge! 🕊️ (WASD + Space/E, Q)"
    elif lower_cmd == "unfly":
        reply_msg = "Fly Mode disabled. 🛑"
    elif "deleted esp" in lower_cmd or "remove esp" in lower_cmd:
        reply_msg = "Player ESP Highlights removed. 👁️"
    elif lower_cmd.startswith("speed"):
        import re
        match = re.search(r'\d+', lower_cmd)
        spd = match.group(0) if match else "32"
        reply_msg = f"WalkSpeed set to {spd}. 🏃"
    else:
        reply_msg = f"AI received command: '{cmd}'. Sent to execution queue."

    if lua_script:
        state.push_script(lua_script)
        if ui_app:
            ui_app.log_message("SYS", f"Generated & Queued execution script for: '{cmd}'")

    state.last_result = {"status": "success", "message": f"Executed: {cmd}"}
    return jsonify({"status": "received", "command": cmd, "response": reply_msg, "queued": lua_script is not None}), 200

@app.route('/ag/result', methods=['GET'])
def ag_get_result():
    res = state.last_result
    if res is not None:
        state.last_result = None  # Consume result
        return jsonify(res), 200
    return jsonify({"status": "pending"}), 202

@app.route('/control/mouse', methods=['POST'])
def control_mouse():
    if not state.is_attached:
        return jsonify({"error": "Not attached"}), 403
    data = request.json or {}
    x, y = data.get('x'), data.get('y')
    click = data.get('click', False)
    
    if x is not None and y is not None:
        try:
            pyautogui.moveTo(int(x), int(y), duration=0.3)
            if click:
                pyautogui.click()
            if ui_app:
                ui_app.log_message("SYS", f"Mouse control: Moved to ({x}, {y}) " + ("with Click" if click else ""))
            return jsonify({"status": "moved"}), 200
        except Exception as e:
            if ui_app:
                ui_app.log_message("ERR", f"Mouse move error: {str(e)}")
            return jsonify({"error": str(e)}), 500
    return jsonify({"error": "Invalid coordinates"}), 400

@app.route('/control/screenshot', methods=['GET'])
def take_screenshot():
    try:
        vision_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'vision')
        os.makedirs(vision_dir, exist_ok=True)
        
        timestamp = time.strftime("%Y%m%d-%H%M%S")
        filepath = os.path.join(vision_dir, f"screenshot_{timestamp}.png")
        pyautogui.screenshot(filepath)
        
        if ui_app:
            ui_app.log_message("SYS", f"Captured screenshot: {os.path.basename(filepath)}")
            
        return jsonify({"status": "success", "path": filepath}), 200
    except Exception as e:
        if ui_app:
            ui_app.log_message("ERR", f"Screenshot error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/ag/alert', methods=['POST'])
def handle_alert():
    data = request.json or {}
    msg = data.get('message', 'Unknown Alert')
    level = data.get('level', 'warning')
    
    if ui_app:
        ui_app.log_alert(level.upper(), msg)
        
    return jsonify({"status": "received"}), 200

def run_server():
    app.run(host='127.0.0.1', port=8080, debug=False, use_reloader=False)

# --- UI APPLICATION ---

class BridgeApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        # Window Config
        self.title("AG-Potassium Bridge v2.0")
        self.geometry("540x420")
        self.resizable(False, False)
        
        # Color System (Cyberpunk/Dark Slate)
        self.configure(fg_color="#121416")

        # Grid system config
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(2, weight=1)

        # Header Title Banner
        self.title_banner = ctk.CTkFrame(self, fg_color="#1A1D20", height=60, corner_radius=0)
        self.title_banner.grid(row=0, column=0, sticky="ew", pady=(0, 15))
        
        self.title_label = ctk.CTkLabel(
            self.title_banner, 
            text="ANTIGRAVITY ↔ POTASSIUM BRIDGE", 
            text_color="#00E5FF", 
            font=ctk.CTkFont(family="Consolas", size=18, weight="bold")
        )
        self.title_label.pack(pady=15)

        # Status Indicator Widget
        self.status_frame = ctk.CTkFrame(self, fg_color="#1A1D20", height=40, corner_radius=8)
        self.status_frame.grid(row=1, column=0, padx=20, pady=5, sticky="ew")
        
        self.status_indicator = ctk.CTkLabel(
            self.status_frame, 
            text="⏳ WAITING FOR POTASSIUM CLIENT...", 
            text_color="#FFC107", 
            font=ctk.CTkFont(family="Consolas", size=13, weight="bold")
        )
        self.status_indicator.pack(pady=8)

        # Rich Log Box Widget
        self.log_box = ctk.CTkTextbox(
            self, 
            fg_color="#0D0E10", 
            text_color="#ECEFF1", 
            font=ctk.CTkFont(family="Consolas", size=11),
            corner_radius=8,
            border_width=1,
            border_color="#24282D"
        )
        self.log_box.grid(row=2, column=0, padx=20, pady=15, sticky="nsew")
        self.log_box.configure(state="disabled")
        
        # Setup terminal color tags
        tb = self.log_box._textbox
        tb.tag_config("SYS", foreground="#00E5FF", font=("Consolas", 11, "bold"))
        tb.tag_config("ERR", foreground="#FF3D00", font=("Consolas", 11, "bold"))
        tb.tag_config("LUA", foreground="#FFC107", font=("Consolas", 11, "bold"))
        tb.tag_config("RES", foreground="#00E676", font=("Consolas", 11, "bold"))
        tb.tag_config("INFO", foreground="#B0BEC5")

        # Control Panel / Bottom Frame
        self.bottom_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.bottom_frame.grid(row=3, column=0, padx=20, pady=(0, 20), sticky="ew")
        self.bottom_frame.grid_columnconfigure(0, weight=1)

        self.kill_btn = ctk.CTkButton(
            self.bottom_frame, 
            text="🛑 EMERGENCY SHUTDOWN", 
            fg_color="#D32F2F", 
            hover_color="#F44336",
            font=ctk.CTkFont(family="Consolas", size=12, weight="bold"),
            command=self.kill_switch
        )
        self.kill_btn.grid(row=0, column=0, sticky="ew")

        # Initial Boot Logging
        self.log_message("SYS", "Control Bridge Server initialized.")
        self.log_message("INFO", "Listening on http://127.0.0.1:8080")
        self.log_message("INFO", "Waiting for Lua connection from Roblox game Client...")

    def update_status(self, is_connected):
        def _apply():
            if is_connected:
                self.status_indicator.configure(text="✅ BRIDGE ACTIVE & READY", text_color="#00E676")
            else:
                self.status_indicator.configure(text="⏳ WAITING FOR POTASSIUM CLIENT...", text_color="#FFC107")
        self.after(0, _apply)

    def log_message(self, tag, msg):
        def _apply():
            self.log_box.configure(state="normal")
            time_str = time.strftime("%H:%M:%S")
            
            tb = self.log_box._textbox
            prefix = f"[{time_str}] "
            tag_str = f"[{tag}]"
            suffix = f" {msg}\n"
            
            tb.insert("end", prefix)
            tag_start = tb.index("end-1c")
            tb.insert("end", tag_str)
            tag_end = tb.index("end-1c")
            tb.insert("end", suffix)
            
            tb.tag_add(tag, tag_start, tag_end)
            self.log_box.see("end")
            self.log_box.configure(state="disabled")
        self.after(0, _apply)

    def log_alert(self, level, msg):
        def _apply():
            self.log_message("ERR", f"ALERT ({level}): {msg}")
            self.status_indicator.configure(text=f"🚨 {level}: {msg[:30].upper()}...", text_color="#FF3D00")
            self.after(4000, lambda: self.update_status(state.is_attached))
        self.after(0, _apply)

    def kill_switch(self):
        self.log_message("SYS", "Initiating complete bridge process termination...")
        self.update()
        time.sleep(0.5)
        self.destroy()
        os._exit(0)

if __name__ == "__main__":
    ctk.set_appearance_mode("dark")
    ctk.set_default_color_theme("blue")

    ui_app = BridgeApp()
    
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    ui_app.mainloop()

