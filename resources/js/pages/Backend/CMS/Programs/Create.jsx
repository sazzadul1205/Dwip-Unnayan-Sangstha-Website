import { Head, Link, usePage } from '@inertiajs/react';
import { FaChevronRight } from 'react-icons/fa';

import AuthenticatedLayout from '../../../../layouts/AuthenticatedLayout';
import ProgramForm from './Components/ProgramForm';
import useContentForm from '../Shared/hooks/useContentForm';

export default function Create() {
  const { props } = usePage();
  const { errors: pageErrors } = props;

  const form = useContentForm({
    initialData: null,
    indexRoute: 'backend.cms.programs.index',
    storeRoute: 'backend.cms.programs.store',
    updateRoute: 'backend.cms.programs.update',
    itemLabel: 'Program',
  });

  const combinedErrors = { ...pageErrors, ...form.errors };

  return (
    <AuthenticatedLayout>
      <Head title="CMS - Create Program" />

      <div className="mx-auto p-4 md:p-6">
        {/* Breadcrumb */}
        <nav className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
          <Link
            href={window.route('backend.cms.programs.index')}
            className="font-medium text-slate-600 transition hover:text-blue-600"
          >
            Programs
          </Link>
          <FaChevronRight size={8} className="text-slate-300" />
          <span className="text-slate-400">New Program</span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create New Program
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Fill in the details below to add a new program
          </p>
        </div>

        <ProgramForm form={{ ...form, errors: combinedErrors }} />
      </div>
    </AuthenticatedLayout>
  );
}