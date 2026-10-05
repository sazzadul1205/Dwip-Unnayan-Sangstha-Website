import { Head, usePage } from '@inertiajs/react';
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
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={form.handleCancel}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              title="Back to programs list"
            >
              ←
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">📂 Create New Program</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Fill in the details to create a new program
              </p>
            </div>
          </div>
        </div>

        <ProgramForm form={{ ...form, errors: combinedErrors }} />
      </div>
    </AuthenticatedLayout>
  );
}
