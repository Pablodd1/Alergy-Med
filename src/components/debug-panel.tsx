'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Bug, CheckCircle2, XCircle, Info, Send, Terminal } from 'lucide-react'

export function DebugPanel() {
    const [logs, setLogs] = useState<string[]>([])
    const [isOpen, setIsOpen] = useState(false)

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50))
    }

    const testHealth = async () => {
        addLog('Testing /api/health...')
        try {
            const res = await fetch('/api/health')
            const data = await res.json()
            addLog(`Health Check: ${JSON.stringify(data)}`)
        } catch (e) {
            addLog(`Health Check Failed: ${e}`)
        }
    }

    const testPermissions = async () => {
        addLog('Checking browser permissions...')
        try {
            const mic = await navigator.permissions.query({ name: 'microphone' as any })
            const cam = await navigator.permissions.query({ name: 'camera' as any })
            addLog(`Microphone: ${mic.state}`)
            addLog(`Camera: ${cam.state}`)
        } catch (e) {
            addLog('Permission API not supported in this browser.')
        }
    }

    const checkEnv = async () => {
        addLog('System Environment Check...')
        addLog(`User Agent: ${navigator.userAgent}`)
        addLog(`Cookies Enabled: ${navigator.cookieEnabled}`)
        addLog(`Online: ${navigator.onLine}`)
    }

    if (!isOpen) {
        return (
            <div className="fixed bottom-4 right-4 z-50">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsOpen(true)}
                    className="bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
                >
                    <Bug className="w-4 h-4 mr-2" />
                    Debug Tools
                </Button>
            </div>
        )
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-lg">
            <Card className="shadow-2xl border-2 border-yellow-300">
                <CardHeader className="bg-yellow-50 py-3 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-sm font-bold flex items-center">
                            <Bug className="w-4 h-4 mr-2" />
                            Environment Debugger
                        </CardTitle>
                        <CardDescription className="text-xs">Testing & Diagnostics</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>✕</Button>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={testHealth}>
                            <Send className="w-3 h-3 mr-1" /> Health API
                        </Button>
                        <Button size="sm" variant="outline" onClick={testPermissions}>
                            <Info className="w-3 h-3 mr-1" /> Permissions
                        </Button>
                        <Button size="sm" variant="outline" onClick={checkEnv}>
                            <Terminal className="w-3 h-3 mr-1" /> Check Sys
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setLogs([])}>
                            Clear
                        </Button>
                    </div>

                    <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs h-48 overflow-y-auto whitespace-pre-wrap border border-gray-800 shadow-inner">
                        {logs.length === 0 ? '> Ready for testing...' : logs.map((log, i) => (
                            <div key={i} className="mb-1 border-b border-gray-800 pb-1">{log}</div>
                        ))}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-start gap-3">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-blue-800">Pro-Tip</p>
                            <p className="text-[10px] text-blue-700 leading-tight">
                                If transcription fails with 500, check Vercel Logs for "OPENAI_API_KEY missing".
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
