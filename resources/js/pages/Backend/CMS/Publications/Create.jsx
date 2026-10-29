import { Head, Link, usePage } from '@inertiajs/react';
import { FaChevronRight } from 'react-icons/fa';

import AuthenticatedLayout from '../../../../layouts/AuthenticatedLayout';
import PublicationForm from './Components/PublicationForm';
import useContentForm from '../Shared/hooks/useContentForm';

export default function Create() {
  const { props } = usePage();
  const { errors: pageErrors } = props;

  const form = useContentForm({
    initialData: null,
    indexRoute: 'backend.cms.publications.index',
    storeRoute: 'backend.cms.publications.store',
    updateRoute: 'backend.cms.publications.update',
    itemLabel: 'Publication',
  });

  const combinedErrors = { ...pageErrors, ...form.errors };

  return (
    <AuthenticatedLayout>
      <Head title="CMS - Create Publication" />

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
          <span className="text-slate-400">New Publication</span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create Publication
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Add a research paper, report, or downloadable document
          </p>
        </div>

        <PublicationForm form={{ ...form, errors: combinedErrors }} />
      </div>
    </AuthenticatedLayout>
  );
}