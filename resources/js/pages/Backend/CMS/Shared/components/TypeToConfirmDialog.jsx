import Swal from 'sweetalert2';

const confirmDialogWithType = ({
  title,
  text,
  inputLabel,
  inputPlaceholder,
  expectedValue,
  confirmButtonColor = '#d33',
  icon = 'warning',
  confirmButtonText = 'Yes, proceed',
  onConfirm,
}) => {
  return Swal.fire({
    title,
    text,
    icon,
    input: 'text',
    inputLabel,
    inputPlaceholder,
    inputAttributes: {
      autocapitalize: 'none',
      autocorrect: 'off',
      spellcheck: 'false',
    },
    showCancelButton: true,
    confirmButtonColor,
    cancelButtonColor: '#6b7280',
    confirmButtonText,
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    showLoaderOnConfirm: true,
    preConfirm: (typedValue) => {
      if (!typedValue || typedValue.trim() !== expectedValue) {
        Swal.fire({
          icon: 'error',
          title: 'Incorrect',
          text: `Please type "${expectedValue}" exactly to confirm.`,
          confirmButtonColor: '#3b82f6',
        });
        return false;
      }
      return typedValue;
    },
    customClass: {
      popup: 'rounded-xl shadow-2xl',
      title: 'text-lg font-semibold',
      htmlContainer: 'text-sm',
      input: 'rounded-lg border-gray-300 focus:ring-2 focus:ring-red-500',
    },
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      if (onConfirm) onConfirm();
    }
  });
};

export const confirmDeleteWithType = (itemTitle, onDelete) =>
  confirmDialogWithType({
    title: '⚠️ Move to Trash?',
    text: `Type the item title below exactly to move "${itemTitle}" to trash.`,
    inputLabel: 'Type the title to confirm',
    inputPlaceholder: 'Type the title here',
    expectedValue: itemTitle,
    confirmButtonColor: '#d33',
    icon: 'warning',
    confirmButtonText: 'Yes, move to trash',
    onConfirm: onDelete,
  });

export const confirmForceDeleteWithType = (itemTitle, onForceDelete) =>
  confirmDialogWithType({
    title: '⚠️ Permanently Delete?',
    text: `This will permanently delete "${itemTitle}". Type the title exactly to confirm. This cannot be undone.`,
    inputLabel: 'Type the title to confirm',
    inputPlaceholder: `Type "${itemTitle}"`,
    expectedValue: itemTitle,
    confirmButtonColor: '#d33',
    icon: 'error',
    confirmButtonText: 'Yes, delete permanently',
    onConfirm: onForceDelete,
  });
