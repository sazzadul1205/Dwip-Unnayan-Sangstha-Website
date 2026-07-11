/* eslint-disable no-alert */
// resources/js/pages/Backend/CMS/Section/utils/toastHelper.js

import Swal from 'sweetalert2';

/**
 * Toast Helper - Simple reliable toast
 */
export const showToast = (icon, title, text = '', timer = 3000) => {
  try {
    const toast = Swal.mixin({
      toast: true,
      position: 'top-right',
      icon,
      title,
      text: text || '',
      showConfirmButton: false,
      timer,
      timerProgressBar: true,
      customClass: {
        popup: 'rounded-xl shadow-2xl',
        title: 'text-sm font-semibold',
        htmlContainer: 'text-xs',
      },
    });

    const toastInstance = toast.fire();

    setTimeout(() => {
      try {
        const popup = document.querySelector('.swal2-popup');
        if (popup) {
          popup.style.cursor = 'pointer';
          popup.addEventListener('click', () => {
            Swal.close();
          });
        }
      } catch (err) {
        console.warn('Failed to add click-to-close to toast:', err);
      }
    }, 100);

    return toastInstance;
  } catch (err) {
    console.error('Failed to show toast:', err);
    
    return null;
  }
};

export const showSuccessToast = (title, text = '', timer = 3000) => {
  return showToast('success', title, text, timer);
};

export const showErrorToast = (title, text = '', timer = 4000) => {
  return showToast('error', title, text, timer);
};

export const showWarningToast = (title, text = '', timer = 3000) => {
  return showToast('warning', title, text, timer);
};

export const showInfoToast = (title, text = '', timer = 3000) => {
  return showToast('info', title, text, timer);
};

export const showConfirmDialog = (options = {}) => {
  try {
    const defaultOptions = {
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, proceed',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-xl shadow-2xl',
        title: 'text-lg font-semibold',
        htmlContainer: 'text-sm',
        confirmButton: 'px-5 py-2.5 rounded-xl font-medium transition hover:scale-[1.02]',
        cancelButton: 'px-5 py-2.5 rounded-xl font-medium transition hover:bg-gray-100',
      },
      showLoaderOnConfirm: true,
    };

    return Swal.fire({
      ...defaultOptions,
      ...options,
    });
  } catch (err) {
    console.error('Failed to show confirm dialog:', err);
    // Fallback to native confirm
    if (window.confirm(options?.text || 'Are you sure?')) {
      return Promise.resolve({ isConfirmed: true });
    }
    return Promise.resolve({ isConfirmed: false });
  }
};