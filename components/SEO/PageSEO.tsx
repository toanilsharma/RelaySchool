import React from 'react';
import { Helmet } from 'react-helmet-async';

interface PageSEOProps {
    title: string;
    description: string;
    type?: 'website' | 'article' | 'WebApplication' | 'Course';
    url?: string;
    image?: string;
    schema?: Record<string, any>;
    keywords?: string[];
    author?: string;
}

export const PageSEO: React.FC<PageSEOProps> = ({
    title,
    description,
    type = 'website',
    url,
    image = 'https://relayschool.co.in/og-default.jpg', // Placeholder for actual asset
    schema,
    keywords,
    author = 'RelaySchool'
}) => {
    const absoluteUrl = url ? `https://relayschool.co.in${url}` : 'https://relayschool.co.in';
    const fullTitle = `${title} | RelaySchool`;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            {keywords && <meta name="keywords" content={keywords.join(', ')} />}
            <meta name="author" content={author} />

            {/* Canonical Link */}
            <link rel="canonical" href={absoluteUrl} />

            {/* OpenGraph Tags */}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:type" content={type === 'WebApplication' || type === 'Course' ? 'website' : type} />
            <meta property="og:url" content={absoluteUrl} />
            <meta property="og:image" content={image} />

            {/* Twitter Tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* JSON-LD Structured Data Schema */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        ...schema
                    })}
                </script>
            )}
        </Helmet>
    );
};

export default PageSEO;
