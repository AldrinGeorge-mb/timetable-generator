import React, { useState, useEffect, useRef } from 'react';
import Toast from './Toast';
import AuthModal from './AuthModal';

const API = 'http://localhost:5000';

const LandingPage = ({ onSelectProject }) => {
    const canvasRef = useRef(null);

    // --- Dynamic State Logic ---
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [toast, setToast] = useState({ message: '', type: 'info' });
    const showToast = (message, type = 'info') => setToast({ message, type });

    // Mock User Auth State
    const [user, setUser] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Initial Auth Check
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetch(`${API}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(r => {
                    if (r.ok) return r.json();
                    throw new Error('Invalid token');
                })
                .then(data => setUser(data))
                .catch(() => localStorage.removeItem('token'));
        }
    }, []);

    // Fetch projects
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setProjects([]);
            setLoading(false);
            return;
        }
        fetch(`${API}/api/projects`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) setProjects(data);
                else setProjects([]);
            })
            .catch(() => showToast('Failed to connect to backend', 'error'))
            .finally(() => setLoading(false));
    }, [user]);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        const token = localStorage.getItem('token');
        if (!token) {
            setShowAuthModal(true);
            return;
        }
        setCreating(true);
        try {
            const resp = await fetch(`${API}/api/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() })
            });
            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(err.error || 'Failed');
            }
            const project = await resp.json();
            setProjects(prev => [project, ...prev]);
            setNewName('');
            setNewDesc('');
            setShowForm(false);
            showToast(`Project "${project.name}" created.`, 'success');
        } catch (e) {
            showToast(e.message, 'error');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (project, e) => {
        e.stopPropagation();
        if (!window.confirm(`Delete project "${project.name}" and all its data? This cannot be undone.`)) return;
        const token = localStorage.getItem('token');
        try {
            await fetch(`${API}/api/projects/${project._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setProjects(prev => prev.filter(p => p._id !== project._id));
            showToast(`Project "${project.name}" deleted.`, 'warning');
        } catch {
            showToast('Failed to delete project.', 'error');
        }
    };

    // --- Atmospheric Animation Logic ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        const targetMouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        const handleMouseMove = (e) => {
            targetMouse.x = e.clientX;
            targetMouse.y = e.clientY;
        };

        window.addEventListener('mousemove', handleMouseMove);

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resize);
        resize();

        // Particle system for "Digital Dust"
        const particles = Array.from({ length: 80 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            speedX: (Math.random() - 0.5) * 0.8,
            speedY: (Math.random() - 0.5) * 0.8,
            baseOpacity: Math.random() * 0.5 + 0.1
        }));

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Lerp mouse
            mouse.x += (targetMouse.x - mouse.x) * 0.05;
            mouse.y += (targetMouse.y - mouse.y) * 0.05;

            // Draw Mesh Gradient Background
            const time = Date.now() * 0.0005;
            const gradient = ctx.createRadialGradient(
                mouse.x + Math.sin(time) * 50,
                mouse.y + Math.cos(time) * 50,
                0,
                canvas.width / 2,
                canvas.height / 2,
                canvas.width * 1.2
            );
            gradient.addColorStop(0, '#1a1a3a');
            gradient.addColorStop(0.5, '#131326');
            gradient.addColorStop(1, '#0d0d15');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw and update Particles
            particles.forEach(p => {
                // Mouse repulsion
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 150) {
                    const force = (150 - distance) / 150;
                    p.x -= (dx / distance) * force * 2;
                    p.y -= (dy / distance) * force * 2;
                }

                p.x += p.speedX;
                p.y += p.speedY;

                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                ctx.fillStyle = `rgba(165, 180, 252, ${p.baseOpacity})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                // Connect to mouse
                if (distance < 200) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(165, 180, 252, ${(1 - distance / 200) * 0.2})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            });

            // Connect particles to each other
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 100) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(165, 180, 252, ${(1 - dist / 100) * 0.15})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="relative min-h-screen w-full bg-[#0d0d15] text-white font-serif selection:bg-indigo-500/30">
            {toast.message && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
            )}

            {showAuthModal && (
                <AuthModal
                    onClose={() => setShowAuthModal(false)}
                    onLoginSuccess={(u) => {
                        setUser(u);
                        setShowAuthModal(false);
                        showToast(`Welcome back, ${u.username}!`, 'success');
                    }}
                />
            )}

            {/* Background Layer */}
            <canvas
                ref={canvasRef}
                className="fixed inset-0 pointer-events-none z-0"
            />

            {/* Navigation */}
            <nav className="relative z-10 flex justify-between items-center px-8 py-6 animate-in fade-in slide-in-from-top-4 duration-1000">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 text-indigo-400">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                            <path d="M8 14h.01"></path>
                            <path d="M12 14h.01"></path>
                            <path d="M16 14h.01"></path>
                        </svg>
                    </div>
                    <span className="text-2xl font-medium tracking-tight text-white/90">Schedulify</span>
                </div>

                <div className="relative" ref={dropdownRef}>
                    {user ? (
                        <>
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="group flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 shadow-sm hover:shadow-indigo-500/10"
                            >
                                <div className="relative">
                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 group-hover:border-indigo-400/50 transition-colors">
                                        <img
                                            src={user.avatar}
                                            alt={user.username}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    {/* Emerald Online Status Indicator */}
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#050505] rounded-full"></div>
                                </div>

                                <div className="flex flex-col items-start hidden sm:flex">
                                    <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors leading-none tracking-tight">
                                        {user.username}
                                    </span>
                                </div>

                                {/* Dropdown Chevron */}
                                <svg className={`w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-all duration-300 ml-1 hidden sm:block ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-[#131326]/90 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right z-50">
                                    <div className="p-4 border-b border-white/10">
                                        <p className="text-xs font-medium text-slate-400 mb-0.5">Signed in as</p>
                                        <p className="text-sm font-bold text-white truncate">{user.username}</p>
                                    </div>
                                    <div className="p-2">

                                        <button
                                            onClick={() => {
                                                localStorage.removeItem('token');
                                                setUser(null);
                                                setDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors mt-1"
                                        >
                                            <svg className="w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <button
                            onClick={() => setShowAuthModal(true)}
                            className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/20 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_25px_rgba(79,70,229,0.3)] backdrop-blur-md"
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 max-w-7xl mx-auto px-8 pt-24 pb-12">
                <header className="mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                    <h1 className="text-7xl font-light mb-4 tracking-tight leading-tight">
                        Welcome to <span className="italic text-indigo-300">Schedulify</span>.
                    </h1>
                    <p className="text-xl text-white/50 font-sans font-light max-w-2xl">
                        Smart school scheduling is now incredibly simple. Just enter your teachers, subjects, and class requirements into the system, and let us handle the rest. Schedulify instantly generates a flawless, ready-to-use timetable with zero double-bookings, delivering a perfectly balanced schedule for your entire school in seconds.
                    </p>
                </header>

                {/* Workspace Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">

                    {/* New Workspace Form / Card */}
                    {showForm ? (
                        <div className="group relative aspect-[4/3] flex flex-col justify-center p-8 border-2 border-indigo-500/50 rounded-3xl bg-indigo-500/5 transition-all duration-500">
                            <h3 className="font-sans text-lg text-white mb-4">New Project</h3>
                            <input
                                autoFocus
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-sans text-sm focus:outline-none focus:border-indigo-500/50 mb-3"
                                placeholder="Project Name..."
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                disabled={creating}
                            />
                            <textarea
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-sans text-sm focus:outline-none focus:border-indigo-500/50 mb-4 resize-none h-20"
                                placeholder="Optional description..."
                                value={newDesc}
                                onChange={e => setNewDesc(e.target.value)}
                                disabled={creating}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 py-2 font-sans text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!newName.trim() || creating}
                                    className="flex-1 py-2 font-sans text-xs uppercase tracking-widest text-indigo-300 bg-indigo-500/10 rounded-lg hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
                                >
                                    {creating ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowForm(true)}
                            className="group relative aspect-[4/3] flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all duration-500 cursor-pointer"
                        >
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                <svg className="w-6 h-6 text-white/40 group-hover:text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M12 5v14M5 12h14"></path>
                                </svg>
                            </div>
                            <span className="mt-4 font-sans text-sm text-white/30 group-hover:text-indigo-300 uppercase tracking-widest">New Project</span>
                        </button>
                    )}

                    {/* Render Dynamic Workspaces */}
                    {loading ? (
                        <div className="aspect-[4/3] flex items-center justify-center border border-white/5 rounded-3xl bg-white/5">
                            <div className="w-8 h-8 border-2 border-white/10 border-t-indigo-500 rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        projects.map(project => {
                            const date = new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            return (
                                <div
                                    key={project._id}
                                    onClick={() => onSelectProject(project)}
                                    className="group relative aspect-[4/3] p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-500 overflow-hidden cursor-pointer flex flex-col justify-between"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px] group-hover:bg-indigo-500/20 transition-colors pointer-events-none"></div>

                                    <div className="relative z-10 w-full">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="px-3 py-1 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] uppercase tracking-widest font-sans border border-indigo-500/30">Active</div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => handleDelete(project, e)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-white/20 hover:text-red-400 transition-colors z-20"
                                                    title="Delete Project"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                    </svg>
                                                </button>
                                                <span className="text-white/20 font-sans text-xs">Created: {date}</span>
                                            </div>
                                        </div>
                                        <h3 className="text-3xl font-light leading-tight line-clamp-2 pr-4">{project.name}</h3>
                                        {project.description && (
                                            <p className="mt-2 text-white/40 font-sans text-sm line-clamp-2">{project.description}</p>
                                        )}
                                    </div>

                                    <div className="relative z-10">
                                        <button className="flex items-center gap-2 text-indigo-300 group/btn">
                                            <span className="font-sans text-xs uppercase tracking-widest group-hover/btn:mr-2 transition-all">Open Project</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path d="M5 12h14M12 5l7 7-7 7"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 px-8 py-12 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-white/5 animate-in fade-in duration-1000 delay-700 mt-20">
                <p className="font-sans text-xs text-white/20 uppercase tracking-widest">© 2026 Schedulify Intelligence Systems. All rights reserved.</p>

            </footer>
        </div>
    );
};

export default LandingPage;
