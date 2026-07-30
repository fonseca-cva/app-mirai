import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacidad — Mirai",
  description:
    "Política de privacidad de Mirai: qué datos recopilamos durante el test vocacional, cómo los usamos y cómo ejercer tus derechos.",
  openGraph: {
    title: "Privacidad — Mirai",
    description:
      "Política de privacidad de Mirai: qué datos recopilamos durante el test vocacional, cómo los usamos y cómo ejercer tus derechos.",
    locale: "es_CL",
    type: "website",
  },
};

// Página de privacidad v1 — sección 2 de la spec Fase 2.
// // PENDIENTE REVISIÓN LEGAL: este texto debe ser revisado por un/a abogado/a
// antes de producción. No constituye asesoría legal.

export default function PrivacidadPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:px-8">
      <h1 className="font-display text-3xl font-semibold">Privacidad</h1>
      <p className="mt-2 text-sm text-tinta/50">Última actualización: julio 2026</p>

      <section className="mt-8 space-y-6 text-base leading-relaxed text-tinta/80">
        <p>
          En Mirai respetamos tu privacidad. Esta página explica qué información
          recopilamos durante la experiencia vocacional, por qué lo hacemos, y
          cómo puedes ejercer tus derechos sobre tus datos.
        </p>

        <h2 className="font-display text-xl font-semibold text-tinta">
          ¿Qué información recopilamos?
        </h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Datos de sesión:</strong> al iniciar la experiencia, se genera
            un identificador único (<em>session_id</em>) que se guarda en una
            cookie técnica de primera parte. Este identificador no está asociado
            a tu identidad real.
          </li>
          <li>
            <strong>Respuestas del bloque de intereses:</strong> tus reacciones
            a 24 contextos laborales (gustos y preferencias).
          </li>
          <li>
            <strong>Respuestas de los mini-juegos cognitivos:</strong> tus
            resultados en los ejercicios de patrones, rotación espacial y memoria.
          </li>
          <li>
            <strong>Respuestas del bloque verbal:</strong> tus explicaciones y
            argumentaciones escritas, junto con una evaluación automatizada de
            su estructura (no del contenido de tu opinión).
          </li>
          <li>
            <strong>Edad y curso:</strong> información demográfica opcional que
            nos ayuda a mejorar la herramienta. Puedes elegir &quot;prefiero no
            decir&quot;.
          </li>
          <li>
            <strong>Correo electrónico:</strong> solo si decides recibir tu
            informe por correo. No lo usamos para ningún otro fin.
          </li>
        </ul>

        <h2 className="font-display text-xl font-semibold text-tinta">
          ¿Para qué usamos tus datos?
        </h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Generar tu perfil vocacional personalizado.</li>
          <li>Mejorar la herramienta con datos agregados anónimos.</li>
          <li>Enviarte tu informe si lo solicitaste (solo para ese fin).</li>
        </ul>
        <p>
          <strong>No vendemos tus datos.</strong> No los compartimos con terceros
          para publicidad, marketing ni ningún fin comercial. No enviamos
          newsletters ni correos no solicitados.
        </p>

        <h2 className="font-display text-xl font-semibold text-tinta">
          Cookies
        </h2>
        <p>
          Usamos una única cookie técnica (<em>mirai_session_id</em>) para
          identificar tu sesión y permitir que pausar y retomar la experiencia
          funcione. Esta cookie expira a los 7 días. No usamos cookies de
          seguimiento, análisis ni publicidad.
        </p>

        <h2 className="font-display text-xl font-semibold text-tinta">
          ¿Por cuánto tiempo guardamos tus datos?
        </h2>
        <p>
          Los datos asociados a tu <em>session_id</em> se conservan mientras la
          cookie esté vigente (7 días desde tu última visita) más un período
          adicional de 90 días para fines de mejora agregada. Pasado ese plazo,
          los registros se eliminan de nuestra base de datos.
        </p>
        <p>
          Si ingresaste tu correo para recibir el informe, lo conservamos solo
          para ese envío y lo eliminamos dentro de los 30 días posteriores.
        </p>

        <h2 className="font-display text-xl font-semibold text-tinta">
          Seguridad
        </h2>
        <p>
          Los datos se almacenan en Supabase, un servicio de base de datos con
          cifrado en tránsito y en reposo. Cada sesión solo puede acceder a sus
          propios datos mediante políticas de seguridad a nivel de fila (RLS).
          No almacenamos contraseñas, RUT, direcciones ni información
          financiera.
        </p>

        <h2 className="font-display text-xl font-semibold text-tinta">
          Tus derechos
        </h2>
        <p>
          Puedes solicitar la eliminación de tus datos en cualquier momento
          escribiéndonos a <a href="mailto:privacidad@miraiapp.cl" className="text-coral underline">privacidad@miraiapp.cl</a>.
          Indica tu <em>session_id</em> (lo encuentras en las cookies de tu
          navegador) y eliminaremos todos los registros asociados en un plazo
          máximo de 15 días hábiles.
        </p>
        <p>
          También puedes simplemente dejar de usar la herramienta: tu cookie
          expirará en 7 días y los datos asociados se eliminarán dentro de los
          90 días siguientes.
        </p>

        <h2 className="font-display text-xl font-semibold text-tinta">
          Cambios a esta política
        </h2>
        <p>
          Si hacemos cambios significativos, actualizaremos la fecha al inicio
          de esta página. Te recomendamos revisarla periódicamente.
        </p>

        <h2 className="font-display text-xl font-semibold text-tinta">
          Contacto
        </h2>
        <p>
          Si tienes preguntas sobre tus datos o esta política, escríbenos a{" "}
          <a href="mailto:privacidad@miraiapp.cl" className="text-coral underline">privacidad@miraiapp.cl</a>.
        </p>
      </section>

      <p className="mt-8 text-xs text-tinta/40">
        // PENDIENTE REVISIÓN LEGAL — Este texto ha sido redactado por el
        equipo de Mirai y debe ser revisado por un/a abogado/a antes de su uso
        en producción.
      </p>
    </main>
  );
}
