import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { Play, LogOut, Copy, Check, Download, Globe } from 'lucide-react';
import DownloadAddin from '../components/DownloadAddin';

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchCode = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().code) {
          setCode(docSnap.data().code);
        } else {
          setCode("# Write your Fusion 360 Python code here\n");
        }
      } catch (error) {
        console.error("Error fetching code:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCode();
  }, [user]);

  const handleRunCode = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        code: code,
        lastRun: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating code:", error);
      alert("Failed to run code.");
    } finally {
      setTimeout(() => setSaving(false), 500); // small delay for UX
    }
  };

  const copyUid = () => {
    navigator.clipboard.writeText(user.uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#121212] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg">
            F
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Fusion<span className="text-blue-400">Sync</span></h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-sm">
            <span className="text-gray-400">Unique Key:</span>
            <code className="font-mono text-blue-300">{user.uid}</code>
            <button onClick={copyUid} className="p-1 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white">
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
          </div>
          <button 
            onClick={() => auth.signOut()}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-6 max-w-[1600px] w-full mx-auto relative">
        {/* Decorative Glows */}
        <div className="absolute top-20 left-20 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Editor Section */}
        <div className="flex-1 flex flex-col min-h-[600px] bg-[#141414] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative z-10 isolate">
          <div className="bg-[#1a1a1a] border-b border-white/10 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <span className="text-sm text-gray-400 font-mono ml-2">CreateEnclosure.py</span>
            </div>
            <button
              onClick={handleRunCode}
              disabled={saving}
              className={`flex items-center gap-2 px-5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                saving 
                  ? 'bg-blue-600/50 text-white/70 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_15px_rgba(22,163,74,0.3)] hover:shadow-[0_0_20px_rgba(22,163,74,0.5)]'
              }`}
            >
              <Play size={16} className={saving ? 'animate-pulse' : ''} />
              {saving ? 'Syncing...' : 'Run in Fusion'}
            </button>
          </div>
          <div className="flex-1 overflow-auto bg-[#0d0d0d]">
            <CodeMirror
              value={code}
              height="100%"
              theme="dark"
              extensions={[python()]}
              onChange={(value) => setCode(value)}
              className="text-base"
            />
          </div>
        </div>

        {/* Info / Download Side Panel */}
        <div className="w-full lg:w-80 flex flex-col gap-6 relative z-10 shrink-0">
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Download size={20} className="text-blue-400" />
              Setup Guide
            </h2>
            <div className="space-y-4 text-sm text-gray-300">
              <p>To connect your local Fusion 360 to this web controller:</p>
              <ol className="list-decimal list-inside space-y-2 text-gray-400 ml-1">
                <li>Download the Listener Add-in below.</li>
                <li>Extract the `.zip` file.</li>
                <li>In Fusion 360, go to <span className="text-white font-medium">Utilities &gt; Add-Ins</span>.</li>
                <li>Click the green <span className="text-white font-medium">+</span> next to My Add-Ins and select the extracted folder.</li>
                <li>Run the Add-in in Fusion!</li>
              </ol>
              <div className="pt-4 border-t border-white/10">
                <DownloadAddin uid={user.uid} />
              </div>
            </div>
          </div>
          
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Globe size={20} className="text-purple-400" />
              Public REST API
            </h2>
            <div className="space-y-4 text-sm text-gray-300">
              <p className="text-gray-400">Send code from ANY tool (Python, Postman, AI) to your Fusion 360:</p>
              <div className="bg-black/40 rounded-lg p-3 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-gray-500 mb-1">
                  <span>Endpoint</span>
                  <span className="text-green-500 font-bold">POST</span>
                </div>
                <code className="text-[12px] text-blue-300 break-all block">https://your-domain.vercel.app/api/execute</code>
              </div>
              <div className="bg-black/40 rounded-lg p-3 border border-white/5">
                 <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-2">JSON Body</div>
                 <pre className="text-[11px] text-gray-400 font-mono">
{`{
  "key": "${user.uid}",
  "code": "print('Hello')"
}`}
                 </pre>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-[#141414] to-[#0a0a0a] border border-blue-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Play size={100} />
            </div>
            <h3 className="font-medium text-white mb-2 relative z-10">Real-time Sync</h3>
            <p className="text-sm text-gray-400 leading-relaxed relative z-10">
              When you click <strong>Run</strong>, your code is securely synced to Firebase. The local Fusion listener detects the change instantly and rebuilds your CAD model.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
