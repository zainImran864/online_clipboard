'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    alpha: number;
    color: string;
    size: number;
}

interface Obstacle {
    x: number;
    y: number;
    width: number;
    height: number;
    passed: boolean;
    type: 'scissors' | 'bug' | 'shredder';
}

interface Item {
    x: number;
    y: number;
    size: number;
    collected: boolean;
    type: 'star' | 'doc';
}

export default function ClipboardMiniGame() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('pasteport_game_highscore');
            return saved ? parseInt(saved, 10) || 0 : 0;
        }
        return 0;
    });

    const stateRef = useRef({
        planeY: 150,
        velocity: 0,
        gravity: 0.35,
        lift: -6.5,
        obstacles: [] as Obstacle[],
        items: [] as Item[],
        particles: [] as Particle[],
        frameCount: 0,
        score: 0,
        gameState: 'idle' as 'idle' | 'playing' | 'gameover',
    });

    // Sync state
    useEffect(() => {
        stateRef.current.gameState = gameState;
    }, [gameState]);

    const jump = () => {
        if (stateRef.current.gameState === 'idle' || stateRef.current.gameState === 'gameover') {
            // Reset and start
            stateRef.current.planeY = 140;
            stateRef.current.velocity = stateRef.current.lift;
            stateRef.current.obstacles = [];
            stateRef.current.items = [];
            stateRef.current.particles = [];
            stateRef.current.score = 0;
            stateRef.current.frameCount = 0;
            setScore(0);
            setGameState('playing');
        } else if (stateRef.current.gameState === 'playing') {
            stateRef.current.velocity = stateRef.current.lift;

            // Spawn jump trail particles
            for (let i = 0; i < 4; i++) {
                stateRef.current.particles.push({
                    x: 60,
                    y: stateRef.current.planeY + 12,
                    vx: -(Math.random() * 2 + 1),
                    vy: (Math.random() - 0.5) * 2,
                    alpha: 1,
                    color: '#60a5fa',
                    size: Math.random() * 3 + 2,
                });
            }
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                jump();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;

        const render = () => {
            const width = canvas.width;
            const height = canvas.height;

            // Clear
            ctx.clearRect(0, 0, width, height);

            // Background sky gradient
            const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
            bgGrad.addColorStop(0, '#f0f9ff');
            bgGrad.addColorStop(1, '#e0f2fe');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, width, height);

            // Draw grid lines (clipboard paper style)
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            for (let y = 20; y < height; y += 24) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }

            // Draw red margin line
            ctx.strokeStyle = '#fca5a5';
            ctx.beginPath();
            ctx.moveTo(35, 0);
            ctx.lineTo(35, height);
            ctx.stroke();

            const st = stateRef.current;

            if (st.gameState === 'playing') {
                st.frameCount += 1;

                // Apply physics
                st.velocity += st.gravity;
                st.planeY += st.velocity;

                // Floor / ceiling collision
                if (st.planeY < 10) {
                    st.planeY = 10;
                    st.velocity = 0;
                }
                if (st.planeY > height - 25) {
                    st.planeY = height - 25;
                    st.gameState = 'gameover';
                    setGameState('gameover');
                }

                // Spawn obstacles
                if (st.frameCount % 90 === 0) {
                    const obstacleHeight = Math.floor(Math.random() * 80) + 40;
                    const isTop = Math.random() > 0.5;
                    const types: ('scissors' | 'bug' | 'shredder')[] = ['scissors', 'bug', 'shredder'];
                    const pickedType = types[Math.floor(Math.random() * types.length)];

                    st.obstacles.push({
                        x: width + 20,
                        y: isTop ? 0 : height - obstacleHeight,
                        width: 28,
                        height: obstacleHeight,
                        passed: false,
                        type: pickedType,
                    });
                }

                // Spawn collectible data packets
                if (st.frameCount % 120 === 0) {
                    st.items.push({
                        x: width + 20,
                        y: Math.floor(Math.random() * (height - 80)) + 30,
                        size: 14,
                        collected: false,
                        type: Math.random() > 0.4 ? 'star' : 'doc',
                    });
                }

                // Update & draw obstacles
                for (let i = st.obstacles.length - 1; i >= 0; i--) {
                    const obs = st.obstacles[i];
                    obs.x -= 3;

                    // Draw obstacle
                    ctx.fillStyle = '#ef4444';
                    ctx.beginPath();
                    ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 8);
                    ctx.fill();

                    // Obstacle icon label
                    ctx.font = '14px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(
                        obs.type === 'scissors' ? '✂️' : obs.type === 'bug' ? '🐛' : '⚡',
                        obs.x + obs.width / 2,
                        obs.y + (obs.y === 0 ? obs.height - 8 : 20)
                    );

                    // Check collision
                    const planeBox = { x: 50, y: st.planeY, width: 24, height: 18 };
                    if (
                        planeBox.x < obs.x + obs.width &&
                        planeBox.x + planeBox.width > obs.x &&
                        planeBox.y < obs.y + obs.height &&
                        planeBox.y + planeBox.height > obs.y
                    ) {
                        st.gameState = 'gameover';
                        setGameState('gameover');
                    }

                    // Score when passed
                    if (!obs.passed && obs.x + obs.width < 50) {
                        obs.passed = true;
                        st.score += 10;
                        setScore(st.score);
                    }

                    // Remove offscreen
                    if (obs.x + obs.width < -30) {
                        st.obstacles.splice(i, 1);
                    }
                }

                // Update & draw items
                for (let i = st.items.length - 1; i >= 0; i--) {
                    const item = st.items[i];
                    item.x -= 3;

                    if (!item.collected) {
                        ctx.font = '16px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText(item.type === 'star' ? '⭐' : '📄', item.x, item.y);

                        // Check item collection
                        const dist = Math.hypot(55 - item.x, st.planeY + 10 - item.y);
                        if (dist < 22) {
                            item.collected = true;
                            st.score += 25;
                            setScore(st.score);

                            // Sparkle particles
                            for (let p = 0; p < 8; p++) {
                                st.particles.push({
                                    x: item.x,
                                    y: item.y,
                                    vx: (Math.random() - 0.5) * 4,
                                    vy: (Math.random() - 0.5) * 4,
                                    alpha: 1,
                                    color: '#f59e0b',
                                    size: Math.random() * 3 + 2,
                                });
                            }
                        }
                    }

                    if (item.x < -30) {
                        st.items.splice(i, 1);
                    }
                }
            }

            // Update & draw particles
            for (let i = st.particles.length - 1; i >= 0; i--) {
                const p = st.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= 0.03;

                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;

                if (p.alpha <= 0) {
                    st.particles.splice(i, 1);
                }
            }

            // Draw Paper Plane (Player)
            ctx.save();
            ctx.translate(55, st.planeY + 9);
            const rotation = Math.max(-0.4, Math.min(0.6, st.velocity * 0.08));
            ctx.rotate(rotation);

            // Plane shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.beginPath();
            ctx.ellipse(0, 16, 12, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Plane body (monogram paper glider)
            ctx.fillStyle = '#2563eb';
            ctx.beginPath();
            ctx.moveTo(14, 0);
            ctx.lineTo(-12, -9);
            ctx.lineTo(-6, 0);
            ctx.lineTo(-12, 9);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.moveTo(14, 0);
            ctx.lineTo(-6, 0);
            ctx.lineTo(-12, -9);
            ctx.closePath();
            ctx.fill();

            ctx.restore();

            // Check highscore on gameover
            if (st.gameState === 'gameover') {
                if (st.score > highScore) {
                    setHighScore(st.score);
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('pasteport_game_highscore', st.score.toString());
                    }
                }
            }

            animationId = requestAnimationFrame(render);
        };

        animationId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationId);
    }, [highScore]);

    return (
        <div className="mx-auto w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700">
                        🎮
                    </span>
                    <div>
                        <h3 className="text-sm font-extrabold text-slate-800">Pasteport Glider Mini-Game</h3>
                        <p className="text-[11px] text-slate-400">Jump over obstacles & collect clipboard stars</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                    <div className="text-right">
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Score</span>
                        <span className="font-extrabold text-blue-600">{score}</span>
                    </div>
                    <div className="text-right">
                        <span className="block text-[10px] uppercase font-bold text-slate-400">High</span>
                        <span className="font-extrabold text-emerald-600">{highScore}</span>
                    </div>
                </div>
            </div>

            <div
                onClick={jump}
                className="relative mt-3 cursor-pointer select-none overflow-hidden rounded-2xl border border-slate-200"
            >
                <canvas
                    ref={canvasRef}
                    width={480}
                    height={220}
                    className="block w-full h-[220px]"
                />

                {/* Overlays */}
                {gameState === 'idle' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/30 text-center backdrop-blur-2xs">
                        <div className="rounded-2xl bg-white/95 px-5 py-3 shadow-lg">
                            <p className="text-sm font-extrabold text-slate-800">Tap / Click or Press Space to Play!</p>
                            <p className="mt-0.5 text-[11px] text-slate-500">Dodge scissors & bugs to stay in the air</p>
                        </div>
                    </div>
                )}

                {gameState === 'gameover' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 text-center backdrop-blur-2xs animate-fadeIn">
                        <div className="rounded-2xl bg-white/95 px-6 py-4 shadow-xl">
                            <p className="text-base font-extrabold text-red-600">Game Over!</p>
                            <p className="mt-1 text-xs text-slate-600">
                                Score: <b className="font-mono text-blue-600">{score}</b> · High: <b className="font-mono text-emerald-600">{highScore}</b>
                            </p>
                            <button
                                onClick={jump}
                                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-95"
                            >
                                ↺ Play Again
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span>Controls: <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] text-slate-600 font-bold">Space</kbd> / <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] text-slate-600 font-bold">↑</kbd> or Tap screen</span>
                <span>Enjoy while waiting or preparing a new clip!</span>
            </div>
        </div>
    );
}
