import React, { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Play, Power, Volume2, VolumeX, Pause } from "lucide-react";

export default function VideoShowcase() {
    const containerRef = useRef(null);
    const videoRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [progress, setProgress] = useState(0);

    // Trigger autoplay when scrolled into view
    const isInView = useInView(containerRef, { amount: 0.5, once: true });

    useEffect(() => {
        if (isInView && videoRef.current && !isPlaying) {
            videoRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(err => console.warn("Autoplay prevented:", err));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isInView]);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) videoRef.current.pause();
        else videoRef.current.play();
        setIsPlaying(!isPlaying);
    };

    const toggleMute = (e) => {
        e.stopPropagation();
        if (!videoRef.current) return;
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const total = videoRef.current.duration;
            setProgress((current / total) * 100);
        }
    };

    return (
        <section
            ref={containerRef}
            className="relative bg-[#F9F8F6] py-10 md:py-16 overflow-hidden border-b border-black/5 font-['Poppins',sans-serif]"
        >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">

                {/* Header */}
                <div className="text-center mb-6 md:mb-10">
                    <div className="text-[9px] font-bold tracking-[0.2em] text-[#FF6600] uppercase mb-1">
                        Step Inside
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#111111] tracking-tight inline-flex flex-wrap items-center justify-center gap-x-1.5">
                        <span>Experience the</span>

                        {/* Brand Logo Group */}
                        <span className="inline-flex items-center align-middle">
                            <span className="font-extrabold tracking-[0.14em] text-black">
                                 CONSTRUCT
                            </span>

                            <span className="font-extrabold tracking-[0.14em] bg-gradient-to-r from-[#FF6600] to-[#FF0000] bg-clip-text text-transparent">
                                ONS
                            </span>
                            <sup className="text-[9px] md:text-[11px] text-[#FF6600] font-bold ml-0.5 -top-1">
                                ™
                            </sup>
                        </span>

                        <span>difference.</span>
                    </h2>
                </div>

                {/* Living Room Scene Container */}
                <div className="relative max-w-[50rem] mx-auto flex flex-col items-center">

                    {/* Wall Backlight Glow (Syncs with play state) */}
                    <div
                        className={`absolute top-10 w-4/5 h-56 rounded-full transition-opacity duration-1000 blur-[60px] pointer-events-none -z-10 ${isPlaying ? "bg-[#FF6600]/20 scale-105" : "bg-black/5 scale-95"
                            }`}
                    />

                    {/* =========================================
              TV UNIT
          ========================================= */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="w-full relative z-20 px-2"
                    >
                        {/* Soft Ambient Wall Shadow */}
                        <div className="absolute -inset-2 md:-inset-6 bg-black/10 blur-[25px] rounded-full -z-10" />

                        {/* TV Outer Bezel */}
                        <div className="relative rounded-lg md:rounded-2xl bg-[#1A1A1A] p-1.5 md:p-2 pb-2 md:pb-3 shadow-[0_20px_45px_rgba(0,0,0,0.3)] border border-white/10 ring-1 ring-black">

                            {/* Screen Area */}
                            <div
                                className="relative aspect-video bg-[#111111] rounded md:rounded-xl overflow-hidden cursor-pointer group"
                                onClick={togglePlay}
                            >
                                <video
                                    ref={videoRef}
                                    src="/videos/tv.mp4"
                                    poster="https://images.pexels.com/photos/2219024/pexels-photo-2219024.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                                    className="w-full h-full object-cover"
                                    loop
                                    muted={isMuted}
                                    playsInline
                                    onTimeUpdate={handleTimeUpdate}
                                />

                                {/* Subtle Screen Glare Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none" />

                                {/* Paused Overlay */}
                                <div
                                    className={`absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center transition-all duration-400 ${isPlaying ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
                                        }`}
                                >
                                    {/* CONSTRUCT ⏻ NS Branding */}
                                    <div className="flex items-center gap-0.5 text-white mb-4 select-none">
                                        <span className="font-extrabold text-sm sm:text-lg md:text-2xl tracking-[0.14em] leading-none">
                                            CONSTRUCT
                                        </span>
                                        <Power className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#FF6600] stroke-[3] mx-0.5" />
                                        <span className="font-extrabold text-sm sm:text-lg md:text-2xl tracking-[0.14em] bg-gradient-to-r from-[#FF6600] to-[#FF0000] bg-clip-text text-transparent leading-none">
                                            NS
                                        </span>
                                        <span className="text-[8px] md:text-[10px] text-[#FF6600] font-bold self-start mt-0.5 ml-0.5">
                                            ™
                                        </span>
                                    </div>

                                    {/* Play Button */}
                                    <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-r from-[#FF6600] to-[#FF0000] flex items-center justify-center text-white shadow-[0_0_30px_rgba(255,102,0,0.6)] group-hover:scale-110 transition-transform duration-300">
                                        <Play className="w-6 h-6 md:w-8 md:h-8 ml-1 fill-current" />
                                    </div>
                                    <p className="mt-3 text-[9px] md:text-xs font-semibold tracking-widest uppercase text-white/80">
                                        Watch Video
                                    </p>
                                </div>

                                {/* Controls overlay when playing */}
                                {isPlaying && (
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-3">
                                        <div className="flex items-center justify-between">
                                            {/* Play/Pause icon indicator */}
                                            <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#FF6600] backdrop-blur text-white flex items-center justify-center transition">
                                                <Pause className="w-4 h-4 fill-current" />
                                            </button>

                                            {/* Quick Mute Control */}
                                            <button
                                                onClick={toggleMute}
                                                className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur flex items-center justify-center transition"
                                                title={isMuted ? "Unmute" : "Mute"}
                                            >
                                                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Progress Scrubbing Bar */}
                                {isPlaying && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                                        <div
                                            className="h-full bg-gradient-to-r from-[#FF6600] to-[#FF0000] transition-all duration-75"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Status LED Indicator */}
                            <div className="absolute bottom-0.5 md:bottom-1 left-1/2 -translate-x-1/2">
                                <div
                                    className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full transition-colors duration-500 ${isPlaying
                                            ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"
                                            : "bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.8)]"
                                        }`}
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Cable Concealer Trunking */}
                    <div className="w-1.5 h-6 md:h-8 bg-[#DCD4C7] border-x border-black/10 z-0 shadow-inner -my-1" />

                    {/* =========================================
              MINIMALIST SOUNDBAR
          ========================================= */}
                    <div className="relative z-10 w-2/5 max-w-[240px] h-2.5 md:h-3.5 bg-[#1F1F1F] rounded shadow-[0_5px_10px_rgba(0,0,0,0.2)] border-t border-white/10 flex items-center justify-center mb-0.5">
                        <div className="w-full h-full opacity-30" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "3px 3px" }} />
                        <div className="absolute w-1.5 h-px bg-white/20 rounded-full" />
                    </div>

                    {/* =========================================
              CLEAN WOODEN CONSOLE
          ========================================= */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                        className="w-11/12 md:w-4/5 max-w-3xl bg-[#E5D7C0] rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.06)] border-t-[3px] border-[#CBB89A] flex gap-1.5 p-1.5 h-16 md:h-24 relative z-10"
                    >
                        {/* FIXED: Seated Vase Decor */}
                        <div className="absolute -top-[1.65rem] md:-top-[2.2rem] left-8 md:left-14 flex flex-col items-center pointer-events-none z-20">
                            {/* Stems Container */}
                            <div className="relative flex items-end justify-center h-3.5 md:h-5 w-4">
                                <div className="w-[1.5px] h-3 md:h-4.5 bg-[#8A7A68] -rotate-12 origin-bottom rounded-full" />
                                <div className="w-[1.5px] h-3.5 md:h-5 bg-[#8A7A68] rotate-12 origin-bottom rounded-full -ml-0.5" />
                            </div>
                            {/* Vase Body */}
                            <div className="w-3.5 h-4 md:w-4 md:h-5 bg-rose-200/90 rounded-b-md rounded-t-sm border border-rose-300/80 shadow-xs -mt-1 z-10" />
                        </div>

                        {/* Left Rattan Door */}
                        <div className="flex-1 bg-[#D8C7AD] border border-[#CBB89A] rounded overflow-hidden relative">
                            <div
                                className="absolute inset-0 opacity-30"
                                style={{
                                    backgroundImage:
                                        "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)",
                                }}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 md:w-1.5 h-4 md:h-5 bg-[#B5A182] rounded-sm shadow-xs" />
                        </div>

                        {/* Middle Rattan Door */}
                        <div className="flex-1 bg-[#D8C7AD] border border-[#CBB89A] rounded overflow-hidden relative">
                            <div
                                className="absolute inset-0 opacity-30"
                                style={{
                                    backgroundImage:
                                        "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)",
                                }}
                            />
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 md:w-1.5 h-4 md:h-5 bg-[#B5A182] rounded-sm shadow-xs" />
                        </div>

                        {/* Right Open Shelves */}
                        <div className="flex-1 flex flex-col gap-1.5 md:gap-2">
                            <div className="flex-1 bg-[#D1BEA1] border border-[#CBB89A] rounded shadow-inner relative flex items-center justify-center">
                                <div className="w-8 md:w-12 h-1 md:h-1.5 bg-pink-300/80 rounded-sm" />
                            </div>
                            <div className="flex-1 bg-[#D1BEA1] border border-[#CBB89A] rounded shadow-inner relative flex items-center justify-center">
                                <div className="w-10 md:w-16 h-1.5 md:h-2 bg-teal-700/30 border border-teal-800/20 rounded-sm" />
                            </div>
                        </div>
                    </motion.div>

                    {/* Console Furniture Legs */}
                    <div className="w-10/12 md:w-[70%] max-w-[600px] flex justify-between px-6 md:px-8 -mt-0.5 z-0">
                        <div className="w-2 md:w-3 h-4 md:h-5 bg-[#B8A68B] border-t border-black/10 [clip-path:polygon(0_0,100%_0,70%_100%,30%_100%)]" />
                        <div className="w-2 md:w-3 h-4 md:h-5 bg-[#B8A68B] border-t border-black/10 [clip-path:polygon(0_0,100%_0,70%_100%,30%_100%)]" />
                    </div>

                    {/* Floor Shadow beneath console */}
                    <div className="w-3/4 max-w-[500px] h-2 bg-black/10 blur-sm rounded-full -mt-1 md:-mt-2" />

                </div>
            </div>
        </section>
    );
}