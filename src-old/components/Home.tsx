import { useState } from 'react'
import { Power, ChevronDown, Activity } from 'lucide-react'
import { toast } from 'sonner'

const servers = [
  { flag: '🇳🇱', name: 'Netherlands', code: 'NL', ping: '24ms' },
  { flag: '🇩🇪', name: 'Germany', code: 'DE', ping: '32ms' },
  { flag: '��', name: 'Turkey', code: 'TR', ping: '45ms' },
  { flag: '��', name: 'Latvia', code: 'LV', ping: '38ms' },
]

const Sparkline = ({ active }: { active: boolean }) => {
  const points = Array.from({ length: 24 }, (_, i) =>
    active ? 20 + Math.sin(i * 0.6) * 12 + Math.random() * 8 : 2
  )
  const max = Math.max(...points, 1)
  const h = 40
  const w = 200
  const d = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w
    const y = h - (p / max) * h
    return i === 0 ? `M${x},${y}` : `L${x},${y}`
  }).join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0066FF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0066FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${w},${h} L0,${h} Z`} fill="url(#sparkGrad)" />
      <path d={d} fill="none" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Home() {
  const [vpnOn, setVpnOn] = useState(true)
  const [selectedServer, setSelectedServer] = useState(servers[0])
  const [serverDropdownOpen, setServerDropdownOpen] = useState(false)

  return (
    <div className="space-y-5">
      {/* Mesh gradient hero */}
      <div className="mesh-gradient -mx-5 -mt-4 pt-8 pb-10 flex flex-col items-center relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient animate-pulse-mesh opacity-80" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Ping ring */}
          <div className="relative">
            {vpnOn && (
              <div className="absolute inset-0 -m-4 rounded-full border-2 border-[#0066FF]/30 animate-ping" />
            )}

            {/* Main VPN button */}
            <button
              onClick={() => {
                setVpnOn(!vpnOn)
                toast(vpnOn ? 'NOX отключён' : 'NOX подключён', { icon: vpnOn ? '🔴' : '🟢' })
              }}
              className={`w-36 h-36 rounded-full flex items-center justify-center transition-all duration-700 relative ${
                vpnOn
                  ? 'shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.1),0_0_60px_rgba(0,102,255,0.5),0_0_120px_rgba(0,102,255,0.2)] border border-[#0066FF]/40'
                  : 'shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-2px_6px_rgba(0,0,0,0.3),0_4px_20px_rgba(0,0,0,0.3)] border border-white/10'
              }`}
              style={{
                background: vpnOn
                  ? 'linear-gradient(145deg, hsl(211 100% 55%), hsl(211 100% 45%))'
                  : 'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
              }}
            >
              <Power
                className={`w-14 h-14 transition-all duration-500 ${
                  vpnOn ? 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]' : 'text-gray-500'
                }`}
                strokeWidth={1.8}
              />
            </button>
          </div>

          <p className={`mt-5 text-sm font-bold tracking-wide transition-colors duration-500 ${
            vpnOn ? 'text-[#0066FF]' : 'text-gray-500'
          }`}>
            {vpnOn ? 'Защищено' : 'Отключено'}
          </p>
        </div>
      </div>

      {/* Live Stats */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Live Data</h3>
          <Activity className="w-3.5 h-3.5 text-[#0066FF]/50" />
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-extrabold tracking-tight">{vpnOn ? '24' : '—'}</p>
            <p className="text-[10px] text-gray-500 font-medium mt-0.5">Ping, ms</p>
          </div>
          <div className="flex-1">
            <Sparkline active={vpnOn} />
          </div>
          <div className="text-center">
            <p className="text-2xl font-extrabold tracking-tight">{vpnOn ? '110' : '—'}</p>
            <p className="text-[10px] text-gray-500 font-medium mt-0.5">Mbps</p>
          </div>
        </div>
      </div>

      {/* Server Selector */}
      <div className="relative">
        <button
          onClick={() => setServerDropdownOpen(!serverDropdownOpen)}
          className={`w-full glass-card p-4 flex items-center gap-3 transition-all duration-200 active:scale-[0.98]`}
        >
          <span className="text-2xl">{selectedServer.flag}</span>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold">{selectedServer.name}</p>
            <p className="text-[11px] text-gray-500">{selectedServer.ping} ping</p>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${serverDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {serverDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 glass rounded-2xl overflow-hidden z-20 animate-fade-in-up">
            {servers.map((s, i) => (
              <button
                key={s.code}
                onClick={() => {
                  setSelectedServer(s)
                  setServerDropdownOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                  s.code === selectedServer.code ? 'bg-[#0066FF]/5' : 'hover:bg-white/5'
                } ${i < servers.length - 1 ? 'border-b border-white/10' : ''}`}
              >
                <span className="text-lg">{s.flag}</span>
                <span className="flex-1 text-left text-sm font-medium">{s.name}</span>
                <span className="text-xs text-gray-500">{s.ping}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
