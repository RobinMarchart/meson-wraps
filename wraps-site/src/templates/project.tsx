import React from 'react';
import App from '@/components/App';
import SEO from '@/components/seo';

export default function ProjectRoot(context: {
  pageContext: { project: string };
}) {
  return (
    <main>
      <App project={context.pageContext.project} />
      <SEO title={`${context.pageContext.project} - Personal Wraps Collection`} description={`Versions available for ${context.pageContext.project} in personal wraps collection`} />
    </main>
  );
}
