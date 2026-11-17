package space.fretchcop.identity;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import jakarta.ws.rs.core.Response;

import org.jboss.logging.Logger;
import org.keycloak.common.util.Time;
import org.keycloak.email.EmailException;
import org.keycloak.email.EmailTemplateProvider;
import org.keycloak.events.Details;
import org.keycloak.events.EventBuilder;
import org.keycloak.events.EventType;
import org.keycloak.forms.login.LoginFormsProvider;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.UserModel.RequiredAction;
import org.keycloak.sessions.AuthenticationSessionModel;

/**
 * Los códigos de un solo uso por correo, como los de Adobe: seis cifras que valen 10 minutos y 5 intentos, y no se
 * reenvían más de uno cada 30 segundos por cuenta (en todas sus sesiones, para que no se pueda llenar un buzón). Se
 * guarda sólo su hash en la sesión de acceso, atado a esa sesión y a su uso (entrar, segundo paso, activarlos): un
 * código pedido para una cosa no vale para otra. Lo usan EmailCodeLoginForm, EmailCodeSecondFactor y ConfigureEmailCode;
 * la página es fc-email-code.ftl (login-ui/src/login/pages/EmailCode.tsx) y el correo themes/fretchcop/email.
 */
final class EmailCode {

    static final int MINUTES = 10;
    static final int MAX_TRIES = 5;
    static final int COOLDOWN_SECONDS = 30;
    static final String PAGE = "fc-email-code.ftl";
    static final String FIELD = "code";
    /** Nota de la sesión de acceso: se entró con un código por correo, que entonces no vale como segundo paso. */
    static final String FIRST_FACTOR_NOTE = "fc-email-code-first-factor";

    /** Para qué es el código: cambia el correo, la página y cómo se guarda. */
    enum Mode {
        LOGIN, SECOND, SETUP;

        String key() {
            return name().toLowerCase(Locale.ROOT);
        }

        /** «Login», «Second», «Setup»: el trozo de las claves de los mensajes del correo. */
        String messageKey() {
            return name().charAt(0) + name().substring(1).toLowerCase(Locale.ROOT);
        }
    }

    enum Sent { SENT, WAIT, FAILED }

    enum Check { OK, WRONG, TOO_MANY, EXPIRED }

