import React from 'react';
import App from '@/components/App';
import SEO from '@/components/seo';

export default function VersionRoot(context: {
  pageContext: { project: string; version: string };
}) {
  return (
    <main>
      <App
        project={context.pageContext.project}
        version={context.pageContext.version}
      />
      <SEO title={`${context.pageContext.project} - ${context.pageContext.version} - Personal Wraps Collection`} description={`Version ${context.pageContext.version} of ${context.pageContext.project} in personal wraps collection`}/>
    </main>
  );
}
