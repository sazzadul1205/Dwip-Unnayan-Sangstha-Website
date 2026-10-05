import { Head, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../../layouts/AuthenticatedLayout';
import PublicationForm from './Components/PublicationForm';
import FormHeader from '../Shared/components/FormHeader';
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

  return (
    <AuthenticatedLayout>
      <Head title={`CMS - Edit: ${item?.title || 'Publication'}`} />
      <div className="p-6 max-w-4xl mx-auto">
        <FormHeader
          title="✏️ Edit Publication"
          subtitle="Update your publication details"
          backRoute={window.route('backend.cms.publications.index')}
          backText="Back to Publications"
          error={combinedErrors?.error ? (Array.isArray(combinedErrors.error) ? combinedErrors.error[0] : combinedErrors.error) : null}
        />

        <PublicationForm form={{ ...form, errors: combinedErrors }} />
      </div>
    </AuthenticatedLayout>
  );
}
