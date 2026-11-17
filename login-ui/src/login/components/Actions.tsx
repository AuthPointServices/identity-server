import type { ReactNode } from 'react';
import { BUTTON_PRIMARY, BUTTON_TEXT } from './ui';

/**
 * El pie de un formulario: el botón principal y, si la acción la pidió la app, «Cancelar» como botón de texto debajo.
 * Va a 32 px del último campo (entre campos hay 20), como en Adobe: se lee como el final del formulario, no como otro
 * campo. Los botones sueltos de las páginas llevan el mismo mt-3.
 * Cancelar no valida el formulario: Keycloak lo lee por su nombre (cancel-aia).
 */
export function Actions({ submit, cancel, submitClassName = BUTTON_PRIMARY, submitProps }: {
  submit: ReactNode;
  cancel?: ReactNode | false;
  submitClassName?: string;
  submitProps?: { id?: string; name?: string; value?: string };
}) {
  return (
    <div className="mt-3 flex flex-col gap-2">
      <button type="submit" className={submitClassName} {...submitProps}>{submit}</button>
      {cancel && (
        <button type="submit" name="cancel-aia" value="true" formNoValidate className={BUTTON_TEXT}>{cancel}</button>
      )}
    </div>
  );
}
