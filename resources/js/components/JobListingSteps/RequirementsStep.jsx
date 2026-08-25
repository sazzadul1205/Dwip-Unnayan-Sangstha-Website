// resources/js/components/JobListingSteps/RequirementsStep.jsx

import React, { useCallback } from 'react';
import { StepWrapper } from './StepWrapper';
import CustomEditor from '../../components/CustomEditor';
import { FaInfoCircle, FaSearch, FaTimes } from 'react-icons/fa';

// Comprehensive Education Requirements Array
const educationRequirements = [
  // No Formal Education
  { value: "No formal education required", label: "No Formal Education Required", category: "None" },

  // Primary Education
  { value: "Class 1-4 (Primary Education)", label: "Primary Education (Class 1-4)", category: "Primary" },
  { value: "Class 5 (Primary School Certificate)", label: "PSC - Primary School Certificate (Class 5)", category: "Primary" },

  // Junior Secondary
  { value: "Class 6-7 (Junior Secondary)", label: "Junior Secondary (Class 6-7)", category: "Secondary" },
  { value: "Class 8 (Junior School Certificate)", label: "JSC - Junior School Certificate (Class 8)", category: "Secondary" },

  // Secondary Education
  { value: "Class 9-10 (Secondary)", label: "Secondary (Class 9-10)", category: "Secondary" },
  { value: "SSC (Secondary School Certificate)", label: "SSC - Secondary School Certificate", category: "Secondary" },
  { value: "SSC (Science)", label: "SSC - Science Group", category: "Secondary" },
  { value: "SSC (Commerce)", label: "SSC - Commerce Group", category: "Secondary" },
  { value: "SSC (Arts)", label: "SSC - Arts/Humanities Group", category: "Secondary" },
  { value: "SSC (Vocational)", label: "SSC - Vocational", category: "Secondary" },
  { value: "O Level", label: "O Level (Cambridge/Oxford)", category: "Secondary" },
  { value: "Dakhil (Madrasah)", label: "Dakhil - Madrasah Secondary (Class 10)", category: "Secondary" },

  // Higher Secondary Education
  { value: "Class 11-12 (Higher Secondary)", label: "Higher Secondary (Class 11-12)", category: "Higher Secondary" },
  { value: "HSC (Higher Secondary Certificate)", label: "HSC - Higher Secondary Certificate", category: "Higher Secondary" },
  { value: "HSC (Science)", label: "HSC - Science Group", category: "Higher Secondary" },
  { value: "HSC (Commerce)", label: "HSC - Commerce Group", category: "Higher Secondary" },
  { value: "HSC (Arts)", label: "HSC - Arts/Humanities Group", category: "Higher Secondary" },
  { value: "HSC (Business Management)", label: "HSC - Business Management", category: "Higher Secondary" },
  { value: "A Level", label: "A Level (Cambridge/Oxford)", category: "Higher Secondary" },
  { value: "Alim (Madrasah)", label: "Alim - Madrasah Higher Secondary (Class 12)", category: "Higher Secondary" },

  // Diploma & Technical Education
  { value: "Diploma in Engineering", label: "Diploma in Engineering (General)", category: "Diploma" },
  { value: "Diploma in Computer Science", label: "Diploma in Computer Science & Technology", category: "Diploma" },
  { value: "Diploma in Electrical Engineering", label: "Diploma in Electrical Engineering", category: "Diploma" },
  { value: "Diploma in Electronic Engineering", label: "Diploma in Electronic Engineering", category: "Diploma" },
  { value: "Diploma in Civil Engineering", label: "Diploma in Civil Engineering", category: "Diploma" },
  { value: "Diploma in Mechanical Engineering", label: "Diploma in Mechanical Engineering", category: "Diploma" },
  { value: "Diploma in Textile Engineering", label: "Diploma in Textile Engineering", category: "Diploma" },
  { value: "Diploma in Architecture", label: "Diploma in Architecture & Interior Design", category: "Diploma" },
  { value: "Diploma in Nursing", label: "Diploma in Nursing Science", category: "Diploma" },
  { value: "Diploma in Medical Technology", label: "Diploma in Medical Technology", category: "Diploma" },
  { value: "Diploma in Agriculture", label: "Diploma in Agriculture", category: "Diploma" },
  { value: "Diploma in Business Studies", label: "Diploma in Business Studies", category: "Diploma" },
  { value: "Diploma in Hotel Management", label: "Diploma in Hotel Management", category: "Diploma" },
  { value: "Diploma in Tourism", label: "Diploma in Tourism & Hospitality", category: "Diploma" },
  { value: "Diploma in Graphic Design", label: "Diploma in Graphic Design & Multimedia", category: "Diploma" },
  { value: "Diploma in Fashion Design", label: "Diploma in Fashion Design", category: "Diploma" },
  { value: "Diploma in Library Science", label: "Diploma in Library & Information Science", category: "Diploma" },

  // Bachelor's Degrees
  { value: "Bachelor's degree (Pass)", label: "Bachelor's Degree (Pass - 3 Years)", category: "Bachelor's" },
  { value: "Bachelor's degree (Honours)", label: "Bachelor's Degree (Honours - 4 Years)", category: "Bachelor's" },
  { value: "BSc in Computer Science & Engineering", label: "BSc in Computer Science & Engineering (CSE)", category: "Bachelor's" },
  { value: "BSc in Software Engineering", label: "BSc in Software Engineering", category: "Bachelor's" },
  { value: "BSc in Information Technology", label: "BSc in Information Technology", category: "Bachelor's" },
  { value: "BSc in Electrical & Electronic Engineering", label: "BSc in Electrical & Electronic Engineering (EEE)", category: "Bachelor's" },
  { value: "BSc in Civil Engineering", label: "BSc in Civil Engineering", category: "Bachelor's" },
  { value: "BSc in Mechanical Engineering", label: "BSc in Mechanical Engineering", category: "Bachelor's" },
  { value: "BSc in Industrial Engineering", label: "BSc in Industrial & Production Engineering", category: "Bachelor's" },
  { value: "BSc in Textile Engineering", label: "BSc in Textile Engineering", category: "Bachelor's" },
  { value: "BSc in Chemical Engineering", label: "BSc in Chemical Engineering", category: "Bachelor's" },
  { value: "BSc in Biomedical Engineering", label: "BSc in Biomedical Engineering", category: "Bachelor's" },
  { value: "BSc in Environmental Science", label: "BSc in Environmental Science & Engineering", category: "Bachelor's" },
  { value: "BSc in Architecture", label: "BSc in Architecture", category: "Bachelor's" },
  { value: "BSc in Physics", label: "BSc in Physics", category: "Bachelor's" },
  { value: "BSc in Chemistry", label: "BSc in Chemistry", category: "Bachelor's" },
  { value: "BSc in Mathematics", label: "BSc in Mathematics", category: "Bachelor's" },
  { value: "BSc in Statistics", label: "BSc in Statistics", category: "Bachelor's" },
  { value: "BSc in Geography", label: "BSc in Geography & Environment", category: "Bachelor's" },
  { value: "BBA (Bachelor of Business Administration)", label: "BBA - Bachelor of Business Administration", category: "Bachelor's" },
  { value: "BBA in Finance", label: "BBA in Finance & Banking", category: "Bachelor's" },
  { value: "BBA in Marketing", label: "BBA in Marketing", category: "Bachelor's" },
  { value: "BBA in HRM", label: "BBA in Human Resource Management", category: "Bachelor's" },
  { value: "BBA in Accounting", label: "BBA in Accounting", category: "Bachelor's" },
  { value: "BBA in Management", label: "BBA in Management", category: "Bachelor's" },
  { value: "BBA in MIS", label: "BBA in Management Information Systems", category: "Bachelor's" },
  { value: "BA (Bachelor of Arts)", label: "BA - Bachelor of Arts", category: "Bachelor's" },
  { value: "BA in English", label: "BA in English Literature", category: "Bachelor's" },
  { value: "BA in Bangla", label: "BA in Bangla Literature", category: "Bachelor's" },
  { value: "BA in History", label: "BA in History", category: "Bachelor's" },
  { value: "BA in Philosophy", label: "BA in Philosophy", category: "Bachelor's" },
  { value: "BA in Islamic Studies", label: "BA in Islamic Studies", category: "Bachelor's" },
  { value: "BSS (Bachelor of Social Science)", label: "BSS - Bachelor of Social Science", category: "Bachelor's" },
  { value: "BSS in Economics", label: "BSS in Economics", category: "Bachelor's" },
  { value: "BSS in Political Science", label: "BSS in Political Science", category: "Bachelor's" },
  { value: "BSS in Sociology", label: "BSS in Sociology", category: "Bachelor's" },
  { value: "BSS in Anthropology", label: "BSS in Anthropology", category: "Bachelor's" },
  { value: "BSS in International Relations", label: "BSS in International Relations", category: "Bachelor's" },
  { value: "BSS in Journalism", label: "BSS in Journalism & Media Studies", category: "Bachelor's" },
  { value: "LLB (Bachelor of Laws)", label: "LLB - Bachelor of Laws", category: "Bachelor's" },
  { value: "LLB (Honours)", label: "LLB (Honours) - 4 Years", category: "Bachelor's" },
  { value: "MBBS (Bachelor of Medicine)", label: "MBBS - Bachelor of Medicine, Bachelor of Surgery", category: "Bachelor's" },
  { value: "BDS (Bachelor of Dental Surgery)", label: "BDS - Bachelor of Dental Surgery", category: "Bachelor's" },
  { value: "BPharm (Bachelor of Pharmacy)", label: "BPharm - Bachelor of Pharmacy", category: "Bachelor's" },
  { value: "BSc in Nursing", label: "BSc in Nursing", category: "Bachelor's" },
  { value: "BSc in Public Health", label: "BSc in Public Health", category: "Bachelor's" },
  { value: "BSc in Physiotherapy", label: "BSc in Physiotherapy", category: "Bachelor's" },
  { value: "BSc in Agriculture", label: "BSc in Agriculture", category: "Bachelor's" },
  { value: "BSc in Fisheries", label: "BSc in Fisheries & Aquaculture", category: "Bachelor's" },
  { value: "BSc in Veterinary Science", label: "BSc in Veterinary Science & Animal Husbandry", category: "Bachelor's" },
  { value: "BSc in Food Engineering", label: "BSc in Food Engineering & Technology", category: "Bachelor's" },
  { value: "BFA (Bachelor of Fine Arts)", label: "BFA - Bachelor of Fine Arts", category: "Bachelor's" },
  { value: "BBA in E-Commerce", label: "BBA in E-Commerce & Digital Business", category: "Bachelor's" },
  { value: "BBA in Supply Chain", label: "BBA in Supply Chain Management", category: "Bachelor's" },

  // Professional Certifications
  { value: "Professional Certification", label: "Professional Certification", category: "Professional" },
  { value: "Certified Public Accountant (CPA)", label: "CPA - Certified Public Accountant", category: "Professional" },
  { value: "Chartered Accountant (CA)", label: "CA - Chartered Accountant", category: "Professional" },
  { value: "ACCA Certification", label: "ACCA - Association of Chartered Certified Accountants", category: "Professional" },
  { value: "CIMA Certification", label: "CIMA - Chartered Institute of Management Accountants", category: "Professional" },
  { value: "PMP Certification", label: "PMP - Project Management Professional", category: "Professional" },
  { value: "Cisco Certification (CCNA)", label: "CCNA - Cisco Certified Network Associate", category: "Professional" },
  { value: "Cisco Certification (CCNP)", label: "CCNP - Cisco Certified Network Professional", category: "Professional" },
  { value: "Microsoft Certification (MCSA)", label: "MCSA - Microsoft Certified Solutions Associate", category: "Professional" },
  { value: "Microsoft Certification (MCSE)", label: "MCSE - Microsoft Certified Solutions Expert", category: "Professional" },
  { value: "AWS Certification", label: "AWS Certified Solutions Architect/Developer", category: "Professional" },
  { value: "Google Cloud Certification", label: "Google Cloud Professional Certification", category: "Professional" },
  { value: "Oracle Certification", label: "Oracle Certified Professional", category: "Professional" },
  { value: "CompTIA A+", label: "CompTIA A+ Certification", category: "Professional" },
  { value: "CompTIA Security+", label: "CompTIA Security+ Certification", category: "Professional" },
  { value: "CompTIA Network+", label: "CompTIA Network+ Certification", category: "Professional" },
  { value: "ITIL Certification", label: "ITIL Foundation/Professional Certification", category: "Professional" },
  { value: "Six Sigma Yellow Belt", label: "Six Sigma Yellow Belt", category: "Professional" },
  { value: "Six Sigma Green Belt", label: "Six Sigma Green Belt", category: "Professional" },
  { value: "Six Sigma Black Belt", label: "Six Sigma Black Belt", category: "Professional" },
  { value: "IELTS Certification", label: "IELTS (International English Language Testing System)", category: "Professional" },
  { value: "TOEFL Certification", label: "TOEFL (Test of English as a Foreign Language)", category: "Professional" },
  { value: "TESOL Certification", label: "TESOL - Teaching English Certification", category: "Professional" },
  { value: "NEBOSH Certification", label: "NEBOSH - Health & Safety Certification", category: "Professional" },
  { value: "HR Certification", label: "HRCI/SHRM Professional HR Certification", category: "Professional" },
  { value: "CFA Certification", label: "CFA - Chartered Financial Analyst", category: "Professional" },
  { value: "FRM Certification", label: "FRM - Financial Risk Manager", category: "Professional" },

  // Master's Degrees
  { value: "Master's degree", label: "Master's Degree (General)", category: "Master's" },
  { value: "MBA (Master of Business Administration)", label: "MBA - Master of Business Administration", category: "Master's" },
  { value: "MBA in Finance", label: "MBA in Finance", category: "Master's" },
  { value: "MBA in Marketing", label: "MBA in Marketing", category: "Master's" },
  { value: "MBA in HRM", label: "MBA in Human Resource Management", category: "Master's" },
  { value: "MBA in Accounting", label: "MBA in Accounting", category: "Master's" },
  { value: "MBA in MIS", label: "MBA in Management Information Systems", category: "Master's" },
  { value: "MBA in Supply Chain", label: "MBA in Supply Chain Management", category: "Master's" },
  { value: "Executive MBA", label: "Executive MBA (EMBA)", category: "Master's" },
  { value: "MA (Master of Arts)", label: "MA - Master of Arts", category: "Master's" },
  { value: "MA in English", label: "MA in English Language & Literature", category: "Master's" },
  { value: "MA in Bangla", label: "MA in Bangla Literature & Culture", category: "Master's" },
  { value: "MA in History", label: "MA in History & Civilization", category: "Master's" },
  { value: "MA in Philosophy", label: "MA in Philosophy & Ethics", category: "Master's" },
  { value: "MSS (Master of Social Science)", label: "MSS - Master of Social Science", category: "Master's" },
  { value: "MSS in Economics", label: "MSS in Economics", category: "Master's" },
  { value: "MSS in Political Science", label: "MSS in Political Science & Governance", category: "Master's" },
  { value: "MSS in Sociology", label: "MSS in Sociology & Social Research", category: "Master's" },
  { value: "MSS in International Relations", label: "MSS in International Relations & Diplomacy", category: "Master's" },
  { value: "MSc (Master of Science)", label: "MSc - Master of Science (General)", category: "Master's" },
  { value: "MSc in Computer Science", label: "MSc in Computer Science & Engineering", category: "Master's" },
  { value: "MSc in Data Science", label: "MSc in Data Science & Analytics", category: "Master's" },
  { value: "MSc in AI", label: "MSc in Artificial Intelligence & Machine Learning", category: "Master's" },
  { value: "MSc in Cybersecurity", label: "MSc in Cybersecurity & Information Security", category: "Master's" },
  { value: "MSc in Electrical Engineering", label: "MSc in Electrical & Electronic Engineering", category: "Master's" },
  { value: "MSc in Civil Engineering", label: "MSc in Civil & Structural Engineering", category: "Master's" },
  { value: "MSc in Environmental Science", label: "MSc in Environmental Science & Sustainability", category: "Master's" },
  { value: "MSc in Mathematics", label: "MSc in Mathematics & Applied Mathematics", category: "Master's" },
  { value: "MSc in Statistics", label: "MSc in Statistics & Data Analysis", category: "Master's" },
  { value: "MSc in Physics", label: "MSc in Physics & Quantum Physics", category: "Master's" },
  { value: "MSc in Chemistry", label: "MSc in Chemistry & Biochemistry", category: "Master's" },
  { value: "MSc in Biotechnology", label: "MSc in Biotechnology & Genetic Engineering", category: "Master's" },
  { value: "MSc in Microbiology", label: "MSc in Microbiology & Immunology", category: "Master's" },
  { value: "MSc in Public Health", label: "MSc in Public Health & Epidemiology", category: "Master's" },
  { value: "LLM (Master of Laws)", label: "LLM - Master of Laws", category: "Master's" },
  { value: "LLM in International Law", label: "LLM in International Law & Human Rights", category: "Master's" },
  { value: "MPH (Master of Public Health)", label: "MPH - Master of Public Health", category: "Master's" },
  { value: "M.Pharm (Master of Pharmacy)", label: "M.Pharm - Master of Pharmacy", category: "Master's" },
  { value: "MDS (Master of Dental Surgery)", label: "MDS - Master of Dental Surgery", category: "Master's" },
  { value: "MS in Nursing", label: "MS in Nursing & Healthcare Management", category: "Master's" },

  // Post Graduate Diplomas
  { value: "Post Graduate Diploma (PGD)", label: "PGD - Post Graduate Diploma (General)", category: "PGD" },
  { value: "PGD in ICT", label: "PGD in Information & Communication Technology", category: "PGD" },
  { value: "PGD in HRM", label: "PGD in Human Resource Management", category: "PGD" },
  { value: "PGD in Marketing", label: "PGD in Marketing & Brand Management", category: "PGD" },
  { value: "PGD in Finance", label: "PGD in Finance & Investment Analysis", category: "PGD" },
  { value: "PGD in Supply Chain", label: "PGD in Supply Chain & Logistics Management", category: "PGD" },
  { value: "PGD in Project Management", label: "PGD in Project Management", category: "PGD" },
  { value: "PGD in Business Analytics", label: "PGD in Business Analytics & Intelligence", category: "PGD" },
  { value: "PGD in Development Studies", label: "PGD in Development Studies & NGO Management", category: "PGD" },

  // Doctoral Degrees
  { value: "PhD (Doctor of Philosophy)", label: "PhD - Doctor of Philosophy (General)", category: "Doctoral" },
  { value: "PhD in Engineering", label: "PhD in Engineering & Technology", category: "Doctoral" },
  { value: "PhD in Science", label: "PhD in Natural & Applied Sciences", category: "Doctoral" },
  { value: "PhD in Business", label: "PhD in Business Administration & Management", category: "Doctoral" },
  { value: "PhD in Social Science", label: "PhD in Social Sciences & Humanities", category: "Doctoral" },
  { value: "PhD in Law", label: "PhD in Law & Legal Studies", category: "Doctoral" },
  { value: "PhD in Medicine", label: "PhD in Medical Sciences & Research", category: "Doctoral" },
  { value: "PhD in Education", label: "PhD in Education & Pedagogy", category: "Doctoral" },
  { value: "DBA (Doctor of Business Administration)", label: "DBA - Doctor of Business Administration", category: "Doctoral" },
  { value: "DLitt (Doctor of Literature)", label: "DLitt - Doctor of Literature", category: "Doctoral" },
  { value: "DSc (Doctor of Science)", label: "DSc - Doctor of Science", category: "Doctoral" },

  // Vocational Training
  { value: "Vocational Training", label: "Vocational Training (General)", category: "Vocational" },
  { value: "IT Support Training", label: "IT Support & Help Desk Training", category: "Vocational" },
  { value: "Web Development Bootcamp", label: "Web Development Bootcamp/Course", category: "Vocational" },
  { value: "Digital Marketing Course", label: "Digital Marketing & SEO Training", category: "Vocational" },
  { value: "Graphic Design Course", label: "Graphic Design & Creative Arts Training", category: "Vocational" },
  { value: "Electrician Training", label: "Electrician & Wiring Training", category: "Vocational" },
  { value: "Plumbing Training", label: "Plumbing & Pipe Fitting Training", category: "Vocational" },
  { value: "Welding Training", label: "Welding & Fabrication Training", category: "Vocational" },
  { value: "Driving Training", label: "Professional Driving Training", category: "Vocational" },
  { value: "Culinary Training", label: "Culinary Arts & Cooking Training", category: "Vocational" },
  { value: "Beautician Course", label: "Beautician & Cosmetology Course", category: "Vocational" },
  { value: "Tailoring Training", label: "Tailoring & Garment Making Training", category: "Vocational" },
];

