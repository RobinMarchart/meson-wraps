import React from 'react';
import App from '../components/App';

export default function VersionRoot(context: {
  pageContext: { project: string; version: string };
}) {
  return (
    <main>
      <App
        project={context.pageContext.project}
        version={context.pageContext.version}
      />
    </main>
  );
}
