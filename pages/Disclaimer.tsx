import React from 'react';
import { AlertTriangle } from 'lucide-react';
import SEO from "../components/SEO";

const Disclaimer = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
<SEO title="Disclaimer" description="Interactive Power System simulation and engineering tool: Disclaimer." url="/disclaimer" />

      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
          <AlertTriangle className="w-7 h-7 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Disclaimer</h1>
      </div>

      <div className="prose dark:prose-invert max-w-none space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed">
        <p className="text-lg">
          <strong>Last Updated:</strong> February 24, 2026
        </p>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">1. Educational Purpose Only</h2>
          <p>
            RelaySchool ("the Platform") is an educational simulation and training platform designed for learning purposes only. 
            All simulation tools, calculators, modules, and interactive content are intended to help users understand power system 
            protection engineering concepts, relay coordination logic, and fault analysis fundamentals.
          </p>
          <p>
            The Platform is <strong>not</strong> intended to replace professional engineering judgment, licensed software 
            (such as ETAP, DIgSILENT, or ASPEN), or the advice of a qualified Professional Engineer (PE).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">2. No Warranty on Calculations</h2>
          <p>
            While our simulations are based on industry-standard methods and reference IEC and IEEE standards (including 
            IEC 60255, IEC 60909, IEC 61850, IEEE C37.112, IEEE C37.111, and others), all calculation results are 
            <strong> approximations for educational illustration</strong>. They may not account for every real-world variable.
          </p>
          <p>
            RelaySchool provides no warranty, express or implied, regarding the accuracy, completeness, or fitness for a 
            particular purpose of any calculation result, simulation output, or learning material presented on the Platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">3. Not for Safety-Critical Applications</h2>
          <p>
            Results from this Platform <strong>must not be used</strong> for safety-critical relay settings, protection 
            coordination studies, equipment sizing, or any engineering decision that could affect the safety of persons, 
            equipment, or the electrical grid without independent verification by a licensed Professional Engineer.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">4. Standards References</h2>
          <p>
            References to IEC, IEEE, NERC, and other standards throughout the Platform are for educational context only. 
            The Platform does not claim certification, endorsement, or affiliation with the International Electrotechnical 
            Commission (IEC), Institute of Electrical and Electronics Engineers (IEEE), or any standards body.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">5. Third-Party Content</h2>
          <p>
            The Platform may contain references, links, or citations to third-party resources, papers, or tools. 
            RelaySchool is not responsible for the accuracy, availability, or content of any external resources. 
            Inclusion of external references does not imply endorsement.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">6. Limitation of Liability</h2>
          <p>
            In no event shall RelaySchool, its creator, contributors, or affiliates be liable for any direct, indirect, 
            incidental, special, consequential, or exemplary damages arising out of or in connection with the use of, 
            or inability to use, this Platform or any content provided herein.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">7. Changes to This Disclaimer</h2>
          <p>
            We reserve the right to update or modify this Disclaimer at any time. Changes will be posted on this page 
            with an updated "Last Updated" date. Continued use of the Platform constitutes acceptance of any changes.
          </p>
        </section>

        <div className="mt-10 p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
            <strong>Summary:</strong> This platform is for learning. Always verify any engineering results with licensed 
            professionals and certified software before applying them in real-world scenarios.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;
