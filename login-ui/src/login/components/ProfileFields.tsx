import type { KcClsx } from 'keycloakify/login/lib/kcClsx';
import { getKcClsx } from 'keycloakify/login/lib/kcClsx';
import type { ReactNode } from 'react';
import { useUserProfileForm } from 'keycloakify/login/lib/useUserProfileForm';
import UserProfileFormFields from 'keycloakify/login/UserProfileFormFields';
import { classes } from '../classes';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import { Field } from './ui';

type ProfileContext = Extract<KcContext, { pageId: 'register.ftl' | 'update-email.ftl' | 'login-update-profile.ftl' | 'idp-review-user-profile.ftl' }>;

// Los tipos que pintamos con nuestro campo; los demás (listas, casillas, varios valores) los pinta Keycloakify.
const TEXT_TYPES: Record<string, string> = {
  text: 'text',
  'html5-email': 'email',
  'html5-tel': 'tel',
  'html5-url': 'url',
  'html5-number': 'number',
  'html5-date': 'date',
  'html5-datetime-local': 'datetime-local',
  'html5-month': 'month',
  'html5-week': 'week',
  'html5-time': 'time',
};

/**
 * Los campos del perfil que pide Keycloak (correo, nombre, apellidos y, al registrarse, la contraseña), con la lógica
 * de Keycloakify: validación al salir del campo y errores del servidor. Si el realm declara algún tipo que no es de
 * texto, el formulario entero lo pinta Keycloakify con las clases del tema, para no romper nada. `hints` pone una ayuda
 * propia bajo un campo, en lugar de la del realm.
 */
export function ProfileFields({ kcContext, i18n, hints = {} }: { kcContext: ProfileContext; i18n: I18n; hints?: Partial<Record<string, ReactNode>> }) {
  const { advancedMsg, advancedMsgStr, msgStr } = i18n;
  const { formState, dispatchFormAction } = useUserProfileForm({ kcContext, i18n, doMakeUserConfirmPassword: true });
  const states = formState.formFieldStates.filter(({ attribute }) => attribute.annotations.inputType !== 'hidden');
  const ours = (name: string, type: string | undefined, multivalued: boolean | undefined) =>
    !multivalued && (name === 'password' || name === 'password-confirm' || type === undefined || type in TEXT_TYPES);

  if (!states.every(({ attribute: a }) => ours(a.name, a.annotations.inputType, a.multivalued))) {
    const { kcClsx } = getKcClsx({ doUseDefaultCss: false, classes });
    return <UserProfileFormFields kcContext={kcContext} i18n={i18n} kcClsx={kcClsx as KcClsx} onIsFormSubmittableValueChange={() => undefined} doMakeUserConfirmPassword />;
  }

  return (
    <>
      {states.map(({ attribute: a, displayableErrors, valueOrValues }) => {
        const isPassword = a.name === 'password' || a.name === 'password-confirm';
        const before = a.annotations.inputHelperTextBefore;
        const after = a.annotations.inputHelperTextAfter;
        return (
          <Field
            key={a.name}
            id={a.name}
            label={advancedMsg(a.displayName ?? a.name)}
            type={isPassword ? 'password' : TEXT_TYPES[a.annotations.inputType ?? 'text']}
            value={typeof valueOrValues === 'string' ? valueOrValues : (valueOrValues[0] ?? '')}
            onChange={(e) => dispatchFormAction({ action: 'update', name: a.name, valueOrValues: e.target.value })}
            onBlur={() => dispatchFormAction({ action: 'focus lost', name: a.name, fieldIndex: undefined })}
            autoComplete={isPassword ? 'new-password' : a.autocomplete}
            readOnly={a.readOnly}
            placeholder={a.annotations.inputTypePlaceholder ? advancedMsgStr(a.annotations.inputTypePlaceholder) : undefined}
            error={displayableErrors[0]?.errorMessageStr}
            hint={hints[a.name] ?? (after ?? before ? advancedMsg((after ?? before) as string) : undefined)}
            reveal={isPassword ? { show: msgStr('showPassword'), hide: msgStr('hidePassword') } : undefined}
            spellCheck={a.name === 'email' ? false : undefined}
          />
        );
      })}
    </>
  );
}
