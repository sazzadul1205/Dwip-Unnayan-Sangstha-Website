// resources/js/pages/Backend/CMS/Shared/Modals/NavbarEditor.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FaPlus, FaTrash, FaUpload, FaSpinner, FaLink, FaImage,
  FaChevronDown, FaChevronRight, FaSitemap, FaTimes, FaInfoCircle,
} from 'react-icons/fa';
import { FiExternalLink } from 'react-icons/fi';
import Swal from 'sweetalert2';
import EditorSection from '../components/EditorSection';

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60 disabled:bg-slate-50 disabled:text-slate-500';
  
const CONTENT_SOURCES = {
  blog: { label: 'Blog post', endpoint: '/data/blogs.json', base: '/blog' },
  program: { label: 'Program', endpoint: '/data/programs.json', base: '/projects-programs' },
  publication: { label: 'Publication', endpoint: '/data/publications.json', base: '/publications' },
  about: { label: 'About section', endpoint: '/data/about_content.json', base: '/about' },
};

const extractItems = (json) => {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.items)) return json.items;
  if (Array.isArray(json?.pages)) return json.pages;
  return [];
};

const getLinkChildren = (link, index, depth, legacyDropdowns) => {
  const children = link?.children;
  if (Array.isArray(children) && children.length > 0) return children;
  if (Array.isArray(link?.dropdown) && link.dropdown.length > 0) return link.dropdown;
  const legacy = Array.isArray(legacyDropdowns) ? legacyDropdowns[index] : null;
  if (depth === 0 && Array.isArray(legacy) && legacy.length > 0) return legacy;
  return [];
};

const getChildrenPath = (link, linkPath, index, depth, legacyDropdowns) => {
  if (depth === 0) {
    const children = link?.children;
    if (Array.isArray(children) && children.length > 0) return `${linkPath}.children`;
    if (Array.isArray(link?.dropdown) && link.dropdown.length > 0) return `${linkPath}.dropdown`;
    const legacy = Array.isArray(legacyDropdowns) ? legacyDropdowns[index] : null;
    if (Array.isArray(legacy) && legacy.length > 0) return `dropdowns.${index}`;
  }
  return `${linkPath}.children`;
};

const countAllSubLinks = (links, legacyDropdowns = []) => {
  if (!Array.isArray(links)) return 0;
  return links.reduce((total, link, index) => {
    const children = getLinkChildren(link, index, 0, legacyDropdowns);
    return total + children.length + countAllSubLinks(children);
  }, 0);
};

const linksHaveEmptyFields = (links, legacyDropdowns = []) => {
  if (!Array.isArray(links)) return false;
  return links.some((link, index) => {
    const name = typeof link?.name === 'string' ? link.name.trim() : '';
    const href = typeof link?.href === 'string' ? link.href.trim() : '';
    if (name === '' || href === '') return true;
    return linksHaveEmptyFields(getLinkChildren(link, index, 0, legacyDropdowns));
  });
};

