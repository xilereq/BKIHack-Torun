import type { View } from '../App'

export function DemoPanel({ onClose }: { view: View; onSwitchView: (v: View) => void; onClose: () => void }) {
  return (
    <div className="fixed right-4 bottom-4 rounded-card bg-surface p-4 shadow-xl">
      Panel demo <button onClick={onClose}>×</button>
    </div>
  )
}
