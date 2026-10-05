import { Head, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '../../../../layouts/AuthenticatedLayout';
import BlogForm from './Components/BlogForm';
import FormHeader from '../Shared/components/FormHeader';
import useContentForm from '../Shared/hooks/useContentForm';

export default function Edit({ item }) {
  const { props } = usePage();
  const { errors: pageErrors } = props;

  const form = useContentForm({
    initialData: item,
    indexRoute: 'backend.cms.blogs.index',
    storeRoute: 'backend.cms.blogs.store',
    updateRoute: 'backend.cms.blogs.update',
    itemLabel: 'Blog',
  });

  const combinedErrors = { ...pageErrors, ...form.errors };

  return (
    <AuthenticatedLayout>
      <Head title={`CMS - Edit: ${item?.title || 'Blog'}`} />
      <div className="p-6 max-w-4xl mx-auto">
        <FormHeader
          title="✏️ Edit Blog"
          subtitle="Update your blog post content"
          backRoute={window.route('backend.cms.blogs.index')}
          backText="Back to Blogs"
          error={combinedErrors?.error ? (Array.isArray(combinedErrors.error) ? combinedErrors.error[0] : combinedErrors.error) : null}
        />

        <BlogForm form={{ ...form, errors: combinedErrors }} />
      </div>
    </AuthenticatedLayout>
  );
}
