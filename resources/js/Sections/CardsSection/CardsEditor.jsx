// resources/js/Sections/CardsSection/CardsEditor.jsx

import { useState, useEffect } from 'react';
import { FaTrash, FaPlus, FaImage, FaTimes, FaLayerGroup } from 'react-icons/fa';
import Swal from 'sweetalert2';
import EditorSection from '../../pages/Backend/CMS/Shared/components/EditorSection';
import { TextField, SelectField } from '../../Shared/SectionEditor/Fields';

const labelClass = 'block text-xs font-medium text-slate-500 mb-1';

const bgColorOptions = [
  { value: 'bg-[#F5F5F5]', label: 'Light Gray' },
  { value: 'bg-white', label: 'White' },
  { value: 'bg-gray-50', label: 'Gray 50' },
  { value: 'bg-gray-100', label: 'Gray 100' },
  { value: 'bg-blue-50', label: 'Blue 50' },
  { value: 'bg-green-50', label: 'Green 50' },
  { value: 'bg-purple-50', label: 'Purple 50' },
  { value: 'bg-yellow-50', label: 'Yellow 50' },
  { value: 'bg-red-50', label: 'Red 50' },
  { value: 'bg-indigo-50', label: 'Indigo 50' },
  { value: 'bg-pink-50', label: 'Pink 50' },
  { value: 'bg-orange-50', label: 'Orange 50' },
  { value: 'bg-teal-50', label: 'Teal 50' },
];
const cardBgColorOptions = [...bgColorOptions, { value: 'bg-transparent', label: 'Transparent' }];

