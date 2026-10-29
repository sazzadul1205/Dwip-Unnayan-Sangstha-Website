// resources/js/Sections/AboutUsSection/AboutUsEditor.jsx

import { useCallback } from 'react';
import { FaPlus, FaInfoCircle, FaList, FaImage, FaChartBar } from 'react-icons/fa';

import EditorSection from '../../pages/Backend/CMS/Shared/components/EditorSection';
import ImageUpload from '../../Shared/SectionEditor/ImageUpload';
import ArrayManager from '../../Shared/SectionEditor/ArrayManager';
import { useImageUpload } from '../../Shared/SectionEditor/useImageUpload';
import { TextField, TextAreaField } from '../../Shared/SectionEditor/Fields';
import { useSectionEditor } from '../../Shared/SectionEditor/useSectionEditor';

const MissionItemRenderer = ({ item, index, onUpdateItem }) => {
  const iconUpload = useImageUpload(item.icon || '');
  const handleIconChange = useCallback((src) => {
    iconUpload.handleImageChange(src);
    onUpdateItem(index, 'icon', src);
  }, [iconUpload, onUpdateItem, index]);
  const handleIconRemove = useCallback(() => {
    iconUpload.handleImageRemove();
    onUpdateItem(index, 'icon', '');
  }, [iconUpload, onUpdateItem, index]);
  const handleFieldChange = useCallback((field, value) => {
    onUpdateItem(index, field, value);
  }, [onUpdateItem, index]);

  return (
    <div className="space-y-3">
      <ImageUpload
        label="Icon image"
        imageSrc={iconUpload.imageSrc}
        onImageChange={handleIconChange}
        onImageRemove={handleIconRemove}
        oldImagePath={iconUpload.oldImagePath}
        imageChanged={iconUpload.imageChanged}
        uploadPath="/storage/AboutUs/mission-icons/"
        isUploading={iconUpload.isUploading}
        uploadError={iconUpload.uploadError}
        dropzoneText="Drop mission icon here"
        acceptedFileTypes="PNG, JPEG, SVG, WebP"
        maxFileSize={2}
        className="h-14 w-14 rounded-lg object-contain ring-1 ring-slate-200"
      />
      <TextField
        label="Icon URL (or use upload above)"
        value={item.icon || ''}
        onChange={(e) => handleFieldChange('icon', e.target.value)}
        placeholder="https://example.com/icon.svg"
      />
      <TextField
        label="Title"
        value={item.title || ''}
        onChange={(e) => handleFieldChange('title', e.target.value)}
        placeholder="Mission title"
      />
      <TextAreaField
        label="Description"
        value={item.description || ''}
        onChange={(e) => handleFieldChange('description', e.target.value)}
        placeholder="Mission description"
        rows={2}
      />
      <TextField
        label="Alt text"
        value={item.alt || ''}
        onChange={(e) => handleFieldChange('alt', e.target.value)}
        placeholder="Icon alt text"
      />
    </div>
  );
};

const StatRenderer = ({ stat, index, onUpdateItem }) => {
  const handleFieldChange = useCallback((field, value) => {
    onUpdateItem(index, field, value);
  }, [onUpdateItem, index]);

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <TextField label="Value" value={stat.value || ''}
        onChange={(e) => handleFieldChange('value', e.target.value)} placeholder="20" />
      <TextField label="Suffix" value={stat.suffix || ''}
        onChange={(e) => handleFieldChange('suffix', e.target.value)} placeholder="+" />
      <TextField label="Label" value={stat.label || ''}
        onChange={(e) => handleFieldChange('label', e.target.value)} placeholder="Years of Service" />
    </div>
  );
};

