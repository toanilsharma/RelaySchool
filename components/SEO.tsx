import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  url?: string;
  image?: string;
  schema?: Record<string, any>;
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  keywords, 
  url, 
  image = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop",
  schema 
}) => {
  const siteUrl = "https://relayschool.co.in";
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const fullTitle = `${title} | RelaySchool`;
  
  // Default schema for software application
  const defaultSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "RelaySchool",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    ...schema
  };

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(defaultSchema)}
      </script>
    </Helmet>
  );
};

export default SEO;
