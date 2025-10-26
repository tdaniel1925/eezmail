'use client';

import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import Prism from 'prismjs';

// Import Prism themes and languages
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-python';

interface ArticleContentProps {
  content: string;
}

export function ArticleContent({ content }: ArticleContentProps) {
  useEffect(() => {
    // Highlight all code blocks after rendering
    Prism.highlightAll();
  }, [content]);

  return (
    <div className="prose prose-lg max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-gray-700 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:rounded prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:text-sm prose-code:text-gray-800 prose-code:before:content-[''] prose-code:after:content-[''] prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-img:rounded-lg prose-img:shadow-md">
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';

            if (!inline && language) {
              return (
                <pre className={`language-${language}`}>
                  <code className={`language-${language}`} {...props}>
                    {String(children).replace(/\n$/, '')}
                  </code>
                </pre>
              );
            }

            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
