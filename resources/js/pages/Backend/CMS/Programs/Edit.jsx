import { Head, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../../layouts/AuthenticatedLayout';
import ProgramForm from './Components/ProgramForm';
import FormHeader from '../Shared/components/FormHeader';
import useContentForm from '../Shared/hooks/useContentForm';

export default function Edit({ item }) {
  const { props } = usePage();
  const { errors: pageErrors } = props;

  const form = useContentForm({
    initialData: item,
    indexRoute: 'backend.cms.programs.index',
    storeRoute: 'backend.cms.programs.store',
    updateRoute: 'backend.cms.programs.update',
    itemLabel: 'Program',
  });

  const combinedErrors = { ...pageErrors, ...form.errors };

  return (
    <AuthenticatedLayout>
      <Head title={`CMS - Edit: ${item?.title || 'Program'}`} />
      <div className="p-6 max-w-4xl mx-auto">
        <FormHeader
          title="✏️ Edit Program"
          subtitle="Update your program content"
          backRoute={window.route('backend.cms.programs.index')}
          backText="Back to Programs"
          error={combinedErrors?.error ? (Array.isArray(combinedErrors.error) ? combinedErrors.error[0] : combinedErrors.error) : null}
        />

        <ProgramForm form={{ ...form, errors: combinedErrors }} />
      </div>
    </AuthenticatedLayout>
  );
}
