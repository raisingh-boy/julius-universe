const fs = require('fs');
let content = fs.readFileSync('src/components/AudioPlayer.tsx', 'utf8');

// The mini player is docked at bottom-right, overlapping the + button on mobile!
// We will change it to be at top on mobile, or bottom-right only on md+.
// "fixed bottom-4 right-4 w-[360px]" -> "fixed top-16 md:top-auto md:bottom-20 right-4 w-[calc(100%-2rem)] md:w-[360px] left-4 md:left-auto"

const targetMiniPlayerClass = `className="fixed bottom-4 right-4 w-[360px] bg-[#0E1528]/95 border border-white/10 backdrop-blur-md p-3 rounded-2xl flex items-center justify-between shadow-2xl z-40 cursor-pointer hover:border-yellow-500/30 transition-all animate-slide-in select-none"`;
const replacementMiniPlayerClass = `className="fixed top-20 md:top-auto md:bottom-20 right-4 left-4 md:left-auto w-[calc(100%-2rem)] md:w-[360px] bg-[#0E1528]/95 border border-white/10 backdrop-blur-md p-3 rounded-2xl flex items-center justify-between shadow-2xl z-40 cursor-pointer hover:border-yellow-500/30 transition-all animate-slide-in select-none"`;
content = content.replace(targetMiniPlayerClass, replacementMiniPlayerClass);

// Also we should make sure the main player doesn't go below the safe area.
const targetMainPlayerClass = `className="fixed md:top-24 top-auto bottom-0 left-0 md:w-[460px] w-full md:h-[calc(100vh-120px)] h-[82vh] bg-[#090D16]/98 border-t md:border-t-0 md:border-r border-white/10 backdrop-blur-lg text-gray-200 z-40 shadow-2xl flex flex-col overflow-hidden animate-slide-in rounded-t-3xl md:rounded-t-none"`;
const replacementMainPlayerClass = `className="fixed md:top-24 top-auto bottom-0 left-0 md:w-[460px] w-full md:h-[calc(100vh-120px)] h-[85vh] bg-[#090D16]/98 border-t md:border-t-0 md:border-r border-white/10 backdrop-blur-lg text-gray-200 z-40 shadow-2xl flex flex-col overflow-hidden animate-slide-in rounded-t-3xl md:rounded-t-none pb-[env(safe-area-inset-bottom)]"`;
content = content.replace(targetMainPlayerClass, replacementMainPlayerClass);

fs.writeFileSync('src/components/AudioPlayer.tsx', content);
console.log("Updated AudioPlayer.tsx mobile classes");
