import urllib.request
import json
import traceback
import sys

def print_section(title, content_list):
    if not content_list:
        return
    print(f"\n=== {title.upper()} (Found {len(content_list)}) ===")
    for item in content_list[:15]:
        if isinstance(item, dict):
            class_name = item.get('Class', 'UnknownClass')
            path = item.get('Path', '')
            name = item.get('Name', '')
            if path:
                print(f"  • [{class_name}] {path}")
            elif name:
                print(f"  • {name} ({class_name})")
            else:
                print(f"  • {json.dumps(item)}")
        else:
            print(f"  • {item}")
    if len(content_list) > 15:
        print(f"  ... and {len(content_list) - 15} more items.")

def main():
    # Force UTF-8 Output on Windows systems
    if sys.platform.startswith('win'):
        sys.stdout.reconfigure(encoding='utf-8')

    url = 'http://127.0.0.1:8080/ag/result'
    print(f"Connecting to bridge server at {url} to fetch result...")
    
    req = urllib.request.Request(url, method='GET')
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            
            status = data.get('status', 'unknown')
            if status == 'pending':
                print("⏳ The script is still executing or no result is pending.")
                return

            if status == 'error':
                print(f"❌ Script Execution Failed ({data.get('type', 'runtime')}):")
                print(data.get('message', 'No error message provided'))
                return

            # Status is success
            raw_payload = data.get('data', 'nil')
            if raw_payload == 'nil':
                print("✅ Script executed successfully but returned no data.")
                return
            
            try:
                parsed = json.loads(raw_payload)
            except Exception:
                print(f"✅ Success. Raw return value: {raw_payload}")
                return

            print("✅ Success. Decoded return payload:")
            if isinstance(parsed, list) and len(parsed) > 0:
                report = parsed[0]
                
                # Check if it looks like a GameAnalyzer report
                if isinstance(report, dict) and ('Remotes' in report or 'WorkspaceInteractables' in report):
                    print_section("Remotes", report.get('Remotes'))
                    print_section("Interactables", report.get('WorkspaceInteractables'))
                    print_section("Scripts", report.get('Scripts'))
                    
                    # Log other keys if any
                    other_keys = [k for k in report.keys() if k not in ('Remotes', 'WorkspaceInteractables', 'Scripts')]
                    if other_keys:
                        print("\n=== ADDITIONAL REPORT DATA ===")
                        for k in other_keys:
                            print(f"  • {k}: {report[k]}")
                else:
                    # Generic JSON formatting
                    print(json.dumps(parsed, indent=2, ensure_ascii=False))
            else:
                print(json.dumps(parsed, indent=2, ensure_ascii=False))

    except Exception as e:
        print(f"❌ Error occurred: {e}")
        traceback.print_exc()

if __name__ == '__main__':
    main()