    private static final Logger LOG = Logger.getLogger(EmailCode.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private EmailCode() {
    }

    private static String note(Mode mode, String what) {
        return "fc-email-code." + mode.key() + "." + what;
    }

    private static long longNote(AuthenticationSessionModel auth, Mode mode, String what) {
        String value = auth.getAuthNote(note(mode, what));
        try {
            return value == null ? 0 : Long.parseLong(value);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    static String realmName(RealmModel realm) {
        String name = realm.getDisplayName();
        return name == null || name.isBlank() ? realm.getName() : name;
    }

    /** Hay un código vigente para este uso en esta sesión. */
    static boolean active(AuthenticationSessionModel auth, Mode mode) {
        return auth.getAuthNote(note(mode, "hash")) != null && Time.currentTimeSeconds() < longNote(auth, mode, "exp");
    }

    /** Segundos que faltan para poder pedir otro, en esta sesión. */
    static int resendIn(AuthenticationSessionModel auth, Mode mode) {
        long sent = longNote(auth, mode, "sent");
        return (int) Math.max(0, sent + COOLDOWN_SECONDS - Time.currentTimeSeconds());
    }

    /** Envía un código nuevo (el anterior deja de valer), salvo que la cuenta haya pedido otro hace menos de 30 s. */
    static Sent send(KeycloakSession session, RealmModel realm, UserModel user, AuthenticationSessionModel auth, Mode mode) {
        String cooldownKey = "fc-email-code-cooldown:" + user.getId();
        if (!session.singleUseObjects().putIfAbsent(cooldownKey, COOLDOWN_SECONDS)) return Sent.WAIT;

        String code = String.format(Locale.ROOT, "%06d", RANDOM.nextInt(1_000_000));
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("code", code);
        attributes.put("minutes", MINUTES);
        attributes.put("modeKey", mode.messageKey());
        attributes.put("realmName", realmName(realm));
        try {
            session.getProvider(EmailTemplateProvider.class).setRealm(realm).setUser(user).setAuthenticationSession(auth)
                    .send("fcEmailCode" + mode.messageKey() + "Subject", List.of(realmName(realm)), "fc-email-code.ftl", attributes);
        } catch (EmailException e) {
            LOG.warnf(e, "No se pudo enviar el código por correo a la cuenta %s", user.getId());
            session.singleUseObjects().remove(cooldownKey);
            return Sent.FAILED;
        }
        long now = Time.currentTimeSeconds();
        auth.setAuthNote(note(mode, "hash"), hash(auth, mode, code));
        auth.setAuthNote(note(mode, "exp"), String.valueOf(now + MINUTES * 60L));
        auth.setAuthNote(note(mode, "tries"), "0");
        auth.setAuthNote(note(mode, "sent"), String.valueOf(now));
        return Sent.SENT;
    }

    /** Comprueba lo escrito (sólo sus cifras). Bien, gasta el código; mal, suma un intento, y al quinto lo anula. */
    static Check check(AuthenticationSessionModel auth, Mode mode, String input) {
        String expected = auth.getAuthNote(note(mode, "hash"));
        if (expected == null || Time.currentTimeSeconds() >= longNote(auth, mode, "exp")) {
            clear(auth, mode);
            return Check.EXPIRED;
        }
        String digits = input == null ? "" : input.replaceAll("\\D", "");
        byte[] given = hash(auth, mode, digits).getBytes(StandardCharsets.US_ASCII);
        if (MessageDigest.isEqual(given, expected.getBytes(StandardCharsets.US_ASCII))) {
            clear(auth, mode);
            return Check.OK;
        }
        long tries = longNote(auth, mode, "tries") + 1;
        if (tries >= MAX_TRIES) {
            clear(auth, mode);
            return Check.TOO_MANY;
        }
        auth.setAuthNote(note(mode, "tries"), String.valueOf(tries));
        return Check.WRONG;
    }

    /** Anula el código (se queda la hora del último envío: la espera para pedir otro sigue contando). */
    static void clear(AuthenticationSessionModel auth, Mode mode) {
        auth.removeAuthNote(note(mode, "hash"));
        auth.removeAuthNote(note(mode, "exp"));
        auth.removeAuthNote(note(mode, "tries"));
    }

    private static String hash(AuthenticationSessionModel auth, Mode mode, String code) {
        try {
            String bound = auth.getParentSession().getId() + ':' + auth.getTabId() + ':' + mode.key() + ':' + code;
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bound.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    /** La página del código: para qué es, a qué correo fue, cuánto vale y cuánto falta para pedir otro. */
    static Response page(LoginFormsProvider form, UserModel user, AuthenticationSessionModel auth, Mode mode) {
        Map<String, Object> data = new HashMap<>();
        data.put("mode", mode.key());
        data.put("email", user.getEmail());
        data.put("minutes", MINUTES);
        data.put("resendIn", resendIn(auth, mode));
        data.put("active", active(auth, mode));
        return form.setAttribute("fcEmailCode", data).createForm(PAGE);
    }

    /** Recibir el código en el correo demuestra que es de quien entra: queda verificado, como con su enlace. */
    static void markEmailVerified(UserModel user, AuthenticationSessionModel auth, EventBuilder event) {
        if (user.isEmailVerified()) return;
        user.setEmailVerified(true);
        user.removeRequiredAction(RequiredAction.VERIFY_EMAIL);
        auth.removeRequiredAction(RequiredAction.VERIFY_EMAIL);
        event.clone().event(EventType.VERIFY_EMAIL).user(user).detail(Details.EMAIL, user.getEmail()).success();
    }
}