const AboutUsEditor = ({ section, hasData, onDataChange }) => {
  const {
    formData, updateField, updateArrayItem, addArrayItem, removeArrayItem, isDirty,
  } = useSectionEditor(section, {}, onDataChange);

  const image = useImageUpload(formData?.image?.src || '');

  const handleImageChange = useCallback((src) => {
    image.handleImageChange(src);
    updateField('image.src', src);
  }, [image, updateField]);

  const handleImageRemove = useCallback(() => {
    image.handleImageRemove();
    updateField('image.src', '');
  }, [image, updateField]);

  const handleMissionItemUpdate = useCallback((index, field, value) => {
    updateArrayItem('mission.items', index, field, value);
  }, [updateArrayItem]);

  const handleStatUpdate = useCallback((index, field, value) => {
    updateArrayItem('impact.stats', index, field, value);
  }, [updateArrayItem]);

  if (!hasData || !formData || Object.keys(formData).length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 px-6 py-10 text-center">
        <p className="text-sm font-medium text-slate-600">No data yet</p>
        <p className="mt-0.5 text-xs text-slate-400">
          Click <span className="font-medium text-blue-600">Save Changes</span> to seed the initial data structure
        </p>
      </div>
    );
  }

  const missionItems = formData.mission?.items || [];
  const impactStats = formData.impact?.stats || [];

  return (
    <div className="space-y-5">
      {isDirty && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <FaInfoCircle size={12} className="mt-0.5 shrink-0 text-amber-500" />
          Unsaved changes â€” click <strong className="mx-0.5">Save Changes</strong> to apply.
        </div>
      )}

      {/* Section Content */}
      <EditorSection icon={FaInfoCircle} title="Section Content"
        description="Heading, description, and call-to-action for the block" tone="blue">
        <TextField label="Title" value={formData.section?.title || ''}
          onChange={(e) => updateField('section.title', e.target.value)}
          placeholder="About us" />
        <TextAreaField label="Description" value={formData.section?.description || ''}
          onChange={(e) => updateField('section.description', e.target.value)}
          placeholder="Description about the organization" rows={3} />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <TextField label="Button text" value={formData.section?.button?.text || ''}
            onChange={(e) => updateField('section.button.text', e.target.value)}
            placeholder="More about us" />
          <TextField label="Button link" value={formData.section?.button?.link || ''}
            onChange={(e) => updateField('section.button.link', e.target.value)}
            placeholder="/about" />
        </div>
      </EditorSection>

      {/* Mission Items */}
      <EditorSection
        icon={FaList}
        title="Mission Items"
        description={`${missionItems.length} item${missionItems.length === 1 ? '' : 's'} â€¢ Icons, titles, and descriptions`}
        tone="emerald"
        action={
          <button type="button"
            onClick={() => addArrayItem('mission.items', { icon: '', title: '', description: '', alt: '' })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700">
            <FaPlus size={10} /> Add item
          </button>
        }
      >
        <TextField label="Mission section title" value={formData.mission?.title || ''}
          onChange={(e) => updateField('mission.title', e.target.value)}
          placeholder="The mission of our organization" />

        <ArrayManager
          items={missionItems}
          onAdd={() => addArrayItem('mission.items', { icon: '', title: '', description: '', alt: '' })}
          onRemove={(index) => removeArrayItem('mission.items', index)}
          itemLabel="Mission item"
          addLabel="Add mission item"
          renderItem={(item, index) => (
            <MissionItemRenderer
              key={index}
              item={item}
              index={index}
              onUpdateItem={handleMissionItemUpdate}
            />
          )}
        />
      </EditorSection>

      {/* Impact Stats */}
      <EditorSection
        icon={FaChartBar}
        title="Impact Stats"
        description={`${impactStats.length} stat${impactStats.length === 1 ? '' : 's'} â€¢ Value, suffix, and label`}
        tone="orange"
        action={
          <button type="button"
            onClick={() => addArrayItem('impact.stats', { value: '', suffix: '', label: '' })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700">
            <FaPlus size={10} /> Add stat
          </button>
        }
      >
        <TextField label="Impact section title" value={formData.impact?.title || ''}
          onChange={(e) => updateField('impact.title', e.target.value)}
          placeholder="Impact In Numbers" />

        <ArrayManager
          items={impactStats}
          onAdd={() => addArrayItem('impact.stats', { value: '', suffix: '', label: '' })}
          onRemove={(index) => removeArrayItem('impact.stats', index)}
          itemLabel="Stat"
          addLabel="Add stat"
          renderItem={(stat, index) => (
            <StatRenderer key={index} stat={stat} index={index} onUpdateItem={handleStatUpdate} />
          )}
        />
      </EditorSection>

      {/* Main Image */}
      <EditorSection icon={FaImage} title="Main Image"
        description="Large visual shown beside this block on the frontend" tone="violet">
        <ImageUpload
          label=""
          imageSrc={image.imageSrc}
          onImageChange={handleImageChange}
          onImageRemove={handleImageRemove}
          oldImagePath={image.oldImagePath}
          imageChanged={image.imageChanged}
          uploadPath="/storage/AboutUs/"
          isUploading={image.isUploading}
          uploadError={image.uploadError}
          className="h-20 w-24 rounded-lg object-cover ring-1 ring-slate-200"
        />
        <TextField label="Image alt text" value={formData.image?.alt || ''}
          onChange={(e) => updateField('image.alt', e.target.value)}
          placeholder="About Us Image" />
      </EditorSection>

      {/* Metadata footer */}
      <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs md:grid-cols-4">
        <div>
          <span className="block text-slate-400">Section ID</span>
          <span className="font-mono text-slate-700">{section.id}</span>
        </div>
        <div>
          <span className="block text-slate-400">Data table</span>
          <span className="font-mono text-slate-700">{section.data_table || 'â€”'}</span>
        </div>
        <div>
          <span className="block text-slate-400">Data key</span>
          <span className="font-mono text-slate-700">{section.data_key || 'â€”'}</span>
        </div>
        <div>
          <span className="block text-slate-400">Status</span>
          <span className={`font-medium ${isDirty ? 'text-amber-600' : 'text-emerald-600'}`}>
            {isDirty ? 'Unsaved' : 'Saved'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AboutUsEditor;
