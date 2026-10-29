import { Head, Link, usePage } from '@inertiajs/react';
import { FaChevronRight } from 'react-icons/fa';

import AuthenticatedLayout from '../../../../layouts/AuthenticatedLayout';
import AboutForm from './Components/AboutForm';
import useContentForm from '../Shared/hooks/useContentForm';

export default function Create() {
  const { props } = usePage();
  const { errors: pageErrors } = props;

  const form = useContentForm({
    initialData: null,
    indexRoute: 'backend.cms.about.index',
    storeRoute: 'backend.cms.about.store',
    updateRoute: 'backend.cms.about.update',
    itemLabel: 'About Content',
  });

  const combinedErrors = { ...pageErrors, ...form.errors };

  return (
    <AuthenticatedLayout>
      <Head title="CMS - Create About Content" />

      <div className="mx-auto sp-4 md:p-6">
        {/* Breadcrumb */}
        <nav className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
          <Link
            href={window.route('backend.cms.about.index')}
            className="font-medium text-slate-600 transition hover:text-blue-600"
          >
            About Content
          </Link>
          <FaChevronRight size={8} className="text-slate-300" />
          <span className="text-slate-400">New Section</span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create About Content
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Add a new section or detail page to your About page
          </p>
        </div>

        <AboutForm form={{ ...form, errors: combinedErrors }} />
      </div>
    </AuthenticatedLayout>
  );
}