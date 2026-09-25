// resources/js/pages/Backend/CMS/Section/components/modals/Editors/BlogEditor.jsx
// READ-ONLY redirect notice for page-level BlogSection rows.
// This section is controlled by the Blogs Manager — do NOT add form fields here.

// React
import React from 'react';

// Icons
import { FaBlog } from 'react-icons/fa';

// Shared generic redirect notice
import ExternalManagerRedirect from './shared/ExternalManagerRedirect';

const BlogEditor = ({ section, hasData }) => {
  // ===== DATA EXTRACTION =====
  // Get blogs data from section - this is read-only
  const data = section?.data || [];
  const blogs = Array.isArray(data) ? data : [];

  return (
    <ExternalManagerRedirect
      sectionTitle="Blog Section"
      icon={FaBlog}
      tone="orange"
      heading="Controlled by Blogs Page"
      description={
        <>
          This section displays blog posts from the <strong>Blogs Manager</strong>. It
          automatically shows all active blog posts.
        </>
      }
      hint="To add, edit, or remove blog posts, please go to the Blogs Manager. Changes made there will automatically reflect here."
      listLabel="Current Blog Posts"
      itemNoun="blog"
      items={blogs.map((blog, idx) => blog.title || `Blog ${idx + 1}`)}
      emptyList={
        // Empty state - no blogs
        <div className="text-center py-4">
          <p className="text-sm text-gray-400">No blog posts available</p>
          <p className="text-xs text-gray-400 mt-1">Add blog posts in the Blogs Manager</p>
        </div>
      }
      noDataTitle="No blog posts have been created yet."
      noDataHint="Go to the Blogs Manager to create your first blog post."
      actionLabel="Go to Blogs Manager"
      actionRoute="backend.cms.blogs.index"
      hasData={hasData}
      footerNote={
        <>
          <p>
            💡 <strong>Note:</strong> This section is controlled by the Blogs Manager. You cannot
            edit blog content directly here.
          </p>
          <p className="mt-1">
            📍 To manage blogs, navigate to <strong>Blogs Manager</strong> in the CMS sidebar. All
            changes made there will automatically appear in this section.
          </p>
        </>
      }
    >
      {/* ===== SECTION SETTINGS ===== */}
      {/* Shows configuration details for this section */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Section Settings</h4>
        <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <span className="text-xs text-gray-500">Data Table</span>
            <p className="text-sm font-medium text-gray-700">blogs</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Data Key</span>
            <p className="text-sm font-medium text-gray-700">{section.data_key || 'blogsData'}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Component</span>
            <p className="text-sm font-medium text-gray-700">BlogSection</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Status</span>
            <p className={`text-sm font-medium ${hasData ? 'text-green-600' : 'text-gray-400'}`}>
              {hasData ? '✅ Has Blogs' : 'No Blogs'}
            </p>
          </div>
        </div>
      </div>

      {/* ===== BLOG STATS ===== */}
      {/* Shows statistics about blogs (total, active, featured) */}
      {hasData && blogs.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Blog Stats</h4>
          <div className="grid grid-cols-3 gap-2">
            {/* Total blogs */}
            <div className="bg-orange-50 rounded-lg p-2 text-center">
              <span className="text-xs text-gray-500">Total</span>
              <p className="text-lg font-bold text-orange-600">{blogs.length}</p>
            </div>
            {/* Active blogs */}
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <span className="text-xs text-gray-500">Active</span>
              <p className="text-lg font-bold text-green-600">
                {blogs.filter((b) => b.is_active !== false).length}
              </p>
            </div>
            {/* Featured blogs */}
            <div className="bg-yellow-50 rounded-lg p-2 text-center">
              <span className="text-xs text-gray-500">Featured</span>
              <p className="text-lg font-bold text-yellow-600">
                {blogs.filter((b) => b.is_featured).length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===== RECENT BLOG PREVIEW ===== */}
      {/* Shows preview of the most recent 2 blogs */}
      {hasData && blogs.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Recent Blog Preview</h4>
          <div className="space-y-2">
            {blogs.slice(0, 2).map((blog, idx) => (
              <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200">
                {/* Blog title */}
                <p className="text-xs font-medium text-gray-700">
                  {blog.title || `Blog ${idx + 1}`}
                </p>
                {/* Blog excerpt (if available) */}
                {blog.excerpt && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{blog.excerpt}</p>
                )}
                {/* Blog date (if available) */}
                {blog.date && <p className="text-xs text-gray-400 mt-1">{blog.date}</p>}
              </div>
            ))}
            {/* Show if more blogs exist */}
            {blogs.length > 2 && (
              <p className="text-xs text-gray-400 text-center">
                + {blogs.length - 2} more blogs available
              </p>
            )}
          </div>
        </div>
      )}

    </ExternalManagerRedirect>
  );
};

export default BlogEditor;
