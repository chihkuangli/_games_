/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import SnakeGame from './components/SnakeGame';

export default function App() {
  return (
    <main className="min-h-screen bg-cyber-bg flex items-center justify-center p-4">
      {/* Decorative background scanlines */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[length:100%_2px,3px_100%]" />
      
      <div className="relative z-10 w-full flex justify-center">
        <SnakeGame />
      </div>
    </main>
  );
}
