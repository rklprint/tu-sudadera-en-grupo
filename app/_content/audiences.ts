export type AudienceBenefit = {
  title: string;
  text: string;
};

export type AudienceIdea = {
  title: string;
  text: string;
};

export type AudienceFaq = {
  question: string;
  answer: string;
};

export type AudiencePageData = {
  slug: string;
  label: string;
  shortLabel: string;
  title: string;
  titleAccent: string;
  metaDescription: string;
  eyebrow: string;
  lead: string;
  groupType: string;
  quoteDesign: string;
  hoodieTop: string;
  hoodieMain: string;
  accent: string;
  garment: string;
  print: string;
  introTitle: string;
  intro: string[];
  benefits: AudienceBenefit[];
  ideasTitle: string;
  ideasIntro: string;
  ideas: AudienceIdea[];
  faq: AudienceFaq[];
};

export const audiencePages: Record<string, AudiencePageData> = {
  schools: {
    slug: "sudaderas-colegios-institutos",
    label: "Sudaderas para colegios e institutos",
    shortLabel: "Colegios e institutos",
    title: "Sudaderas personalizadas",
    titleAccent: "para colegios e institutos.",
    metaDescription:
      "Sudaderas personalizadas para colegios, institutos, clases y viajes de estudios. Diseño incluido, nombres y tallas individuales, y pago por persona o en grupo.",
    eyebrow: "Colegios · Institutos · Clases",
    lead:
      "Convertid vuestro curso, promoción o viaje de estudios en una sudadera que todos quieran seguir usando. Os ayudamos con el diseño, organizamos tallas y nombres y, cuando todo esté aprobado, cada persona puede pagar la suya.",
    groupType: "Colegio o instituto",
    quoteDesign: "Diseño para colegio o instituto",
    hoodieTop: "PROMO 26",
    hoodieMain: "X",
    accent: "#9ed8f4",
    garment: "#14223e",
    print: "#9ed8f4",
    introTitle: "Organizar a toda la clase sin convertirlo en otro examen.",
    intro: [
      "Una sudadera de clase tiene muchas decisiones pequeñas: el diseño común, los nombres, las tallas, la fecha y quién ha pagado. Por eso el proceso empieza con una única persona organizadora y termina en un pedido privado donde todo queda reunido.",
      "Podéis partir de una plantilla, subir vuestro boceto o contarnos la idea por WhatsApp. Preparamos una propuesta y no producimos hasta que el diseño, las cantidades y el precio estén confirmados.",
    ],
    benefits: [
      {
        title: "Nombre y talla de cada persona",
        text: "Cada alumno puede indicar su talla, nombre, mote o dorsal manteniendo el diseño común de la clase.",
      },
      {
        title: "Diseño revisado antes de producir",
        text: "Comprobamos composición, contraste y colocaciones y os enseñamos cómo quedará la prenda.",
      },
      {
        title: "Pago individual o conjunto",
        text: "Tras aprobar el presupuesto, podéis compartir el enlace privado o realizar un único pago del grupo.",
      },
      {
        title: "Envío conjunto a toda España",
        text: "Enviamos el pedido completo a la dirección acordada con el organizador. El envío conjunto a Península está incluido.",
      },
    ],
    ideasTitle: "Diseños que hablan de vuestra clase",
    ideasIntro:
      "La mejor sudadera no parece publicidad del centro: parece la identidad de vuestra promoción. Estas son rutas de diseño, no modelos cerrados.",
    ideas: [
      {
        title: "La X con todos los nombres",
        text: "Una composición visual que reúne a toda la clase y deja el año como protagonista.",
      },
      {
        title: "Estilo college",
        text: "Nombre del centro, curso y promoción con una estética universitaria limpia y fácil de llevar.",
      },
      {
        title: "El lugar que compartís",
        text: "Coordenadas, fachada, monumentos o símbolos de la localidad convertidos en ilustración.",
      },
      {
        title: "La broma que solo entendéis",
        text: "Una frase, un profesor mítico o un recuerdo del viaje reinterpretado para que funcione como diseño.",
      },
    ],
    faq: [
      {
        question: "¿Cuál es el pedido mínimo para una clase?",
        answer:
          "La tarifa para grupos empieza en 5 unidades. Para pedidos de 1 a 4 sudaderas, contactad directamente por WhatsApp.",
      },
      {
        question: "¿Podemos pedir tallas diferentes?",
        answer:
          "Sí. Cada persona puede escoger su talla dentro de las disponibles para el modelo elegido.",
      },
      {
        question: "¿Cada alumno puede pagar su sudadera?",
        answer:
          "Sí. Una vez aprobados diseño y presupuesto, abrimos el pedido privado para pagos individuales o para un único pago del organizador.",
      },
      {
        question: "¿Podéis ayudarnos si no sabemos diseñar?",
        answer:
          "Sí. Podéis enviarnos referencias, dibujos o una idea y prepararemos una propuesta que podáis revisar antes de producir.",
      },
      {
        question: "¿Podemos utilizar el escudo del colegio?",
        answer:
          "Podemos incorporarlo si el grupo o el centro dispone del archivo y de la autorización necesaria para utilizarlo.",
      },
    ],
  },
  clubs: {
    slug: "sudaderas-penas",
    label: "Sudaderas personalizadas para peñas",
    shortLabel: "Peñas y fiestas",
    title: "Sudaderas personalizadas",
    titleAccent: "para peñas y fiestas.",
    metaDescription:
      "Sudaderas personalizadas para peñas, fiestas y grupos de amigos. Diseño a medida, nombres individuales, bordado o estampación y pago por persona o conjunto.",
    eyebrow: "Peñas · Fiestas · Grupos de amigos",
    lead:
      "Una peña necesita algo más que un logo pegado en una sudadera. Creamos una identidad que represente al grupo, pueda volver cada año y funcione igual de bien en una fiesta que durante todo el invierno.",
    groupType: "Peña o fiestas",
    quoteDesign: "Diseño para peña o fiestas",
    hoodieTop: "LA PEÑA",
    hoodieMain: "10",
    accent: "#e6ff58",
    garment: "#174f42",
    print: "#e6ff58",
    introTitle: "Vuestra peña ya tiene historia. La sudadera tiene que estar a la altura.",
    intro: [
      "El nombre puede ser el punto de partida, pero el diseño puede integrar una mascota, un aniversario, un símbolo del pueblo, una frase o todo aquello que solo entiende vuestro grupo. Nuestro trabajo es ordenar esas ideas para que la prenda siga viéndose bien.",
      "Podéis combinar un diseño principal en la espalda con nombre, coordenadas o logotipo en el pecho y añadir una bandera estampada o bordada en la manga. Antes de producir, revisáis la propuesta completa.",
    ],
    benefits: [
      {
        title: "Diseño propio, no genérico",
        text: "Partimos del nombre, la historia y los símbolos de la peña para construir una identidad reconocible.",
      },
      {
        title: "Estampación y bordado",
        text: "Elegimos la técnica según el tamaño, el detalle y el acabado que buscáis para cada zona.",
      },
      {
        title: "Personalización individual",
        text: "Nombres, motes, cargos o dorsales pueden cambiar en cada prenda sin perder el diseño de grupo.",
      },
      {
        title: "Pedido organizado",
        text: "El organizador controla quién ha completado sus datos y cómo se abonará el pedido aprobado.",
      },
    ],
    ideasTitle: "De vuestro nombre a una identidad completa",
    ideasIntro:
      "No hay dos peñas iguales. Por eso trabajamos con rutas visuales que se adaptan a vuestra historia y no con un catálogo de logos repetidos.",
    ideas: [
      {
        title: "Mascota y aniversario",
        text: "Un emblema que puede actualizarse cada temporada sin perder la identidad del grupo.",
      },
      {
        title: "Orgullo de pueblo",
        text: "Monumentos, calles, coordenadas y símbolos locales unidos en una composición propia.",
      },
      {
        title: "Collage de recuerdos",
        text: "Fechas, lugares y bromas internas organizados como un diseño que solo podría ser vuestro.",
      },
      {
        title: "Sello limpio y ponible",
        text: "Una opción más sobria para llevar durante todo el año, con el nombre o iniciales de la peña.",
      },
    ],
    faq: [
      {
        question: "¿Podemos crear el diseño desde cero?",
        answer:
          "Sí. Nos contáis la historia de la peña, enviáis referencias y preparamos una propuesta para revisarla juntos.",
      },
      {
        question: "¿Se puede bordar el logo o la bandera?",
        answer:
          "Sí, cuando el tamaño y el nivel de detalle lo permiten. Os aconsejaremos entre bordado y estampación según el resultado buscado.",
      },
      {
        question: "¿Cada miembro puede llevar un mote diferente?",
        answer:
          "Sí. Los nombres, motes, dorsales o cargos pueden personalizarse individualmente.",
      },
      {
        question: "¿Podemos pagar por separado?",
        answer:
          "Sí. El pago individual se abre dentro del pedido privado después de aprobar diseño, cantidad y precio.",
      },
      {
        question: "¿Qué hacemos si tenemos una fecha de fiestas?",
        answer:
          "Indicadla en la solicitud. Revisaremos la viabilidad y acordaremos la fecha antes de confirmar el pedido; conviene empezar con margen.",
      },
    ],
  },
  graduation: {
    slug: "sudaderas-fin-de-curso",
    label: "Sudaderas de fin de curso y promociones",
    shortLabel: "Fin de curso",
    title: "Sudaderas de fin de curso",
    titleAccent: "para vuestra promoción.",
    metaDescription:
      "Sudaderas personalizadas de fin de curso para ESO, Bachillerato, universidad y promociones. Diseño, nombres y tallas individuales con presupuesto sin compromiso.",
    eyebrow: "Fin de curso · Promociones · Universidad",
    lead:
      "El curso termina, pero la sudadera se queda. Diseñamos una prenda para vuestra promoción con nombres, año y detalles personales, y os ayudamos a organizar el pedido sin que una sola persona tenga que perseguir al resto.",
    groupType: "Universidad o promoción",
    quoteDesign: "Diseño de fin de curso o promoción",
    hoodieTop: "PROMO",
    hoodieMain: "26",
    accent: "#ff554b",
    garment: "#753247",
    print: "#f7f3e9",
    introTitle: "Un recuerdo de promoción que apetezca llevar después de graduarse.",
    intro: [
      "Las sudaderas de fin de curso funcionan mejor cuando el año es visible, pero no lo ocupa todo. Podemos integrar los nombres de la clase, una frase, la especialidad, la ciudad o algún detalle del viaje para conseguir un diseño con significado y que siga siendo ponible.",
      "El organizador nos cuenta la idea y recibe una propuesta. Después de aprobar el diseño y el precio, el grupo entra en su enlace privado para completar tallas, personalizaciones y pagos.",
    ],
    benefits: [
      {
        title: "Todos los nombres bien organizados",
        text: "Reunimos la lista dentro del diseño o personalizamos cada prenda sin mezclar datos ni tallas.",
      },
      {
        title: "Año y promoción con estilo",
        text: "Adaptamos números, tipografías y composición para que el recuerdo no parezca una plantilla genérica.",
      },
      {
        title: "Maqueta antes de pagar",
        text: "El grupo ve el aspecto final y puede revisar los detalles antes de que se abra el pedido.",
      },
      {
        title: "Cada persona paga lo suyo",
        text: "El enlace privado evita que el organizador tenga que adelantar o recaudar todo el dinero.",
      },
    ],
    ideasTitle: "El año importa. Vuestra historia, todavía más.",
    ideasIntro:
      "Podéis partir del número de la promoción y llevarlo hacia un estilo universitario, una ilustración o una composición con todos los nombres.",
    ideas: [
      {
        title: "Número de promoción",
        text: "El 26 o el año completo como elemento central, acompañado por el nombre del curso.",
      },
      {
        title: "Todos dentro del diseño",
        text: "Nombres distribuidos en una X, una cifra o una forma creada expresamente para el grupo.",
      },
      {
        title: "Viaje y coordenadas",
        text: "Destino, fecha y símbolos del viaje de estudios convertidos en una composición gráfica.",
      },
      {
        title: "Carrera o especialidad",
        text: "Referencias a la formación y códigos que solo reconoce vuestra promoción, sin perder legibilidad.",
      },
    ],
    faq: [
      {
        question: "¿Podemos incluir todos los nombres de la promoción?",
        answer:
          "Sí. Revisaremos la cantidad de nombres y la composición para que todos sean legibles en el tamaño final.",
      },
      {
        question: "¿Podemos poner un nombre diferente en cada pecho?",
        answer:
          "Sí. Cada prenda puede llevar nombre, mote o iniciales individuales además del diseño común.",
      },
      {
        question: "¿Cuándo deberíamos pedirlas?",
        answer:
          "Cuanto antes tengáis una fecha, mejor. Indicadla en el presupuesto y confirmaremos la viabilidad antes de abrir el pedido.",
      },
      {
        question: "¿Se puede pagar individualmente?",
        answer:
          "Sí. Tras aprobar la propuesta, cada persona puede completar y pagar su prenda desde el pedido privado.",
      },
      {
        question: "¿Hacéis envíos a toda España?",
        answer:
          "Sí. El envío conjunto a Península está incluido. Para Canarias, Baleares y otros países preparamos una cotización específica.",
      },
    ],
  },
  teams: {
    slug: "sudaderas-equipos-clubes",
    label: "Sudaderas para equipos y clubes",
    shortLabel: "Equipos y clubes",
    title: "Sudaderas personalizadas",
    titleAccent: "para equipos y clubes.",
    metaDescription:
      "Sudaderas personalizadas para equipos, clubes y asociaciones. Logo, nombres, dorsales, bordado o estampación y gestión individual de tallas y pagos.",
    eyebrow: "Equipos · Clubes · Asociaciones",
    lead:
      "Llevad la identidad del equipo fuera del terreno de juego. Creamos sudaderas para jugadores, cuerpo técnico y afición con el mismo diseño común y las personalizaciones que necesita cada persona.",
    groupType: "Equipo o club",
    quoteDesign: "Diseño para equipo o club",
    hoodieTop: "EQUIPO",
    hoodieMain: "27",
    accent: "#9ed8f4",
    garment: "#202124",
    print: "#9ed8f4",
    introTitle: "Una imagen de equipo coherente, aunque cada prenda sea personal.",
    intro: [
      "El escudo, los colores y el nombre del club deben mantenerse reconocibles; el nombre, dorsal o función puede cambiar en cada sudadera. Organizamos ambas capas para que la identidad común no se pierda y la preparación del pedido sea sencilla.",
      "Podemos estudiar bordado para el escudo o detalles pequeños y estampación para composiciones grandes, patrocinadores o diseños de espalda. Siempre confirmamos la técnica y el aspecto antes de producir.",
    ],
    benefits: [
      {
        title: "Escudo y colores respetados",
        text: "Revisamos los archivos y el contraste sobre la prenda para mantener una imagen coherente del club.",
      },
      {
        title: "Nombres, dorsales y funciones",
        text: "Jugadores, entrenadores y staff pueden llevar identificaciones diferentes dentro del mismo pedido.",
      },
      {
        title: "Bordado o estampación",
        text: "Elegimos el acabado adecuado para el escudo, el pecho, la espalda, las mangas o los patrocinadores.",
      },
      {
        title: "Tallas y pagos controlados",
        text: "El pedido privado centraliza la información individual y evita hojas y transferencias dispersas.",
      },
    ],
    ideasTitle: "Del escudo a una prenda que une al equipo",
    ideasIntro:
      "La sudadera puede ser equipación de representación, prenda para desplazamientos o parte de la comunidad del club. El diseño se adapta a ese uso.",
    ideas: [
      {
        title: "Escudo limpio en el pecho",
        text: "Una solución reconocible y versátil, con nombre o dorsal individual en otra zona.",
      },
      {
        title: "Espalda de plantilla",
        text: "Composición con el nombre del equipo, temporada y lista de jugadores o categorías.",
      },
      {
        title: "Mascota o símbolo",
        text: "Una versión más expresiva de la identidad para afición, torneos o aniversarios.",
      },
      {
        title: "Edición de temporada",
        text: "Año, categoría o logro deportivo integrados sin alterar el escudo principal.",
      },
    ],
    faq: [
      {
        question: "¿Podemos utilizar el escudo del club?",
        answer:
          "Sí, si nos facilitáis un archivo adecuado y contáis con autorización para usarlo. Revisaremos su adaptación a la técnica elegida.",
      },
      {
        question: "¿Cada jugador puede llevar nombre y dorsal?",
        answer:
          "Sí. Esos datos pueden variar por prenda mientras se mantiene el diseño común del equipo.",
      },
      {
        question: "¿Podemos mezclar jugadores y cuerpo técnico?",
        answer:
          "Sí. Podemos organizar personalizaciones diferentes para jugadores, entrenadores y otras funciones dentro del mismo grupo.",
      },
      {
        question: "¿El escudo queda mejor bordado o estampado?",
        answer:
          "Depende de su tamaño, detalle y colores. Os mostraremos la opción más adecuada antes de confirmar el pedido.",
      },
      {
        question: "¿Puede pagar cada familia o jugador por separado?",
        answer:
          "Sí. El pago individual se habilita dentro del pedido privado una vez aprobados diseño y presupuesto.",
      },
    ],
  },
};

export const audiencePageList = Object.values(audiencePages);
