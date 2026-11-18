import { IconChevronRight } from '../components/icons';
import { ROW_BUTTON } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/** Con qué empresa entras, si la cuenta está en varias: una fila por empresa, por nombre, que se toca entera. */
export default function SelectOrganization({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'select-organization.ftl' }>; i18n: I18n }) {
  const { url, user } = kcContext;
  const { msg, msgStr, currentLanguage } = i18n;
  const byName = new Intl.Collator(currentLanguage.languageTag, { sensitivity: 'base' });
  const organizations = (user.organizations ?? []).map((o) => ({ alias: o.alias, name: o.name ?? o.alias })).sort((a, b) => byName.compare(a.name, b.name));
  return (
    <Template kcContext={kcContext} i18n={i18n} doUseDefaultCss={false} headerNode={msg('organization.select')} documentTitle={msgStr('organization.select')}>
      <form action={url.loginAction} method="post" className="flex flex-col gap-2">
        {organizations.map(({ alias, name }) => (
          <button key={alias} id={`organization-${alias}`} type="submit" name="kc.org" value={alias} className={ROW_BUTTON}>
            <span className="min-w-0 flex-1 text-200 font-medium break-words text-fg">{name}</span>
            <IconChevronRight size={20} className="shrink-0 text-fg-muted" />
          </button>
        ))}
      </form>
    </Template>
  );
}
