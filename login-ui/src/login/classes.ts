import type { ClassKey } from 'keycloakify/login';

/* Las clases que Keycloakify da a las pantallas que no tienen página propia (las poco frecuentes): así también se ven
   como las demás. Mismas medidas que los componentes de components/ui.tsx. */
const field =
  'h-11 w-full rounded-[10px] border border-input bg-surface px-3 text-base/6 text-fg hover:border-fg focus-visible:border-accent focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-accent)_22%,transparent)] aria-invalid:border-danger';

export const classes = {
  kcFormClass: 'flex flex-col gap-5',
  kcFormGroupClass: 'flex flex-col',
  kcLabelWrapperClass: 'mb-1.5',
  kcLabelClass: 'text-sm/5 font-medium text-fg',
  kcInputWrapperClass: 'flex flex-col',
  kcInputClass: field,
  kcTextareaClass: `${field} h-auto min-h-24 py-2.5`,
  kcInputGroup: 'relative flex items-center [&>input]:pr-12',
  kcFormPasswordVisibilityButtonClass: 'absolute right-0 grid h-11 w-11 place-items-center text-fg-muted hover:text-fg',
  kcInputErrorMessageClass: 'mt-2 block text-sm/5 text-danger',
  kcInputHelperTextBeforeClass: 'mb-2 text-sm/5 text-fg-muted',
  kcInputHelperTextAfterClass: 'mt-2 text-sm/5 text-fg-muted',
  kcFormOptionsClass: 'flex flex-col gap-3',
  kcFormOptionsWrapperClass: 'text-sm/5',
  kcFormButtonsClass: 'mt-1 flex flex-col gap-3',
  kcFormButtonsWrapperClass: 'flex flex-col gap-3',
  kcButtonClass:
    'inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[10px] px-4 text-[15px]/5 font-semibold transition-colors duration-quick forced-colors:border forced-colors:border-[ButtonText]',
  kcButtonPrimaryClass: 'bg-accent text-accent-fg hover:bg-accent-hover',
  kcButtonDefaultClass: 'border border-border-strong bg-surface text-fg hover:bg-surface-2',
  kcButtonSecondaryClass: 'border border-border-strong bg-surface text-fg hover:bg-surface-2',
  kcButtonBlockClass: 'w-full',
  kcButtonLargeClass: '',
  kcCheckboxInputClass: 'size-[18px] rounded-[5px] accent-accent',
  kcInputClassCheckboxInput: 'size-[18px] rounded-[5px] accent-accent',
  kcInputClassRadioInput: 'size-[18px] accent-accent',
  kcInputClassCheckboxLabel: 'ml-2.5 text-sm/5',
  kcInputClassRadioLabel: 'ml-2.5 text-sm/5',
  kcContentWrapperClass: 'flex flex-col gap-5',
  kcSelectAuthListClass: 'flex flex-col gap-2',
  kcSelectAuthListItemClass:
    'flex w-full items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3 text-left hover:bg-surface-2',
  kcSelectAuthListItemIconClass: 'text-fg-muted',
  kcSelectAuthListItemBodyClass: 'min-w-0 flex-1',
  kcSelectAuthListItemHeadingClass: 'text-[15px]/[22px] font-medium text-fg',
  kcSelectAuthListItemDescriptionClass: 'text-sm/5 text-fg-muted',
  kcSelectAuthListItemFillClass: 'flex-1',
  kcRecoveryCodesList: 'grid grid-cols-2 gap-2 rounded-xl bg-container p-4 font-medium tabular-nums',
  kcRecoveryCodesWarning: 'rounded-xl border border-warn/30 bg-warn-subtle px-4 py-3 text-sm/5 text-warn',
  kcRecoveryCodesActions: 'flex gap-2',
} satisfies Partial<Record<ClassKey, string>>;
