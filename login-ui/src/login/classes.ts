import { nativeInputClass, nativeRadioClass } from '@authpoint/ui';
import type { ClassKey } from 'keycloakify/login';

/* Las clases de los campos de perfil que pinta Keycloakify cuando el realm declara un tipo que no es de texto
   (components/ProfileFields): las de @authpoint/ui, como los componentes de components/ui.tsx. */
const field = `${nativeInputClass} h-(--size-control-l)`;

export const classes = {
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
  kcInputClassCheckboxInput: 'size-(--size-checkbox) accent-accent',
  kcInputClassRadioInput: nativeRadioClass,
  kcInputClassCheckboxLabel: 'ml-2.5 text-200',
  kcInputClassRadioLabel: 'ml-2.5 text-200',
  kcContentWrapperClass: 'flex flex-col gap-5',
} satisfies Partial<Record<ClassKey, string>>;
