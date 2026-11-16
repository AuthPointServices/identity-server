import type { ReactNode } from 'react';
import { BUTTON_PRIMARY, BUTTON_TEXT } from './ui';

/**
 * El pie de un formulario: el botón principal y, si la acción la pidió la app, «Cancelar» como botón de texto debajo.
 * Cancelar no valida el formulario: Keycloak lo lee por su nombre (cancel-aia).
 */
export function Actions({ submit, cancel, submitClassName = BUTTON_PRIMARY, submitProps }: {
  submit: ReactNode;
  cancel?: ReactNode | false;
  submitClassName?: string;
  submitProps?: { id?: string; name?: string; value?: string };
}) {
  return (
    <div className="mt-1 flex flex-col gap-2">
      <button type="submit" className={submitClassName} {...submitProps}>{submit}</button>
      {cancel && (
        <button type="submit" name="cancel-aia" value="true" formNoValidate className={BUTTON_TEXT}>{cancel}</button>
      )}
    </div>
  );
}
