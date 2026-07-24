export const OFFICIAL_REFERENCES = {
  arrepentimiento:
    "https://www.argentina.gob.ar/normativa/nacional/disposici%C3%B3n-954-2025-417152/texto",
  datosPersonales:
    "https://www.argentina.gob.ar/aaip/datospersonales/derechos",
  defensaConsumidor:
    "https://www.argentina.gob.ar/produccion/defensadelconsumidor",
};
export const INFORMACION_PAGES = {
  "/preguntas-frecuentes": {
    eyebrow: "Ayuda para comprar",
    title: "Preguntas frecuentes",
    intro:
      "Respuestas breves sobre productos, carrito, pago y entrega. Si tu caso necesita atención personal, escribinos por WhatsApp.",
    kind: "faq",
    items: [
      {
        title: "¿Necesito crear una cuenta para comprar?",
        body:
          "No. Podés elegir productos, completar tus datos de entrega y pagar como invitado.",
      },
      {
        title: "¿Cómo sé si un producto tiene stock?",
        body:
          "La disponibilidad se muestra en el catálogo y vuelve a validarse al iniciar el pago. Tener un producto en el carrito no lo reserva.",
      },
      {
        title: "¿Cómo se realiza el pago?",
        body:
          "El pago online se procesa mediante Mercado Pago Checkout Pro. La tienda no recibe ni almacena los datos completos de tu tarjeta.",
      },
      {
        title: "¿Cómo conozco el costo y la forma de entrega?",
        body:
          "Las alternativas disponibles y su costo se informan durante el checkout, antes de que confirmes el pago. Si necesitás coordinar un caso particular, consultanos por WhatsApp.",
      },
      {
        title: "¿Dónde veo el estado de mi pago?",
        body:
          "Al volver de Mercado Pago verás una pantalla de estado. La confirmación definitiva depende de la acreditación informada por Mercado Pago, no solamente de la página de regreso.",
      },
      {
        title: "¿Los productos naturales reemplazan una consulta profesional?",
        body:
          "No. La información del catálogo es general y no reemplaza indicaciones médicas. Ante embarazo, lactancia, tratamientos, alergias o dudas sobre el uso, consultá a un profesional de la salud.",
      },
      {
        title: "¿Qué datos conviene tener al hacer una consulta?",
        body:
          "Si ya compraste, incluí tu nombre y número de pedido. Para una consulta de producto, indicá su nombre y qué información necesitás.",
      },
    ],
  },
  "/terminos-y-condiciones": {
    eyebrow: "Información de compra",
    title: "Términos y condiciones",
    intro:
      "Estas pautas explican el funcionamiento general de la tienda. La información concreta mostrada en el checkout antes de pagar forma parte de cada compra.",
    sections: [
      {
        title: "Catálogo y disponibilidad",
        paragraphs: [
          "Las descripciones e imágenes ayudan a identificar cada producto. El stock se confirma nuevamente al iniciar el pago.",
          "Si se detecta una indisponibilidad o un error material antes de completar la operación, te informaremos por el canal de contacto aportado para resolverlo.",
        ],
      },
      {
        title: "Precios y pago",
        paragraphs: [
          "El precio aplicable es el que se informa en el resumen final de compra. Los costos de entrega, cuando correspondan, deben aparecer antes de confirmar el pago.",
          "Los pagos online se procesan mediante Mercado Pago. La aprobación, el rechazo o la situación pendiente dependen de la información validada por esa plataforma.",
        ],
      },
      {
        title: "Datos de la compra",
        paragraphs: [
          "La persona compradora debe proporcionar datos suficientes y correctos para identificar el pedido, comunicarnos y realizar la entrega.",
          "Si advertís un error en los datos enviados, contactanos cuanto antes por WhatsApp e indicá el número de pedido.",
        ],
      },
      {
        title: "Productos e información de uso",
        paragraphs: [
          "La información sobre productos naturales es descriptiva y general. No constituye diagnóstico, tratamiento ni indicación médica.",
          "Antes de usar un producto, revisá su presentación, ingredientes y advertencias. Si tenés una condición de salud o utilizás medicación, consultá a un profesional.",
        ],
      },
      {
        title: "Derechos de las personas consumidoras",
        paragraphs: [
          "Nada de lo aquí informado limita los derechos reconocidos por la normativa argentina de defensa del consumidor.",
          "Para arrepentimiento, cambios o inconvenientes con una compra, están disponibles las secciones específicas de este sitio y la atención por WhatsApp.",
        ],
        links: [
          {
            label: "Información oficial de Defensa del Consumidor",
            href: OFFICIAL_REFERENCES.defensaConsumidor,
          },
        ],
      },
    ],
  },
  "/privacidad": {
    eyebrow: "Tus datos",
    title: "Política de privacidad",
    intro:
      "Usamos los datos necesarios para gestionar compras y consultas. Esta página describe de forma general qué información interviene y para qué se utiliza.",
    sections: [
      {
        title: "Datos que podés proporcionar",
        paragraphs: [
          "Al comprar o contactarnos podés proporcionar nombre, apellido, teléfono, correo electrónico, domicilio de entrega, aclaraciones y datos vinculados con el pedido.",
          "Mercado Pago procesa la información del medio de pago. La tienda recibe referencias y estados necesarios para identificar y administrar la operación, no los datos completos de tu tarjeta.",
        ],
      },
      {
        title: "Finalidades",
        bullets: [
          "Preparar, cobrar y entregar pedidos.",
          "Comunicarnos por cuestiones relacionadas con una compra o consulta.",
          "Atender solicitudes, cambios, devoluciones o arrepentimientos.",
          "Cumplir obligaciones legales, contables y de seguridad.",
        ],
      },
      {
        title: "Proveedores necesarios",
        paragraphs: [
          "La información puede ser tratada por servicios indispensables para operar la tienda, como procesamiento de pagos, alojamiento tecnológico y entrega, únicamente en la medida necesaria para cumplir esas funciones.",
        ],
      },
      {
        title: "Conservación y seguridad",
        paragraphs: [
          "Los datos se conservan durante el tiempo necesario para gestionar la compra, atender reclamos y cumplir obligaciones aplicables. Se adoptan medidas razonables para evitar accesos, usos o divulgaciones no autorizados.",
        ],
      },
      {
        title: "Tus derechos",
        paragraphs: [
          "Podés solicitar información, acceso, actualización, rectificación o supresión cuando corresponda. Para hacerlo, escribinos por WhatsApp, identificá la compra relacionada y explicá tu solicitud. Puede ser necesario verificar tu identidad para proteger tus datos.",
          "La Agencia de Acceso a la Información Pública es el organismo de control de la Ley 25.326 y recibe consultas o reclamos sobre protección de datos personales.",
        ],
        links: [
          {
            label: "Conocé tus derechos ante la AAIP",
            href: OFFICIAL_REFERENCES.datosPersonales,
          },
        ],
      },
    ],
  },
  "/cambios-y-devoluciones": {
    eyebrow: "Después de comprar",
    title: "Cambios y devoluciones",
    intro:
      "Si recibiste un producto incorrecto, dañado o con un inconveniente, escribinos para revisar el caso y darte una respuesta acorde con la normativa aplicable.",
    sections: [
      {
        title: "Cómo informar un problema",
        bullets: [
          "Indicá tu nombre y número de pedido.",
          "Contanos qué producto presenta el inconveniente.",
          "Describí de manera breve lo ocurrido.",
          "Adjuntá imágenes si ayudan a verificar el estado del paquete o producto.",
        ],
      },
      {
        title: "Conservá la información de la compra",
        paragraphs: [
          "Mientras revisamos el caso, conservá el producto, su envase y cualquier comprobante relacionado. No descartes el embalaje si el problema ocurrió durante la entrega.",
        ],
      },
      {
        title: "Evaluación y solución",
        paragraphs: [
          "La solución depende del tipo de inconveniente, el estado del producto y los derechos aplicables. Te informaremos por WhatsApp los pasos concretos antes de que realices un envío o traslado.",
          "No envíes productos por tu cuenta sin coordinación previa, porque necesitamos confirmar el canal y los datos de recepción.",
        ],
      },
      {
        title: "Arrepentimiento de una compra online",
        paragraphs: [
          "Si querés revocar una compra realizada a distancia, utilizá la sección Botón de arrepentimiento. Allí podés iniciar la solicitud sin crear una cuenta ni realizar un trámite adicional.",
        ],
      },
    ],
  },
  "/envios": {
    eyebrow: "Entrega de pedidos",
    title: "Información de envíos",
    intro:
      "La forma de entrega, el destino y el costo aplicable deben quedar claros antes del pago. No publicamos plazos generales que puedan variar según el pedido o la localidad.",
    sections: [
      {
        title: "Antes de pagar",
        paragraphs: [
          "Revisá la modalidad seleccionada, el domicilio, la localidad, la provincia y el código postal. El costo que corresponde debe figurar en el resumen final del checkout.",
        ],
      },
      {
        title: "Preparación y coordinación",
        paragraphs: [
          "Una vez acreditado el pago, el pedido pasa a preparación. Si la entrega requiere coordinación o falta un dato, utilizaremos el teléfono o correo informado durante la compra.",
          "Cuando exista información de seguimiento o una indicación concreta para recibir el pedido, se comunicará por los canales disponibles.",
        ],
      },
      {
        title: "Demoras o incidencias",
        paragraphs: [
          "Si el pedido presenta una demora o un problema de entrega, escribinos por WhatsApp con tu número de pedido. Revisaremos la información disponible y te indicaremos los pasos siguientes.",
        ],
      },
      {
        title: "Al recibir",
        paragraphs: [
          "Verificá que el paquete corresponda a tu compra. Si observás daño, faltantes o un producto incorrecto, conservá el embalaje y contactanos con imágenes que permitan revisar el caso.",
        ],
      },
    ],
  },
  "/arrepentimiento": {
    eyebrow: "Compra a distancia",
    title: "Botón de arrepentimiento",
    intro:
      "Podés solicitar la revocación de una compra realizada online sin iniciar sesión ni completar un trámite adicional.",
    kind: "withdrawal",
    sections: [
      {
        title: "Cómo iniciar la solicitud",
        paragraphs: [
          "El botón de esta página abre una conversación de WhatsApp con un mensaje preparado. La solicitud se considera enviada cuando presionás “Enviar” dentro de WhatsApp; abrir la conversación por sí solo no la envía.",
          "La atención de El Jardín de Luna se realiza por ese mismo canal. Recibirás allí un código de identificación de la solicitud dentro de las 24 horas de haber enviado el mensaje.",
        ],
      },
      {
        title: "Datos a incluir",
        bullets: [
          "Nombre y apellido de quien realizó la compra.",
          "Número de pedido o referencia de pago.",
          "Fecha aproximada de la compra.",
          "Producto o productos alcanzados por la solicitud.",
          "Un teléfono o medio de contacto si fuera distinto del utilizado.",
        ],
      },
      {
        title: "Plazo y alcance",
        paragraphs: [
          "La normativa argentina contempla un plazo de diez días corridos para ejercer el derecho en compras a distancia, computado según las reglas aplicables a la contratación y entrega.",
          "La regulación vigente también contempla excepciones, entre ellas ciertos supuestos legales y productos efectivamente utilizados o consumidos. La procedencia se revisará según el caso concreto y la normativa aplicable.",
        ],
      },
      {
        title: "Referencia oficial",
        paragraphs: [
          "Esta información es orientativa y no reemplaza el texto normativo. Podés consultar la Disposición 954/2025 en el sitio oficial de normativa argentina.",
        ],
        links: [
          {
            label: "Leer la Disposición 954/2025",
            href: OFFICIAL_REFERENCES.arrepentimiento,
          },
        ],
      },
    ],
  },
};