export const RequirementsStep = ({ formData, errors, handleChange, handleArrayChange, setFormData }) => {
  const [newSkill, setNewSkill] = React.useState('');
  const [newResponsibility, setNewResponsibility] = React.useState('');
  const [newBenefit, setNewBenefit] = React.useState('');

  // Education search state
  const [educationSearch, setEducationSearch] = React.useState('');
  const [showEducationDropdown, setShowEducationDropdown] = React.useState(false);
  const [filteredEducation, setFilteredEducation] = React.useState([]);
  const [selectedEducationIndex, setSelectedEducationIndex] = React.useState(-1);

  const searchInputRef = React.useRef(null);
  const dropdownRef = React.useRef(null);

  // Initialize filtered education and find selected index
  React.useEffect(() => {
    filterEducation(educationSearch);
  }, [educationSearch, filterEducation, formData.education_requirement]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowEducationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filterEducation = useCallback((searchTerm) => {
    let filtered = educationRequirements;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = educationRequirements.filter(edu =>
        edu.label.toLowerCase().includes(searchLower) ||
        edu.value.toLowerCase().includes(searchLower) ||
        edu.category.toLowerCase().includes(searchLower)
      );
    } else {
      // Show first 15 items initially
      filtered = educationRequirements.slice(0, 15);
    }

    setFilteredEducation(filtered);

    // Find index of currently selected education
    if (formData.education_requirement) {
      const selectedIdx = filtered.findIndex(edu => edu.value === formData.education_requirement);
      setSelectedEducationIndex(selectedIdx >= 0 ? selectedIdx : -1);
    } else {
      setSelectedEducationIndex(-1);
    }
  }, [formData.education_requirement] );

  const handleEducationSearch = (e) => {
    const value = e.target.value;
    setEducationSearch(value);
    filterEducation(value);
    setShowEducationDropdown(true);
  };

  const handleEducationSelect = (eduValue) => {
    setFormData(prev => ({ ...prev, education_requirement: eduValue }));
    setEducationSearch('');
    setShowEducationDropdown(false);

    // Trigger handleChange for form validation
    handleChange({ target: { name: 'education_requirement', value: eduValue } });
  };

  const handleEducationKeyDown = (e) => {
    if (!showEducationDropdown) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setShowEducationDropdown(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedEducationIndex(prev =>
          prev < filteredEducation.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedEducationIndex(prev =>
          prev > 0 ? prev - 1 : filteredEducation.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedEducationIndex >= 0 && selectedEducationIndex < filteredEducation.length) {
          handleEducationSelect(filteredEducation[selectedEducationIndex].value);
        }
        break;
      case 'Escape':
        setShowEducationDropdown(false);
        break;
    }
  };

  const clearEducation = () => {
    setFormData(prev => ({ ...prev, education_requirement: '' }));
    setEducationSearch('');
    setShowEducationDropdown(false);
    handleChange({ target: { name: 'education_requirement', value: '' } });
  };

  // Get selected education label
  const getSelectedEducationLabel = () => {
    if (!formData.education_requirement) return '';
    const selected = educationRequirements.find(edu => edu.value === formData.education_requirement);
    return selected ? selected.label : formData.education_requirement;
  };

  const addItem = (arrayName, value, setter) => {
    if (value.trim()) {
      handleArrayChange(arrayName, [...formData[arrayName], value.trim()]);
      setter('');
    }
  };

  const removeItem = (arrayName, index) => {
    const newArray = [...formData[arrayName]];
    newArray.splice(index, 1);
    handleArrayChange(arrayName, newArray);
  };

  return (
    <StepWrapper
      title="Requirements & Qualifications"
      description="Define what candidates need to succeed in this role"
      isActive={true}
      stepNumber={2}
    >
      <div className="space-y-6">
        {/* Job Requirements - Using CustomEditor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Detailed Requirements <span className="text-red-500">*</span>
          </label>
          <CustomEditor
            value={formData.requirements}
            onChange={(html) => setFormData(prev => ({ ...prev, requirements: html }))}
            placeholder="List the qualifications, skills, experience, and any specific requirements for this role..."
          />
          {errors.requirements && <p className="mt-1 text-sm text-red-500">{errors.requirements}</p>}
          <p className="mt-1 text-xs text-gray-500">
            Minimum 50 characters. Be specific about what you're looking for in a candidate.
          </p>
        </div>

        {/* Skills - List Based */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Required Skills <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addItem('skills', newSkill, setNewSkill)}
              placeholder="e.g., JavaScript, Project Management, Communication"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => addItem('skills', newSkill, setNewSkill)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Add Skill
            </button>
          </div>

          {/* List View instead of Tags */}
          {formData.skills.length > 0 ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Skill Name</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.skills.map((skill, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{skill}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeItem('skills', index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-sm text-gray-500">No skills added yet</p>
              <p className="text-xs text-gray-400 mt-1">Add skills using the input above</p>
            </div>
          )}

          {errors.skills && <p className="mt-1 text-sm text-red-500">{errors.skills}</p>}
          <p className="mt-1 text-xs text-gray-500">Add at least one required skill</p>
        </div>

        {/* Responsibilities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Key Responsibilities <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newResponsibility}
              onChange={(e) => setNewResponsibility(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addItem('responsibilities', newResponsibility, setNewResponsibility)}
              placeholder="e.g., Lead development of new features"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => addItem('responsibilities', newResponsibility, setNewResponsibility)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Add
            </button>
          </div>

          {/* Responsibilities List */}
          {formData.responsibilities.length > 0 ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Responsibility</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.responsibilities.map((resp, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{resp}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeItem('responsibilities', index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-sm text-gray-500">No responsibilities added yet</p>
              <p className="text-xs text-gray-400 mt-1">Add responsibilities using the input above</p>
            </div>
          )}

          {errors.responsibilities && <p className="mt-1 text-sm text-red-500">{errors.responsibilities}</p>}
        </div>

        {/* Benefits - List Based */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Benefits & Perks (Optional)
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newBenefit}
              onChange={(e) => setNewBenefit(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addItem('benefits', newBenefit, setNewBenefit)}
              placeholder="e.g., Health insurance, Remote work, Flexible hours"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => addItem('benefits', newBenefit, setNewBenefit)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Add Benefit
            </button>
          </div>

          {/* Benefits List */}
          {formData.benefits.length > 0 ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Benefit</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.benefits.map((benefit, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{benefit}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeItem('benefits', index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-sm text-gray-500">No benefits added yet</p>
              <p className="text-xs text-gray-400 mt-1">Add benefits using the input above</p>
            </div>
          )}
        </div>

        {/* Education with Search */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Education Requirement <span className="text-red-500">*</span>
            </label>

            {/* Search Input with Selected Value Display */}
            <div className="relative" ref={dropdownRef}>
              {/* Selected Value Display */}
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={formData.education_requirement && !educationSearch ? getSelectedEducationLabel() : educationSearch}
                  onChange={handleEducationSearch}
                  onFocus={() => {
                    setShowEducationDropdown(true);
                    filterEducation(educationSearch);
                  }}
                  onKeyDown={handleEducationKeyDown}
                  placeholder="Search or select education requirement..."
                  className="w-full px-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" size={14} />
                </div>
                {formData.education_requirement && (
                  <button
                    type="button"
                    onClick={clearEducation}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-500"
                  >
                    <FaTimes size={14} />
                  </button>
                )}
              </div>

              {/* Dropdown List */}
              {showEducationDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {/* Category Filter Pills */}
                  <div className="sticky top-0 bg-gray-50 px-3 py-2 border-b border-gray-200">
                    <div className="flex flex-wrap gap-1">
                      {['None', 'Primary', 'Secondary', 'Higher Secondary', 'Diploma', "Bachelor's", 'Professional', "Master's", 'PGD', 'Doctoral', 'Vocational'].map(category => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => {
                            setEducationSearch(category);
                            filterEducation(category);
                          }}
                          className="text-xs px-2 py-1 rounded-full bg-gray-200 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {filteredEducation.length} {filteredEducation.length === 1 ? 'option' : 'options'}
                      {!educationSearch.trim() && ' (showing first 15, type to search more)'}
                    </p>
                  </div>

                  {filteredEducation.length > 0 ? (
                    filteredEducation.map((edu, index) => (
                      <div
                        key={edu.value}
                        onClick={() => handleEducationSelect(edu.value)}
                        className={`px-4 py-2.5 cursor-pointer flex items-center justify-between hover:bg-blue-50 transition-colors ${index === selectedEducationIndex ? 'bg-blue-100 border-l-4 border-blue-600' : ''
                          } ${formData.education_requirement === edu.value ? 'bg-green-50' : ''
                          }`}
                      >
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{edu.label}</p>
                          <p className="text-xs text-gray-500">{edu.category}</p>
                        </div>
                        {formData.education_requirement === edu.value && (
                          <span className="text-green-600 text-xs font-medium bg-green-100 px-2 py-1 rounded-full">
                            Selected
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-gray-500">No education requirements found</p>
                      <p className="text-xs text-gray-400 mt-1">Try different search terms</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Hidden select for form validation compatibility */}
            <select
              name="education_requirement"
              value={formData.education_requirement}
              onChange={handleChange}
              className="hidden"
            >
              <option value="">Select education requirement</option>
              {educationRequirements.map((edu, index) => (
                <option key={index} value={edu.value}>{edu.label}</option>
              ))}
            </select>

            {errors.education_requirement && (
              <p className="mt-1 text-sm text-red-500">{errors.education_requirement}</p>
            )}

            {/* Selected Education Display */}
            {formData.education_requirement && (
              <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-gray-600 mb-1">Selected Education:</p>
                <p className="text-sm font-medium text-gray-900">{getSelectedEducationLabel()}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Category: {educationRequirements.find(edu => edu.value === formData.education_requirement)?.category || 'N/A'}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Education Details (Optional)
            </label>
            <input
              type="text"
              name="education_details"
              value={formData.education_details}
              onChange={handleChange}
              placeholder="e.g., CGPA 3.0 or equivalent, Any recognized university"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Additional details like minimum GPA, university requirements, etc.
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 rounded-lg p-4 flex items-start gap-3">
          <FaInfoCircle className="text-blue-500 mt-0.5" size={18} />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Tips for Requirements & Responsibilities:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Be specific about required qualifications and experience</li>
              <li>List must-have vs nice-to-have skills</li>
              <li>Clearly define day-to-day responsibilities</li>
              <li>Include information about team structure and reporting lines</li>
              <li>Highlight growth opportunities and learning paths</li>
            </ul>
          </div>
        </div>
      </div>
    </StepWrapper>
  );
};