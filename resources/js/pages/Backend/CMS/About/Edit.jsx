import { Head, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../../layouts/AuthenticatedLayout';
import AboutForm from './Components/AboutForm';
import FormHeader from '../Shared/components/FormHeader';
import useContentForm from '../Shared/hooks/useContentForm';

export default function Edit({ item }) {
  const { props } = usePage();
  const { errors: pageErrors } = props;

  const form = useContentForm({
    initialData: item,
    indexRoute: 'backend.cms.about.index',
    storeRoute: 'backend.cms.about.store',
    updateRoute: 'backend.cms.about.update',
    itemLabel: 'About Content',
  });

  const combinedErrors = { ...pageErrors, ...form.errors };

  return (
    <AuthenticatedLayout>
      <Head title={`CMS - Edit: ${item?.title || 'About Content'}`} />
      <div className="p-6 max-w-4xl mx-auto">
        <FormHeader
          title="✏️ Edit About Content"
          subtitle="Update your about content details"
          backRoute={window.route('backend.cms.about.index')}
          backText="Back to About Content"
          error={combinedErrors?.error ? (Array.isArray(combinedErrors.error) ? combinedErrors.error[0] : combinedErrors.error) : null}
        />

        <AboutForm form={{ ...form, errors: combinedErrors }} />
      </div>
    </AuthenticatedLayout>
  );
}
