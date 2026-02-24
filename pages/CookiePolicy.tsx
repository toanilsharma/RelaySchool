import React from 'react';
import { ShieldCheck } from 'lucide-react';

const CookiePolicy = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
          <ShieldCheck className="w-7 h-7 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Cookie Policy</h1>
      </div>

      <div className="prose dark:prose-invert max-w-none space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed">
        <p className="text-lg">
          <strong>Last Updated:</strong> February 24, 2026
        </p>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">1. What Are Cookies</h2>
          <p>
            Cookies are small text files that are placed on your device when you visit a website. They are widely used to 
            make websites work efficiently, provide analytics information, and deliver a personalized experience. This Cookie 
            Policy explains how RelaySchool ("the Platform") uses cookies and similar technologies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">2. Types of Cookies We Use</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">Essential Cookies</h3>
              <p className="text-sm">
                These cookies are necessary for the Platform to function properly. They enable core features like 
                theme preference (dark/light mode), session state, and navigation. These cannot be disabled.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">Analytics Cookies</h3>
              <p className="text-sm">
                We use Google Analytics to understand how visitors interact with the Platform. These cookies collect 
                information such as pages visited, time spent on the site, and general location data. This data is 
                aggregated and anonymized. You can opt out via your browser settings or the cookie consent banner.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">Advertising Cookies</h3>
              <p className="text-sm">
                If advertisements are displayed on the Platform (through Google AdSense or similar networks), 
                third-party advertising cookies may be used to serve relevant ads based on your browsing behavior. 
                These cookies are managed by the respective ad networks and are subject to their privacy policies.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">Functionality Cookies</h3>
              <p className="text-sm">
                These cookies remember your preferences such as simulation settings, selected engineering path, 
                and last visited module to provide a personalized experience when you return to the Platform.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">3. Third-Party Cookies</h2>
          <p>
            Some cookies on the Platform are placed by third-party services. These include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Google Analytics</strong> — for website traffic analysis and usage reporting.</li>
            <li><strong>Google AdSense</strong> — for serving personalized or contextual advertisements.</li>
          </ul>
          <p>
            These third parties have their own privacy and cookie policies, which we encourage you to review. 
            You can learn more about Google's cookie usage at{' '}
            <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">
              Google's Cookie Policy
            </a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">4. How to Manage Cookies</h2>
          <p>
            You can control and manage cookies through your browser settings. Most browsers allow you to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>View what cookies are stored on your device and delete them individually.</li>
            <li>Block third-party cookies.</li>
            <li>Block cookies from specific websites.</li>
            <li>Block all cookies from being set.</li>
            <li>Delete all cookies when you close your browser.</li>
          </ul>
          <p>
            Please note that disabling cookies may affect the functionality of the Platform and your overall experience.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">5. Cookie Consent</h2>
          <p>
            When you first visit the Platform, a cookie consent banner will appear. By clicking "Accept," you consent 
            to the use of cookies as described in this policy. You may withdraw your consent at any time by clearing 
            your browser cookies and revisiting the Platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">6. Updates to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our 
            data practices. Updated versions will be posted on this page with a revised "Last Updated" date.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">7. Contact</h2>
          <p>
            If you have questions about our use of cookies, please contact us at{' '}
            <a href="mailto:0808miracle@gmail.com" className="text-blue-600 dark:text-blue-400 underline">0808miracle@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default CookiePolicy;
