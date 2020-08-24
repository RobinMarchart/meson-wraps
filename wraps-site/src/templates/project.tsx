import React from 'react';
import App from '../components/App';

export default function ProjectRoot(context: {
  pageContext: { project: string };
}) {
  return (
    <main>
      <App project={context.pageContext.project} />
    </main>
  );
}
