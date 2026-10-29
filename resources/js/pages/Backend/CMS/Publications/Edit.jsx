import { Head, Link, usePage } from '@inertiajs/react';
import { FaChevronRight, FaExclamationTriangle } from 'react-icons/fa';

import AuthenticatedLayout from '../../../../layouts/AuthenticatedLayout';
import PublicationForm from './Components/PublicationForm';
import useContentForm from '../Shared/hooks/useContentForm';

export default function Edit({ item }) {
  const { props } = usePage();
  const { errors: pageErrors } = props;

  const form = useContentForm({
    initialData: item,
    indexRoute: 'backend.cms.publications.index',
    storeRoute: 'backend.cms.publications.store',
    updateRoute: 'backend.cms.publications.update',
    itemLabel: 'Publication',
  });

  const combinedErrors = { ...pageErrors, ...form.errors };
  const pageError = combinedErrors?.error
    ? Array.isArray(combinedErrors.error)
      ? combinedErrors.error[0]
      : combinedErrors.error
    : null;

  return (
    <AuthenticatedLayout>
      <Head title={`CMS - Edit: ${item?.title || 'Publication'}`} />

      <div className="mx-auto p-4 md:p-6">
        {/* Breadcrumb */}
        <nav className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
          <Link
            href={window.route('backend.cms.publications.index')}
            className="font-medium text-slate-600 transition hover:text-blue-600"
          >
            Publications
          </Link>
          <FaChevronRight size={8} className="text-slate-300" />
          <span className="text-slate-400">Edit</span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Edit Publication
          </h1>
          <p className="mt-1 truncate text-sm text-slate-500">
            {item?.title || 'Update your publication details'}
          </p>
        </div>

        {/* Page-level error */}
        {pageError && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border-l-4 border-red-400 bg-red-50 px-4 py-3">
            <FaExclamationTriangle className="mt-0.5 shrink-0 text-red-500" size={14} />
            <p className="text-sm text-red-700">{pageError}</p>
          </div>
        )}

        <PublicationForm form={{ ...form, errors: combinedErrors }} />
      </div>
    </AuthenticatedLayout>
  );
}