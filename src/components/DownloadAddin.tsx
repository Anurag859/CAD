import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Download } from 'lucide-react';
import { useState } from 'react';

interface DownloadAddinProps {
  uid: string;
}

export default function DownloadAddin({ uid }: DownloadAddinProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const zip = new JSZip();
      
      const folderName = "FusionFirebaseListener";
      const folder = zip.folder(folderName);
      if (!folder) throw new Error("Could not create zip folder");

      // 1. Manifest file
      const manifestContent = `{
  "autodeskProduct": "Fusion360",
  "type": "addin",
  "id": "e8c207ec-d2be-49cd-906d-a6003923bb2e",
  "author": "FusionSync",
  "description": {
    "": "Listens to Firebase for CAD script changes."
  },
  "version": "1.0",
  "runOnStartup": false,
  "supportedOS": "windows|mac",
  "editEnabled": true
}`;
      folder.file(`${folderName}.manifest`, manifestContent);

      // 2. Python Script
      const pythonContent = `import adsk.core, adsk.fusion, traceback
import threading
import json
import urllib.request
import time

app = None
ui = None
customEventScriptId = 'FusionFirebaseListener_ExecuteScript'
handlers = []

# --- CONFIGURATION ---
UNIQUE_KEY = "${uid}"
FIREBASE_URL = f"https://firestore.googleapis.com/v1/projects/cad-61e27/databases/(default)/documents/users/{UNIQUE_KEY}"
POLL_INTERVAL = 3.0 # seconds
# ---------------------

stop_polling = False
polling_thread = None
last_run_time = None

class ExecuteScriptHandler(adsk.core.CustomEventHandler):
    def notify(self, args):
        try:
            eventArgs = adsk.core.CustomEventArgs.cast(args)
            script_code = eventArgs.additionalInfo
            
            # Execute the script in a controlled environment
            global_vars = {'adsk': adsk, 'app': app, 'ui': ui, '__name__': '__main__'}
            exec(script_code, global_vars)
            
            if 'run' in global_vars:
                # Call the run function
                global_vars['run']({'is_hot_reload': True})
                
        except Exception as e:
            if ui:
                ui.messageBox('Live Reload Execution Failed:\\n{}'.format(traceback.format_exc()))

def poll_firestore():
    global stop_polling, last_run_time, app
    
    while not stop_polling:
        try:
            req = urllib.request.Request(FIREBASE_URL)
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
                
                fields = result.get('fields', {})
                code = fields.get('code', {}).get('stringValue', '')
                current_last_run = fields.get('lastRun', {}).get('stringValue', '')

                # Only run if code is present and a new 'lastRun' timestamp is detected
                # This ensures we don't infinitely re-run the same code on startup
                if code and current_last_run and current_last_run != last_run_time:
                    last_run_time = current_last_run
                    # Fire custom event to ensure code runs on main thread
                    if app:
                        app.fireCustomEvent(customEventScriptId, code)

        except urllib.error.HTTPError as e:
            print(f"HTTP Error pulling from Firebase: {e.code}")
        except Exception as e:
            print(f"Error polling Firebase: {e}")
            
        time.sleep(POLL_INTERVAL)

def run(context):
    global app, ui, polling_thread, stop_polling
    try:
        app = adsk.core.Application.get()
        ui  = app.userInterface
        
        # Register custom event
        customEventScript = app.registerCustomEvent(customEventScriptId)
        onCustomEventScript = ExecuteScriptHandler()
        customEventScript.add(onCustomEventScript)
        handlers.append(onCustomEventScript)
        
        # Start polling thread
        stop_polling = False
        polling_thread = threading.Thread(target=poll_firestore)
        polling_thread.daemon = True
        polling_thread.start()
        
        ui.messageBox('FusionSync Add-In Started.\\nListening to Firebase with Key:\\n' + UNIQUE_KEY)

    except Exception:
        if ui:
            ui.messageBox('Failed:\\n{}'.format(traceback.format_exc()))

def stop(context):
    global polling_thread, stop_polling, app, ui
    try:
        stop_polling = True
        
        if app:
            app.unregisterCustomEvent(customEventScriptId)
            
        if polling_thread:
            polling_thread.join(timeout=2)
            
        handlers.clear()

    except Exception:
        pass
`;
      folder.file(`${folderName}.py`, pythonContent);

      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, "FusionFirebaseListener.zip");

    } catch (e) {
      console.error(e);
      alert("Error generating zip file.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button 
      onClick={handleDownload}
      disabled={downloading}
      className={`w-full ${downloading ? 'bg-white/10' : 'bg-blue-600/20 hover:bg-blue-600/40 border-blue-500/50'} border text-white rounded-lg py-3 flex items-center justify-center gap-2 transition-all font-medium`}
    >
      <Download size={18} className={downloading ? 'animate-bounce' : ''} />
      {downloading ? 'Generating Add-in...' : 'Download Fusion Add-in'}
    </button>
  );
}
