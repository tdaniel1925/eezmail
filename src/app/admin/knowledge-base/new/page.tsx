/**
 * New Article Redirect
 * Redirects to the editor with id 'new'
 */

import { redirect } from 'next/navigation';

export default function NewArticlePage() {
  redirect('/admin/knowledge-base/edit/new');
}
