import React from 'react';
import { Zap, Target, BookOpen, ShieldCheck, Users, Award } from 'lucide-react';
import SEO from "../components/SEO";

const AboutUs = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
<SEO title="About Us" description="Interactive Power System simulation and engineering tool: About Us." url="/aboutus" />

      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl overflow-hidden">
          <img src="/favicon.svg" alt="RelaySchool Logo" className="w-7 h-7 object-contain" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">About RelaySchool</h1>
      </div>

      <div className="prose dark:prose-invert max-w-none space-y-10 text-slate-700 dark:text-slate-300 leading-relaxed">
        
        {/* Mission */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" /> Our Mission
          </h2>
          <p>
            RelaySchool is a professional power system engineering simulation platform built to bridge the gap between 
            textbook theory and real-world plant practice. Our mission is to make protection engineering, fault analysis, 
            relay coordination, and digital substation concepts accessible through hands-on, interactive simulations — 
            all running directly in your browser.
          </p>
          <p>
            We believe that the best way to learn power system engineering is by <strong>doing</strong> — adjusting 
            relay settings, simulating faults, analyzing waveforms, and solving real engineering scenarios.
          </p>
        </section>

        {/* What We Offer */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-500" /> What We Offer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Interactive Simulators</h3>
              <p className="text-sm">TCC coordination, distance relay zones, differential protection, symmetrical components, and more — all with real-time adjustable parameters.</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Engineering Calculators</h3>
              <p className="text-sm">Per-unit math, impedance conversions, battery sizing, cable ampacity, CT burden checks, and short-circuit calculations using IEC 60909 logic.</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Forensic & Failure Analysis</h3>
              <p className="text-sm">COMTRADE waveform analysis, CT saturation modeling, DC offset studies, and collaborative fault investigation with WebRTC multiplayer support.</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Digital Substation Training</h3>
              <p className="text-sm">IEC 61850 GOOSE messaging, Sampled Values, network traffic simulation, and substation topology modeling for modern digital substations.</p>
            </div>
          </div>
        </section>

        {/* Standards */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" /> Standards Alignment
          </h2>
          <p>
            Our simulations are designed around concepts from internationally recognized electrical engineering standards, including:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>IEC 60255</strong> — Overcurrent and time-delay relay characteristics</li>
            <li><strong>IEC 60909</strong> — Short-circuit current calculation methods</li>
            <li><strong>IEC 61850</strong> — Communication networks and systems for power utility automation</li>
            <li><strong>IEEE C37.112</strong> — Standard inverse-time relay characteristic equations</li>
            <li><strong>IEEE C37.111</strong> — COMTRADE file format for transient data exchange</li>
            <li><strong>IEEE C37.91</strong> — Guide for protective relay applications to power transformers</li>
          </ul>
          <p className="text-sm italic">
            Note: RelaySchool is not affiliated with or endorsed by IEC, IEEE, or any standards organization. 
            Standard references are used for educational context only.
          </p>
        </section>

        {/* Who It's For */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" /> Who This Platform Is For
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Protection Engineers</strong> — Practice relay coordination, distance protection, and fault analysis.</li>
            <li><strong>System Study Engineers</strong> — Understand short-circuit calculations, load flow, and per-unit systems.</li>
            <li><strong>Substation Engineers</strong> — Learn IEC 61850 concepts, bay logic, and SLD design.</li>
            <li><strong>Maintenance & Reliability Engineers</strong> — Diagnose relay misoperation, CT saturation, and failure modes.</li>
            <li><strong>Engineering Students & Fresh Graduates</strong> — Build practical skills with guided simulations and structured learning paths.</li>
            <li><strong>Consultants & Trainers</strong> — Use interactive tools to demonstrate concepts during workshops and presentations.</li>
          </ul>
        </section>

        {/* Creator */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" /> Created By
          </h2>
          <p>
            RelaySchool is created and maintained by <strong>Anil Sharma</strong>, a power system protection engineer 
            based in Vadodara, Gujarat, India. The platform is built from hands-on industry experience in relay engineering, 
            commissioning, and protection coordination — with a passion for making these concepts interactive and accessible 
            to engineers worldwide.
          </p>
        </section>

        {/* Contact */}
        <section className="mt-8 p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <h3 className="font-bold text-slate-900 dark:text-white mb-2">Get in Touch</h3>
          <p className="text-sm mb-1">
            <strong>Email:</strong>{' '}
            <a href="mailto:0808miracle@gmail.com" className="text-blue-600 dark:text-blue-400 underline">0808miracle@gmail.com</a>
          </p>
          <p className="text-sm">
            <strong>Location:</strong> Vadodara, Gujarat, India
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;
