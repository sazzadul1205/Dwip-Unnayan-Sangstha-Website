// resources/js/Sections/FAQSection/FAQEditor.jsx

import { FaQuestionCircle } from 'react-icons/fa';
import ExternalManagerRedirect from '../../Shared/SectionEditor/ExternalManagerRedirect';

const FAQEditor = ({ section, hasData }) => {
  const data = section?.data || {};
  const faqs = data?.faqs || [];

  return (
    <ExternalManagerRedirect
      sectionTitle="FAQ Section"
      icon={FaQuestionCircle}
      tone="blue"
      heading="Shared Data Section"
      description={<>This section uses data from the <strong>Shared Data Manager</strong>. It displays FAQs that are managed centrally.</>}
      hint="To add, edit, or remove FAQs, please go to the Shared Data Manager."
      listLabel="Current FAQs"
      itemNoun="faq"
      items={faqs.map((faq, idx) => faq.question || `FAQ ${idx + 1}`)}
      emptyList={<p className="text-center text-sm text-slate-500">No FAQs available</p>}
      actionLabel="Go to Shared Data Manager"
      actionRoute="backend.cms.shared.index"
      hasData={hasData}
      footerNote={
        <p>FAQ content is managed in the Shared Data Manager so it can be reused across pages.</p>
      }
    >
      <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4 text-sm">
        <div>
          <span className="block text-xs text-slate-400">Data Table</span>
          <p className="font-mono text-slate-700">shared_data</p>
        </div>
        <div>
          <span className="block text-xs text-slate-400">Data Key</span>
          <p className="font-mono text-slate-700">{section.data_key || 'faqData'}</p>
        </div>
        <div>
          <span className="block text-xs text-slate-400">Type</span>
          <p className="font-mono text-slate-700">faq</p>
        </div>
        <div>
          <span className="block text-xs text-slate-400">Status</span>
          <p className={`font-medium ${hasData ? 'text-emerald-600' : 'text-slate-400'}`}>
            {hasData ? 'Has data' : 'No data'}
          </p>
        </div>
      </div>
    </ExternalManagerRedirect>
  );
};

export default FAQEditor;
