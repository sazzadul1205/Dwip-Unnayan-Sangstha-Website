import { Head, usePage } from '@inertiajs/react';
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
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={form.handleCancel}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              title="Back to about content list"
            >
              ←
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">📋 Create About Content</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Fill in the details to create new about content
              </p>
            </div>
          </div>
        </div>

        <AboutForm form={{ ...form, errors: combinedErrors }} />
      </div>
    </AuthenticatedLayout>
  );
}
