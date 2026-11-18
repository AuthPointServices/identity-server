import { nativeButtonClass, nativeInputClass, nativeRadioClass } from '@authpoint/ui';
import type { ClassKey } from 'keycloakify/login';

/* Las clases que Keycloakify da a las pantallas sin página propia (las poco frecuentes) y a sus campos de perfil: las
   de @authpoint/ui, como los componentes de components/ui.tsx. Sólo las que esas páginas usan. */
const field = `${nativeInputClass} h-(--size-control-l)`;
const button = 'w-full no-underline!';

export const classes = {
  kcFormClass: 'flex flex-col gap-5',
  kcFormGroupClass: 'flex flex-col',
  kcLabelWrapperClass: 'mb-1',
  kcLabelClass: 'text-100 leading-tight font-medium text-fg-muted',
  kcInputWrapperClass: 'flex flex-col',
  kcInputClass: field,
  kcInputGroup: 'relative flex items-center [&>input]:pr-(--size-control-l)',
  kcFormPasswordVisibilityButtonClass: 'absolute right-0 grid h-(--size-control-l) w-(--size-control-l) place-items-center text-fg-muted hover:text-fg-strong',
  kcInputErrorMessageClass: 'mt-1 block text-75 leading-tight text-negative-900',
  kcInputHelperTextBeforeClass: 'mb-1 text-75 leading-tight text-fg-muted',
  kcInputHelperTextAfterClass: 'mt-1 text-75 leading-tight text-fg-muted',
  kcFormOptionsClass: 'flex flex-col gap-3',
  kcFormOptionsWrapperClass: 'text-100',
  kcFormButtonsClass: 'mt-3 flex flex-col gap-2',
  kcFormButtonsWrapperClass: 'flex flex-col gap-2',
  kcButtonClass: '',
  kcButtonPrimaryClass: `${nativeButtonClass({ variant: 'accent', size: 'l' })} ${button}`,
  kcButtonDefaultClass: `${nativeButtonClass({ variant: 'secondary', size: 'l' })} ${button}`,
  kcButtonBlockClass: '',
  kcButtonLargeClass: '',
  kcInputClassCheckboxInput: 'size-(--size-checkbox) accent-accent',
  kcInputClassRadioInput: nativeRadioClass,
  kcInputClassCheckboxLabel: 'ml-2.5 text-200',
  kcInputClassRadioLabel: 'ml-2.5 text-200',
  kcContentWrapperClass: 'flex flex-col gap-5',
} satisfies Partial<Record<ClassKey, string>>;