const CardsEditor = ({ section, hasData, onDataChange }) => {
  const initialData = section?.data?.data || section?.data || {};
  const [formData, setFormData] = useState(initialData);
  const [imageChanges, setImageChanges] = useState({});
  const [oldImagePaths, setOldImagePaths] = useState({});
  const [uploadingImage, setUploadingImage] = useState({});

  useEffect(() => { onDataChange?.(formData); }, [formData, onDataChange]);

  const updateField = (path, value) => {
    const keys = path.split('.');
    const next = { ...formData };
    let cur = next;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!cur[keys[i]]) cur[keys[i]] = {};
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = value;
    setFormData(next);
  };

  const updateArrayItem = (path, index, field, value) => {
    const keys = path.split('.');
    const next = { ...formData };
    let cur = next;
    for (let i = 0; i < keys.length; i++) {
      if (i === keys.length - 1) {
        if (!cur[keys[i]]) cur[keys[i]] = [];
        if (!cur[keys[i]][index]) cur[keys[i]][index] = {};
        cur[keys[i]][index] = { ...cur[keys[i]][index], [field]: value };
      } else {
        if (!cur[keys[i]]) cur[keys[i]] = {};
        cur = cur[keys[i]];
      }
    }
    setFormData(next);
  };

  const updateNestedArrayItem = (path, index, subField, field, value) => {
    const keys = path.split('.');
    const next = { ...formData };
    let cur = next;
    for (let i = 0; i < keys.length; i++) {
      if (i === keys.length - 1) {
        if (!cur[keys[i]]) cur[keys[i]] = [];
        if (!cur[keys[i]][index]) cur[keys[i]][index] = {};
        if (!cur[keys[i]][index][subField]) cur[keys[i]][index][subField] = {};
        cur[keys[i]][index][subField][field] = value;
      } else {
        if (!cur[keys[i]]) cur[keys[i]] = {};
        cur = cur[keys[i]];
      }
    }
    setFormData(next);
  };

  const addCard = () => {
    const next = { ...formData };
    if (!next.cards) next.cards = [];
    next.cards.push({
      id: `card-${Date.now()}`,
      title: '', buttonText: '', buttonLink: '',
      image: { src: '', alt: '', className: 'mx-auto object-contain' },
      bgColor: 'bg-[#F5F5F5]', cardBgColor: 'bg-white',
    });
    setFormData(next);
  };

  const removeCard = (index) => {
    const next = { ...formData };
    if (next.cards?.[index]?.image?.src) {
      setOldImagePaths((prev) => ({ ...prev, [index]: next.cards[index].image.src }));
      setImageChanges((prev) => ({ ...prev, [index]: true }));
    }
    next.cards.splice(index, 1);
    setFormData(next);
  };

  const processImage = (file, index) => {
    if (!file.type.startsWith('image/')) {
      Swal.fire({ icon: 'error', title: 'Invalid file', text: 'Please select an image.', confirmButtonColor: '#3b82f6' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({ icon: 'error', title: 'File too large', text: 'Max 5MB.', confirmButtonColor: '#3b82f6' });
      return;
    }
    const existing = formData.cards?.[index]?.image?.src;
    if (existing && !imageChanges[index]) {
      setOldImagePaths((prev) => ({ ...prev, [index]: existing }));
    }
    setUploadingImage((prev) => ({ ...prev, [index]: true }));
    const reader = new FileReader();
    reader.onload = (e) => {
      updateNestedArrayItem('cards', index, 'image', 'src', e.target.result);
      setImageChanges((prev) => ({ ...prev, [index]: true }));
      setUploadingImage((prev) => ({ ...prev, [index]: false }));
    };
    reader.onerror = () => {
      setUploadingImage((prev) => ({ ...prev, [index]: false }));
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to read image.', confirmButtonColor: '#3b82f6' });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e, i) => {
    e.preventDefault(); e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) processImage(file, i);
  };

  const handleSelect = (e, i) => {
    const file = e.target.files?.[0];
    if (file) processImage(file, i);
    e.target.value = '';
  };

  const removeImage = (index) => {
    const existing = formData.cards?.[index]?.image?.src;
    if (existing) setOldImagePaths((prev) => ({ ...prev, [index]: existing }));
    updateNestedArrayItem('cards', index, 'image', 'src', '');
    setImageChanges((prev) => ({ ...prev, [index]: true }));
  };

  const displayPath = (src) => {
    if (!src) return '';
    if (src.startsWith('data:image')) return 'New image (pending upload)';
    return src.length > 45 ? `${src.substring(0, 45)}â€¦` : src;
  };

  if (!hasData || !formData || Object.keys(formData).length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 px-6 py-10 text-center">
        <p className="text-sm font-medium text-slate-600">No data yet</p>
        <p className="mt-0.5 text-xs text-slate-400">Click <span className="font-medium text-blue-600">Save Changes</span> to seed the initial structure</p>
      </div>
    );
  }

  const cards = formData.cards || [];

  return (
    <div className="space-y-5">
      <EditorSection
        icon={FaLayerGroup}
        title="Section Content"
        description="Heading displayed above the card grid"
        tone="blue"
      >
        <TextField
          label="Section title"
          value={formData.section?.title || ''}
          onChange={(e) => updateField('section.title', e.target.value)}
          placeholder="Cards Section"
        />
      </EditorSection>

      <EditorSection
        icon={FaLayerGroup}
        title="Cards"
        description={`${cards.length} card${cards.length === 1 ? '' : 's'} â€¢ Image, title, CTA, and colors`}
        tone="orange"
        action={
          <button
            type="button" onClick={addCard}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700"
          >
            <FaPlus size={10} /> Add card
          </button>
        }
      >
        {cards.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/40 px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-600">No cards yet</p>
            <p className="mt-0.5 text-xs text-slate-400">Click <span className="font-medium text-blue-600">Add card</span> to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cards.map((card, index) => (
              <div key={card.id || index} className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600">
                      {index + 1}
                    </span>
                    {card.title || `Card ${index + 1}`}
                  </span>
                  <button
                    type="button" onClick={() => removeCard(index)}
                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <FaTrash size={11} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Image column */}
                  <div>
                    <label className={labelClass}>Card image</label>
                    <div
                      className={`relative mt-1 rounded-lg border-2 border-dashed p-3 transition ${uploadingImage[index]
                          ? 'pointer-events-none opacity-60'
                          : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                        }`}
                      onDragEnter={(e) => e.preventDefault()}
                      onDragLeave={(e) => e.preventDefault()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      {card.image?.src ? (
                        <div className="flex items-center gap-3">
                          <img
                            src={card.image.src}
                            alt={card.image?.alt || ''}
                            className="h-14 w-20 shrink-0 rounded-md border border-slate-200 object-contain"
                          />
                          <span className="flex-1 truncate text-xs text-slate-500">{displayPath(card.image.src)}</span>
                          <button
                            type="button" onClick={() => removeImage(index)}
                            className="shrink-0 rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <FaTimes size={11} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 py-1 text-slate-400">
                          <FaImage size={14} />
                          <span className="text-xs">Drop image or click to browse</span>
                        </div>
                      )}
                      <input
                        type="file" accept="image/*"
                        onChange={(e) => handleSelect(e, index)}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        disabled={uploadingImage[index]}
                      />
                    </div>
                    {imageChanges[index] && oldImagePaths[index] && (
                      <p className="mt-1 text-[11px] text-red-500">Old image will be deleted on save</p>
                    )}
                    <div className="mt-2 space-y-2">
                      <TextField label="Image alt text"
                        value={card.image?.alt || ''}
                        onChange={(e) => updateNestedArrayItem('cards', index, 'image', 'alt', e.target.value)}
                        placeholder="Operational Areas" />
                      <TextField label="Image class name"
                        value={card.image?.className || ''}
                        onChange={(e) => updateNestedArrayItem('cards', index, 'image', 'className', e.target.value)}
                        placeholder="mx-auto object-contain" />
                    </div>
                  </div>

                  {/* Fields column */}
                  <div className="space-y-3">
                    <TextField label="Card ID"
                      value={card.id || ''}
                      onChange={(e) => updateArrayItem('cards', index, 'id', e.target.value)}
                      placeholder="operational-areas" />
                    <TextField label="Title"
                      value={card.title || ''}
                      onChange={(e) => updateArrayItem('cards', index, 'title', e.target.value)}
                      placeholder="Operational Areas" />
                    <TextField label="Button text"
                      value={card.buttonText || ''}
                      onChange={(e) => updateArrayItem('cards', index, 'buttonText', e.target.value)}
                      placeholder="Explore Our Areas" />
                    <TextField label="Button link"
                      value={card.buttonLink || ''}
                      onChange={(e) => updateArrayItem('cards', index, 'buttonLink', e.target.value)}
                      placeholder="/about/operational-areas" />
                    <div className="grid grid-cols-2 gap-2">
                      <SelectField label="Section BG"
                        value={card.bgColor || 'bg-[#F5F5F5]'}
                        onChange={(e) => updateArrayItem('cards', index, 'bgColor', e.target.value)}
                        options={bgColorOptions} />
                      <SelectField label="Card BG"
                        value={card.cardBgColor || 'bg-white'}
                        onChange={(e) => updateArrayItem('cards', index, 'cardBgColor', e.target.value)}
                        options={cardBgColorOptions} />
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    Section: <span className={`h-4 w-6 rounded border border-slate-200 ${card.bgColor || 'bg-[#F5F5F5]'}`} />
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    Card: <span className={`h-4 w-6 rounded border border-slate-200 ${card.cardBgColor || 'bg-white'}`} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </EditorSection>

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
          <span className="block text-slate-400">Cards</span>
          <span className="font-medium text-slate-700">{cards.length}</span>
        </div>
      </div>
    </div>
  );
};

export default CardsEditor;
