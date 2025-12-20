
import React from 'react';
import { Zap, Github, Twitter, Linkedin, Heart, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    const shareUrl = "https://wa.me/?text=Check%20out%20RelaySchool%20-%20Advanced%20Power%20System%20Protection%20App!%20%23Engineering%20%23Simulation";

    return (
        <footer className="relative bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8 transition-colors duration-300 print:hidden overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
                    {/* Brand Column */}
                    <div className="col-span-1">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Zap className="text-white w-5 h-5" />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                                Relay<span className="text-blue-600 dark:text-blue-400">School</span>
                            </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                            The professional standard for power system simulation. 
                            Engineered for precision, reliability, and offline capability.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-blue-500 hover:text-white transition-all duration-300">
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-900 dark:hover:bg-white dark:hover:text-slate-900 transition-all duration-300">
                                <Github className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-blue-600 hover:text-white transition-all duration-300">
                                <Linkedin className="w-4 h-4" />
                            </a>
                            <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-green-500 hover:bg-green-500 hover:text-white transition-all duration-300" title="Share on WhatsApp">
                                <MessageCircle className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-6 text-sm uppercase tracking-wider">Platform</h3>
                        <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                            <li><Link to="/tcc" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2"><div className="w-1 h-1 bg-slate-300 rounded-full"></div> TCC Coordination</Link></li>
                            <li><Link to="/twin" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2"><div className="w-1 h-1 bg-slate-300 rounded-full"></div> Digital Twin</Link></li>
                            <li><Link to="/failure" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2"><div className="w-1 h-1 bg-slate-300 rounded-full"></div> Failure Lab</Link></li>
                            <li><Link to="/knowledge" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2"><div className="w-1 h-1 bg-slate-300 rounded-full"></div> Knowledge Base</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-6 text-sm uppercase tracking-wider">Support</h3>
                        <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                            <li><Link to="/contact" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2"><div className="w-1 h-1 bg-slate-300 rounded-full"></div> Contact Us</Link></li>
                            <li><Link to="/knowledge" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2"><div className="w-1 h-1 bg-slate-300 rounded-full"></div> Documentation</Link></li>
                            <li><Link to="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2"><div className="w-1 h-1 bg-slate-300 rounded-full"></div> Legal & Terms</Link></li>
                            <li><Link to="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2"><div className="w-1 h-1 bg-slate-300 rounded-full"></div> Privacy Policy</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Engineering Disclaimer:</span> This platform is for educational simulation and training purposes only. 
                        Calculations are based on standard models but are approximations. 
                        Results must not be used for safety-critical settings without independent verification by a licensed Professional Engineer.
                    </p>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col md:flex-row items-center gap-2 text-sm text-slate-500 dark:text-slate-500">
                        <span>© {new Date().getFullYear()} RelaySchool.</span>
                        <span className="hidden md:inline">•</span>
                        <span>All rights reserved.</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm hover:shadow-md transition-shadow group cursor-default">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Created by</span>
                        <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:from-blue-500 group-hover:to-indigo-500 transition-all">
                            Anil Sharma
                        </span>
                        <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