// ─── Recursive NavLinkEditor ───
const NavLinkEditor = ({
  link, index, parentPath, depth = 0, isDisabled,
  pages, loadingPages, pageError, legacyDropdowns,
  onUpdateField, onPageSelect, onContentSelect, onEnsureContent,
  contentItems, contentLoading, contentErrors, onAddChild, onRemove,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const linkPath = `${parentPath}.${index}`;
  const children = getLinkChildren(link, index, depth, legacyDropdowns);
  const childrenPath = getChildrenPath(link, linkPath, index, depth, legacyDropdowns);

  const isHome = depth === 0 && link?.href === '/';
  const pageSlug = link?.href ? (link.href === '/' ? 'home' : link.href.replace(/^\//, '')) : '';

  const contentMatch = Object.entries(CONTENT_SOURCES).find(
    ([, cfg]) => typeof link?.href === 'string' && link.href.startsWith(`${cfg.base}/`)
  );
  const [linkKind, setLinkKind] = useState(() => (contentMatch ? 'content' : 'page'));
  const [contentSource, setContentSource] = useState(() => contentMatch?.[0] ?? 'blog');

  useEffect(() => {
    if (linkKind === 'content') onEnsureContent(contentSource);
  }, [linkKind, contentSource, onEnsureContent]);

  const sourceCfg = CONTENT_SOURCES[contentSource];
  const sourceItems = contentItems[contentSource] || [];
  const loadingSource = !!contentLoading[contentSource];
  const sourceError = contentErrors[contentSource];
  const selectedContentSlug = contentMatch?.[0] === contentSource && typeof link?.href === 'string'
    ? link.href.slice(sourceCfg.base.length + 1)
    : '';

  return (
    <div className={depth === 0 ? '' : 'mt-2'}>
      <div className={`rounded-lg border bg-white p-3 transition ${isHome ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 hover:border-slate-300'
        }`}>
        {/* Link-kind switch */}
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Links to
          </span>
          <div className="inline-flex overflow-hidden rounded-md border border-slate-200">
            {[
              { key: 'page', label: 'A page' },
              { key: 'content', label: 'A single item' },
            ].map((opt) => (
              <button key={opt.key} type="button"
                onClick={() => setLinkKind(opt.key)} disabled={isDisabled}
                className={`px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${linkKind === opt.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {depth > 0 && (
            <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Sub {depth}
            </span>
          )}

          {linkKind === 'page' ? (
            <div className="min-w-40 flex-1">
              <select value={pageSlug}
                onChange={(e) => onPageSelect(linkPath, e.target.value)}
                className={inputClass} disabled={isDisabled}>
                <option value="">— Select Page —</option>
                {loadingPages && <option value="" disabled>Loading pages…</option>}
                {pageError && <option value="" disabled>Could not load pages</option>}
                {!loadingPages && !pageError && pages.length === 0 && (
                  <option value="" disabled>No pages available</option>
                )}
                {!loadingPages && !pageError && pages.map((page) => (
                  <option key={page.id || page.slug} value={page.slug}>
                    {page.slug === 'home' ? 'Home' : `Page: ${page.name || page.title || page.slug}`}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div className="min-w-36 flex-1">
                <select value={contentSource}
                  onChange={(e) => setContentSource(e.target.value)}
                  className={inputClass} disabled={isDisabled}>
                  {Object.entries(CONTENT_SOURCES).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-40 flex-1">
                <select value={selectedContentSlug}
                  onChange={(e) => onContentSelect(linkPath, contentSource, e.target.value)}
                  className={inputClass} disabled={isDisabled}>
                  <option value="">— Select {sourceCfg?.label} —</option>
                  {loadingSource && <option value="" disabled>Loading…</option>}
                  {sourceError && <option value="" disabled>Could not load: {sourceError}</option>}
                  {!loadingSource && !sourceError && sourceItems.length === 0 && (
                    <option value="" disabled>No items available</option>
                  )}
                  {!loadingSource && !sourceError && sourceItems.map((item) => (
                    <option key={item.id || item.slug} value={item.slug}>
                      {item.title || item.name || item.slug}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="min-w-30 flex-1">
            <input type="text" value={link?.name || ''}
              onChange={(e) => onUpdateField(`${linkPath}.name`, e.target.value)}
              placeholder="Link Name" className={inputClass} disabled={isDisabled} />
          </div>
          <div className="min-w-30 flex-1">
            <input type="text" value={link?.href || ''}
              onChange={(e) => onUpdateField(`${linkPath}.href`, e.target.value)}
              placeholder="URL" className={inputClass} disabled={isDisabled} />
          </div>

          <div className="ml-auto flex items-center gap-1">
            {children.length > 0 && (
              <button type="button" onClick={() => setCollapsed((p) => !p)}
                className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                title={collapsed ? 'Show sub-items' : 'Hide sub-items'}>
                {collapsed ? <FaChevronRight size={11} /> : <FaChevronDown size={11} />}
              </button>
            )}

            {link?.name && link?.href && (
              <span className={`rounded-md px-2 py-1 text-xs font-medium ring-1 ${isHome
                  ? 'bg-blue-50 text-blue-700 ring-blue-200'
                  : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                }`}>
                {isHome ? 'Home' : 'Active'}
              </span>
            )}

            <button type="button" onClick={() => onAddChild(childrenPath)}
              className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
              disabled={isDisabled} title="Add a sub-item">
              <FaPlus size={9} /> Sub-item
            </button>

            <button type="button"
              onClick={() => onRemove(parentPath, index, link, depth)}
              className={`rounded-md p-1.5 transition ${isHome
                  ? 'cursor-not-allowed text-slate-300'
                  : 'text-slate-400 hover:bg-red-50 hover:text-red-600'
                }`}
              disabled={isDisabled || isHome}
              title={isHome ? 'Home page cannot be removed' : 'Remove link'}>
              <FaTrash size={12} />
            </button>
          </div>
        </div>

        {children.length > 0 && (
          <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
            <FaSitemap size={10} />
            {children.length} sub-item{children.length > 1 ? 's' : ''} inside this menu
            {collapsed ? ' (hidden)' : ''}
          </p>
        )}
      </div>

      {children.length > 0 && !collapsed && (
        <div className="mt-2 space-y-2 border-l-2 border-slate-200 pl-3 sm:ml-4">
          {children.map((child, childIndex) => (
            <NavLinkEditor
              key={child?._tempId || `${linkPath}-${childIndex}`}
              link={child} index={childIndex}
              parentPath={childrenPath} depth={depth + 1}
              isDisabled={isDisabled}
              pages={pages} loadingPages={loadingPages} pageError={pageError}
              legacyDropdowns={legacyDropdowns}
              onUpdateField={onUpdateField} onPageSelect={onPageSelect}
              onContentSelect={onContentSelect} onEnsureContent={onEnsureContent}
              contentItems={contentItems}
              contentLoading={contentLoading}
              contentErrors={contentErrors}
              onAddChild={onAddChild} onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main ───
export default function NavbarEditor({
  formData, updateFormData, addArrayItem, removeArrayItem,
  isLoading = false, setIsLoading = null,
}) {
  const [pages, setPages] = useState([]);
  const [pageError, setPageError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [loadingPages, setLoadingPages] = useState(false);
  const [contentItems, setContentItems] = useState({});
  const [contentLoading, setContentLoading] = useState({});
  const [contentErrors, setContentErrors] = useState({});
  const fileInputRef = useRef(null);
  const contentItemsRef = useRef({});

  const fetchPages = useCallback(async () => {
    setLoadingPages(true); setPageError(null);
    try {
      const res = await fetch('/data/pages.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      let pagesData = [];
      if (Array.isArray(data)) pagesData = data;
      else if (data.data && Array.isArray(data.data)) pagesData = data.data;
      else if (data.pages && Array.isArray(data.pages)) pagesData = data.pages;
      else if (data.items && Array.isArray(data.items)) pagesData = data.items;
      setPages(pagesData.filter((p) => p.slug && !p.slug.endsWith('-details')));
    } catch (err) {
      setPageError(err.message);
    } finally {
      setLoadingPages(false);
    }
  }, []);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const ensureContentLoaded = useCallback((sourceKey) => {
    const cfg = CONTENT_SOURCES[sourceKey];
    if (!cfg) return;
    if (contentItemsRef.current[sourceKey]) return;
    setContentLoading((prev) => (prev[sourceKey] ? prev : { ...prev, [sourceKey]: true }));
    setContentErrors((prev) => ({ ...prev, [sourceKey]: null }));
    fetch(`${cfg.endpoint}?per_page=500`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((json) => {
        let items = extractItems(json).filter((i) => i && i.slug);
        if (sourceKey === 'about') items = items.filter((i) => i.type !== 'main');
        contentItemsRef.current = { ...contentItemsRef.current, [sourceKey]: items };
        setContentItems(contentItemsRef.current);
      })
      .catch((err) => setContentErrors((prev) => ({ ...prev, [sourceKey]: err.message })))
      .finally(() => setContentLoading((prev) => ({ ...prev, [sourceKey]: false })));
  }, []);

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const processImageFile = (file) => new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please upload an image file')); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('Image must be less than 5MB')); return;
    }
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

  const uploadImage = async (file) => {
    setUploading(true);
    if (setIsLoading) setIsLoading(true);
    try {
      const imageUrl = await processImageFile(file);
      updateFormData('logo.src', imageUrl);
      Swal.fire({
        icon: 'success', title: 'Uploaded!',
        text: 'Logo uploaded successfully.', timer: 1500, showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        icon: 'error', title: 'Upload Failed',
        text: err.message, confirmButtonColor: '#3b82f6'
      });
    } finally {
      setUploading(false);
      if (setIsLoading) setIsLoading(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) await uploadImage(files[0]);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImage(file);
    e.target.value = '';
  };

  const removeLogo = () => {
    Swal.fire({
      title: 'Remove Logo?', text: 'This will remove the logo from the navbar.',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove',
    }).then((r) => {
      if (r.isConfirmed) {
        updateFormData('logo.src', '');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  const handlePageSelect = (linkPath, pageSlug) => {
    const selectedPage = pages.find((p) => p.slug === pageSlug);
    if (selectedPage) {
      updateFormData(`${linkPath}.name`, selectedPage.name || selectedPage.title || selectedPage.slug);
      const href = pageSlug === 'home' ? '/' : `/${pageSlug}`;
      updateFormData(`${linkPath}.href`, href);
    }
  };

  const handleContentSelect = (linkPath, sourceKey, slug) => {
    const cfg = CONTENT_SOURCES[sourceKey];
    if (!cfg) return;
    const sourceItems = contentItems[sourceKey] || [];
    const item = sourceItems.find((i) => i.slug === slug);
    if (item) updateFormData(`${linkPath}.name`, item.title || item.name || slug);
    updateFormData(`${linkPath}.href`, slug ? `${cfg.base}/${slug}` : '');
  };

  const hasDuplicateLinks = () => {
    const hrefs = (formData.navLinks || [])
      .map((l) => l.href).filter((h) => h && h.trim() !== '');
    return new Set(hrefs).size !== hrefs.length;
  };
  const hasEmptyLinks = () =>
    linksHaveEmptyFields(formData.navLinks || [], formData.dropdowns || []);
  const hasHomeLink = () => (formData.navLinks || []).some((l) => l.href === '/');

  const totalLinks = (formData.navLinks || []).length;
  const totalSubLinks = countAllSubLinks(formData.navLinks || [], formData.dropdowns || []);
  const isDisabled = isLoading || uploading || loadingPages;
  const hasLogo = formData.logo?.src && formData.logo.src.trim().length > 0;
  const hasHome = hasHomeLink();

  const handleRemoveLink = (arrayPath, index, link, depth = 0) => {
    if (depth > 0) { removeArrayItem(arrayPath, index); return; }
    if (link.href === '/') {
      Swal.fire({
        title: 'Cannot Remove Home Page',
        text: 'The home page link is required.', icon: 'warning',
        confirmButtonColor: '#3b82f6', confirmButtonText: 'Got it'
      });
      return;
    }
    if (totalLinks <= 1 && !hasHome) {
      Swal.fire({
        title: 'Cannot Remove Last Link',
        text: 'Add another link first.', icon: 'warning',
        confirmButtonColor: '#3b82f6', confirmButtonText: 'Got it'
      });
      return;
    }
    Swal.fire({
      title: 'Remove Link?',
      html: `Remove "<strong>${link.name || 'this link'}</strong>" from navigation?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove', cancelButtonText: 'Cancel',
    }).then((r) => { if (r.isConfirmed) removeArrayItem(arrayPath, index); });
  };

  const handleAddChild = (childrenPath) => addArrayItem(childrenPath, { name: '', href: '' });

  return (
    <div className="space-y-6 w-full">
      {/* LOGO */}
      <EditorSection
        icon={FaImage}
        title="Logo"
        description="Upload your brand logo for the navbar"
        tone="blue"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div
              className={`relative rounded-lg border-2 border-dashed p-4 transition-all ${dragActive
                  ? 'border-blue-500 bg-blue-50/60'
                  : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
              onDragEnter={handleDrag} onDragLeave={handleDrag}
              onDragOver={handleDrag} onDrop={handleDrop}
            >
              <div className="flex min-h-16 items-center gap-3">
                {hasLogo ? (
                  <div className="flex w-full items-center gap-3">
                    <img src={formData.logo.src} alt={formData.logo?.alt || 'Logo'}
                      className="h-14 w-14 shrink-0 rounded-lg object-contain ring-1 ring-slate-200" />
                    <span className="flex-1 truncate text-xs text-slate-500">Logo uploaded</span>
                    <button type="button" onClick={removeLogo} disabled={isDisabled}
                      className="shrink-0 rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600">
                      <FaTimes size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="flex w-full items-center gap-3 py-2 text-slate-400">
                    <FaUpload size={16} className="shrink-0" />
                    <span className="text-sm">Drop logo or click to browse</span>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  disabled={isDisabled} />
              </div>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <FaSpinner className="animate-spin text-blue-600" size={16} /> Uploading…
                  </div>
                </div>
              )}
            </div>
            <p className="mt-1.5 text-xs text-slate-400">Max 5MB · JPG, PNG, GIF, WebP, SVG</p>
          </div>
          <div>
            <label className="flex items-baseline gap-1.5 text-sm font-medium text-slate-700">
              Logo Alt Text
              <span className="text-xs font-normal text-slate-400">(accessibility)</span>
            </label>
            <input type="text" value={formData.logo?.alt || ''}
              onChange={(e) => updateFormData('logo.alt', e.target.value)}
              placeholder="e.g., Company Logo"
              className={`${inputClass} mt-1.5`} disabled={isDisabled} />
            <p className="mt-1.5 text-xs text-slate-400">Describes the logo for screen readers and SEO</p>
          </div>
        </div>
      </EditorSection>

      {/* NAV LINKS */}
      <EditorSection
        icon={FaLink}
        title="Navigation Links"
        description={`${totalLinks} links · ${totalSubLinks} sub-item${totalSubLinks === 1 ? '' : 's'} · ${hasHome ? 'Home page is set' : 'No home page set'}`}
        tone="emerald"
        action={
          <button type="button" onClick={() => addArrayItem('navLinks', { name: '', href: '/' })}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isDisabled}>
            <FaPlus size={11} /> Add Link
          </button>
        }
      >
        {hasDuplicateLinks() && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            <FaInfoCircle className="mt-0.5 shrink-0 text-amber-500" size={11} />
            Duplicate links detected. Each link should have a unique URL.
          </div>
        )}
        {hasEmptyLinks() && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            <FaInfoCircle className="mt-0.5 shrink-0 text-amber-500" size={11} />
            Some links have empty name or URL fields.
          </div>
        )}

        {(!formData.navLinks || formData.navLinks.length === 0) ? (
          <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <FaLink size={20} />
            </div>
            <p className="text-sm font-medium text-slate-600">No navigation links yet</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Click <span className="font-medium text-blue-600">Add Link</span> to start
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {formData.navLinks.map((link, index) => (
              <NavLinkEditor
                key={link?._tempId || `nav-${index}`}
                link={link} index={index}
                parentPath="navLinks" depth={0}
                isDisabled={isDisabled}
                pages={pages} loadingPages={loadingPages} pageError={pageError}
                legacyDropdowns={formData.dropdowns || []}
                onUpdateField={updateFormData}
                onPageSelect={handlePageSelect}
                onContentSelect={handleContentSelect}
                onEnsureContent={ensureContentLoaded}
                contentItems={contentItems}
                contentLoading={contentLoading}
                contentErrors={contentErrors}
                onAddChild={handleAddChild}
                onRemove={handleRemoveLink}
              />
            ))}
          </div>
        )}

        <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5 text-xs text-slate-500 space-y-1">
          <p>Links appear in the order shown. Select <strong className="text-slate-700">Home</strong> from the dropdown to set the home page to <code className="rounded bg-slate-200 px-1 font-mono text-[10px]">/</code></p>
          <p>Click <strong className="text-slate-700">Sub-item</strong> on any link to nest a sub-menu. Sub-menus can be nested to any depth.</p>
          <p className="text-blue-600">Home page cannot be removed.</p>
        </div>
      </EditorSection>

      {/* CTA */}
      <EditorSection
        icon={FiExternalLink}
        title="Call-to-Action Button"
        description="The prominent button on the right side of the navbar"
        tone="orange"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="flex items-baseline gap-1.5 text-sm font-medium text-slate-700">
              Button Text
              <span className="text-xs font-normal text-slate-400">(e.g., "Donate Now")</span>
            </label>
            <input type="text" value={formData.button?.text || ''}
              onChange={(e) => updateFormData('button.text', e.target.value)}
              placeholder="Button text"
              className={`${inputClass} mt-1.5`} disabled={isDisabled} />
          </div>
          <div>
            <label className="flex items-baseline gap-1.5 text-sm font-medium text-slate-700">
              Button URL
              <span className="text-xs font-normal text-slate-400">(destination)</span>
            </label>
            <input type="text" value={formData.button?.href || ''}
              onChange={(e) => updateFormData('button.href', e.target.value)}
              placeholder="/donate"
              className={`${inputClass} mt-1.5`} disabled={isDisabled} />
          </div>
        </div>
      </EditorSection>
    </div>
  );
}