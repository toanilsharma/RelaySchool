
import React from 'react';
import { FileText } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 md:p-12 shadow-sm">
        <div className="flex items-center gap-3 mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Terms of Service</h1>
        </div>

        <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
          <h3 className="text-slate-900 dark:text-white mt-8 mb-4 font-bold text-xl">1. Terms</h3>
          <p>
            By accessing this website, accessible from RelaySchool, you are agreeing to be bound by these Website Terms and Conditions of Use 
            and agree that you are responsible for the agreement with any applicable local laws. If you disagree with any of these terms, 
            you are prohibited from accessing this site.
          </p>

          <h3 className="text-slate-900 dark:text-white mt-8 mb-4 font-bold text-xl">2. Educational & Simulation Use Only</h3>
          <p className="bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 p-4 rounded-r text-amber-900 dark:text-amber-200">
            <strong>CRITICAL DISCLAIMER:</strong> RelaySchool is an educational simulation suite designed for training and demonstration purposes only.
            The results, calculations, graphs, and simulations provided by this platform <strong>MUST NOT</strong> be used for actual power system protection coordination, 
            equipment sizing, or safety-critical engineering decisions without independent verification by a licensed Professional Engineer.
            We assume no liability for equipment damage, power outages, or safety incidents resulting from the misuse of this tool.
          </p>

          <h3 className="text-slate-900 dark:text-white mt-8 mb-4 font-bold text-xl">3. Use License</h3>
          <p>
            Permission is granted to temporarily download one copy of the materials on RelaySchool's website for personal, 
            non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>modify or copy the materials;</li>
            <li>use the materials for any commercial purpose or for any public display;</li>
            <li>attempt to reverse engineer any software contained on RelaySchool's website;</li>
            <li>remove any copyright or other proprietary notations from the materials;</li>
          </ul>

          <h3 className="text-slate-900 dark:text-white mt-8 mb-4 font-bold text-xl">4. Disclaimer</h3>
          <p>
            All the materials on RelaySchool's website are provided "as is". RelaySchool makes no warranties, may it be expressed or implied, 
            therefore negates all other warranties. Furthermore, RelaySchool does not make any representations concerning the accuracy or reliability 
            of the use of the materials on its website or otherwise relating to such materials or any sites linked to this website.
          </p>

          <h3 className="text-slate-900 dark:text-white mt-8 mb-4 font-bold text-xl">5. Limitations</h3>
          <p>
            RelaySchool or its suppliers will not be hold accountable for any damages that will arise with the use or inability to use 
            the materials on RelaySchool's website, even if RelaySchool or an authorize representative of this website has been notified, 
            orally or written, of the possibility of such damage.
          </p>

          <h3 className="text-slate-900 dark:text-white mt-8 mb-4 font-bold text-xl">6. Revisions and Errata</h3>
          <p>
            The materials appearing on RelaySchool's website may include technical, typographical, or photographic errors. 
            RelaySchool will not promise that any of the materials in this website are accurate, complete, or current. 
            RelaySchool may change the materials contained on its website at any time without notice.
          </p>
          
          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
