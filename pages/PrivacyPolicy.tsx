import React from 'react';
import { ShieldCheck } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 md:p-12 shadow-sm">
        <div className="flex items-center gap-3 mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Privacy Policy</h1>
        </div>

        <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
          <p className="lead text-lg">
            At RelaySchool, accessible from our website, one of our main priorities is the privacy of our visitors. 
            This Privacy Policy document contains types of information that is collected and recorded by RelaySchool and how we use it.
          </p>

          <h3 className="text-slate-900 dark:text-white mt-8 mb-4 font-bold text-xl">1. Log Files</h3>
          <p>
            RelaySchool follows a standard procedure of using log files. These files log visitors when they visit websites. 
            All hosting companies do this as a part of hosting services' analytics. The information collected by log files includes 
            internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, 
            and possibly the number of clicks. These are not linked to any information that is personally identifiable.
          </p>

          <h3 className="text-slate-900 dark:text-white mt-8 mb-4 font-bold text-xl">2. Cookies and Local Storage</h3>
          <p>
            Like any other website, RelaySchool uses "cookies" and browser Local Storage. These technologies are used to store information 
            including visitors' preferences (such as Relay Settings, Dark Mode preference, and Project Data) and the pages on the website 
            that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content.
          </p>

          <h3 className="text-slate-900 dark:text-white mt-8 mb-4 font-bold text-xl">3. Google DoubleClick DART Cookie</h3>
          <p>
            Google is one of a third-party vendor on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors 
            based upon their visit to www.website.com and other sites on the internet. However, visitors may choose to decline the use of 
            DART cookies by visiting the Google ad and content network Privacy Policy at the following URL –{' '}
            <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
              https://policies.google.com/technologies/ads
            </a>
          </p>

          <h3 className="text-slate-900 dark:text-white mt-8 mb-4 font-bold text-xl">4. Advertising Partners Privacy Policies</h3>
          <p>
            Third-party ad servers or ad networks uses technologies like cookies, JavaScript, or Web Beacons that are used in their 
            respective advertisements and links that appear on RelaySchool, which are sent directly to users' browser. 
            They automatically receive your IP address when this occurs. These technologies are used to measure the effectiveness of 
            their advertising campaigns and/or to personalize the advertising content that you see on websites that you visit.
          </p>
          <p className="italic text-sm mt-2">
            Note that RelaySchool has no access to or control over these cookies that are used by third-party advertisers.
          </p>

          <h3 className="text-slate-900 dark:text-white mt-8 mb-4 font-bold text-xl">5. GDPR Data Protection Rights</h3>
          <p>
            We would like to make sure you are fully aware of all of your data protection rights. Every user is entitled to the following:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>The right to access – You have the right to request copies of your personal data.</li>
            <li>The right to rectification – You have the right to request that we correct any information you believe is inaccurate.</li>
            <li>The right to erasure – You have the right to request that we erase your personal data, under certain conditions.</li>
          </ul>

          <h3 className="text-slate-900 dark:text-white mt-8 mb-4 font-bold text-xl">6. Children's Information</h3>
          <p>
            Another part of our priority is adding protection for children while using the internet. We encourage parents and guardians to 
            observe, participate in, and/or monitor and guide their online activity. RelaySchool does not knowingly collect any 
            Personal Identifiable Information from children under the age of 13.
          </p>

          <h3 className="text-slate-900 dark:text-white mt-8 mb-4 font-bold text-xl">7. Consent</h3>
          <p>
            By using our website, you hereby consent to our Privacy Policy and agree to its Terms and Conditions.
          </p>
          
          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;