// resources/js/Sections/BlogSection/BlogEditor.jsx

import { FaBlog } from 'react-icons/fa';
import ExternalManagerRedirect from '../../Shared/SectionEditor/ExternalManagerRedirect';

const BlogEditor = ({ section, hasData }) => {
  const data = section?.data || [];
  const blogs = Array.isArray(data) ? data : [];

  return (
    <ExternalManagerRedirect
      sectionTitle="Blog Section"
      icon={FaBlog}
      tone="orange"
      heading="Controlled by Blogs Manager"
      description={<>This section displays blog posts from the <strong>Blogs Manager</strong>. It automatically shows all active blog posts.</>}
      hint="To add, edit, or remove blog posts, please go to the Blogs Manager. Changes made there will automatically reflect here."
      listLabel="Current Blog Posts"
      itemNoun="blog"
      items={blogs.map((blog, idx) => blog.title || `Blog ${idx + 1}`)}
      emptyList={
        <div className="py-2 text-center">
          <p className="text-sm text-slate-500">No blog posts available</p>
          <p className="mt-0.5 text-xs text-slate-400">Add blog posts in the Blogs Manager</p>
        </div>
      }
      noDataTitle="No blog posts have been created yet."
      noDataHint="Go to the Blogs Manager to create your first blog post."
      actionLabel="Go to Blogs Manager"
      actionRoute="backend.cms.blogs.index"
      hasData={hasData}
      footerNote={
        <p>Blog content is managed centrally. Edit posts in the Blogs Manager and they will appear here automatically.</p>
      }
    >
      <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-sm">
        <div>
          <span className="block text-xs text-slate-400">Data Table</span>
          <p className="font-mono text-slate-700">blogs</p>
        </div>
        <div>
          <span className="block text-xs text-slate-400">Data Key</span>
          <p className="font-mono text-slate-700">{section.data_key || 'blogsData'}</p>
        </div>
        <div>
          <span className="block text-xs text-slate-400">Component</span>
          <p className="font-mono text-slate-700">BlogSection</p>
        </div>
        <div>
          <span className="block text-xs text-slate-400">Status</span>
          <p className={`font-medium ${hasData ? 'text-emerald-600' : 'text-slate-400'}`}>
            {hasData ? 'Has blogs' : 'No blogs'}
          </p>
        </div>
      </div>

      {hasData && blogs.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-orange-200 bg-orange-50/60 p-2.5 text-center">
            <span className="block text-[11px] font-medium text-orange-600">Total</span>
            <p className="text-lg font-bold tabular-nums text-orange-700">{blogs.length}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5 text-center">
            <span className="block text-[11px] font-medium text-emerald-600">Active</span>
            <p className="text-lg font-bold tabular-nums text-emerald-700">
              {blogs.filter((b) => b.is_active !== false).length}
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-2.5 text-center">
            <span className="block text-[11px] font-medium text-amber-600">Featured</span>
            <p className="text-lg font-bold tabular-nums text-amber-700">
              {blogs.filter((b) => b.is_featured).length}
            </p>
          </div>
        </div>
      )}
    </ExternalManagerRedirect>
  );
};

export default BlogEditor;
