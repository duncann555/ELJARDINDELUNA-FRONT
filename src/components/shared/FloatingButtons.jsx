import { CONTACTO_WHATSAPP_URL } from "../../helpers/contact";

export default function FloatingButtons() {
  return (
    <a
      href={CONTACTO_WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float"
      aria-label="Consultar por WhatsApp"
      title="Consultanos por WhatsApp"
    >
      <i className="bi bi-whatsapp" aria-hidden="true"></i>
    </a>
  );
}
