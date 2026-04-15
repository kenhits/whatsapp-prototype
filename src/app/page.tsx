"use client";

import { useState, useRef, useEffect, FormEvent } from "react";

/* ─── Types ─── */
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  forwardContent?: string;
  forwardContents?: string[];
  contactCard?: { name: string; phone: string }[];
}

interface Contact {
  name: string;
  phone: string;
  initials: string;
  color: string;
}

/* ─── Contact Lists ─── */
const CONTACTS: Contact[] = [
  { name: "José Luis Mendoza", phone: "51986400697", initials: "JM", color: "#25D366" },
  { name: "María Elena Quispe", phone: "51995136417", initials: "MQ", color: "#128c7e" },
  { name: "Carlos Alberto Flores", phone: "51949496196", initials: "CF", color: "#075e54" },
  { name: "Rosa María Huamán", phone: "51958630718", initials: "RH", color: "#00a884" },
  { name: "Pedro Alejandro Vargas", phone: "51999923731", initials: "PV", color: "#7c3aed" },
];

// Contacts available in the contact picker (simulating phone contacts)
const PICKER_CONTACTS: Contact[] = [
  { name: "K (You)", phone: "51999000001", initials: "K", color: "#5b93d1" },
  { name: "Lucía Fernanda Torres", phone: "51957857491", initials: "LT", color: "#9e9e9e" },
  { name: "Miguel Ángel Castillo", phone: "51994175119", initials: "MC", color: "#9e9e9e" },
  { name: "Ana Patricia Rojas", phone: "51976510080", initials: "AR", color: "#ff5722" },
  { name: "Diego Fernando Espinoza", phone: "51999000002", initials: "DE", color: "#9e9e9e" },
  { name: "Valentina Sofía Paredes", phone: "51999000003", initials: "VP", color: "#9e9e9e" },
  { name: "Ricardo Javier Salazar", phone: "51987654321", initials: "RS", color: "#e65100" },
  { name: "Carmen Rosa Gutiérrez", phone: "51999000004", initials: "CG", color: "#9e9e9e" },
  { name: "Andrés Felipe Córdova", phone: "51999000005", initials: "AC", color: "#ff5722" },
  { name: "Isabel Cristina Delgado", phone: "51923456789", initials: "ID", color: "#673ab7" },
  { name: "Jorge Eduardo Ramos", phone: "51945678123", initials: "JR", color: "#ff9800" },
  { name: "Gabriela Beatriz Soto", phone: "51934567890", initials: "GS", color: "#e91e63" },
  { name: "José Luis Mendoza", phone: "51986400697", initials: "JM", color: "#25D366" },
  { name: "María Elena Quispe", phone: "51995136417", initials: "MQ", color: "#128c7e" },
  { name: "Carlos Alberto Flores", phone: "51949496196", initials: "CF", color: "#075e54" },
  { name: "Rosa María Huamán", phone: "51958630718", initials: "RH", color: "#00a884" },
  { name: "Pedro Alejandro Vargas", phone: "51999923731", initials: "PV", color: "#7c3aed" },
];

/* ─── Default System Prompt ─── */
const DEFAULT_SYSTEM_PROMPT = `Eres un asistente virtual de pagos llamado "Pagos CIX BCP". Hablas en español peruano.

Tu rol es ayudar a los usuarios con:
- Enviar un pago
- Registrar un cobro
- Ver sus cobros o contactos
- Cerrar sesión

REGLAS DE FORMATO:
1. Responde de forma concisa y amigable, como un chatbot de WhatsApp Business
2. Usa emojis moderadamente
3. Guía al usuario paso a paso
4. Mantén respuestas cortas (máximo 3-4 líneas)
5. Cuando ofrezcas opciones, preséntalas como texto numerado dentro del mensaje (1. Opción, 2. Opción). NO uses ningún formato especial de opciones.
6. NO uses markdown (ni negritas, ni listas con -, ni ##). Escribe texto plano.

═══════════════════════════════════════
FLUJO PRINCIPAL: REGISTRAR UN COBRO
═══════════════════════════════════════

PASO 1 - Recopilar información:
Cuando el usuario elige "Registrar un cobro", interpreta su mensaje en lenguaje natural.
Datos necesarios:
- Monto (S/) → OBLIGATORIO
- Descripción/concepto → OPCIONAL
- Nombres de personas → OPCIONAL

NO preguntes cuántas personas son. Si el usuario menciona personas con montos diferentes, regístralos. Si no menciona personas, continúa con el monto general.

Si falta el monto, pregúntalo. Si el usuario da toda la info de una vez, avanza directo al PASO 2.

PASO 2 - Preguntar modalidad:
Una vez tengas el monto, pregunta INMEDIATAMENTE cómo desea enviarlo:

Tu cobro de S/ [monto] está listo! 📝

¿Cómo deseas enviarlo?
1. Generar link de cobro
2. Adjuntar contactos

Escríbeme el número de tu opción o dime cómo prefieres.

IMPORTANTE: Esta pregunta DEBE hacerse ANTES de generar cualquier link o pedir contactos.

PASO 3A - Link de cobro:
Si elige "Generar link de cobro":

REGLA DE UN SOLO LINK vs MÚLTIPLES LINKS:
- Si TODOS los cobros tienen el MISMO monto Y el MISMO concepto → genera UN SOLO link, sin importar cuántas personas sean. Es el mismo link para todos.
- Si los cobros tienen montos DIFERENTES o conceptos DIFERENTES → genera UN link SEPARADO por cada cobro distinto.

CASO 1 - Un solo link (mismo monto y concepto para todos):

Listo! Aquí tienes tu link de cobro 📝

REENVIO_INICIO
💰 Cobro Pagos CIX BCP
Nombre: [nombre si se proporcionó, vacío si no]
Monto: S/ [monto]
Concepto: [concepto o "Cobro general"]
Link de pago: https://pagoscix.pe/cobro/[6 caracteres aleatorios]
Válido por 24 horas
REENVIO_FIN

CASO 2 - Múltiples links (montos o conceptos diferentes):
Genera un bloque REENVIO_INICIO/REENVIO_FIN SEPARADO para cada cobro diferente.

Listos tus cobros! 📝 Reenvía cada mensaje al contacto correspondiente.

REENVIO_INICIO
💰 Cobro Pagos CIX BCP
Nombre: [nombre persona 1]
Monto: S/ [monto 1]
Concepto: [concepto 1]
Link de pago: https://pagoscix.pe/cobro/[6 caracteres aleatorios]
Válido por 24 horas
REENVIO_FIN

REENVIO_INICIO
💰 Cobro Pagos CIX BCP
Nombre: [nombre persona 2]
Monto: S/ [monto 2]
Concepto: [concepto 2]
Link de pago: https://pagoscix.pe/cobro/[6 caracteres aleatorios DIFERENTES]
Válido por 24 horas
REENVIO_FIN

SIEMPRE incluye "Nombre:" en el bloque. Si no se proporcionó nombre, déjalo vacío.
Mensaje introductorio CORTO (1 línea máximo).

PASO 3B - Adjuntar contactos:
Si elige "Adjuntar contactos", hay DOS escenarios:

ESCENARIO A - El usuario YA proporcionó nombre y número de contacto junto con el monto:
Si en la conversación el usuario ya dio nombre, número de teléfono Y monto, NO pidas contacto de nuevo. Procede directamente con la confirmación:

Perfecto! Voy a crear un cobro. ⏳ Estoy preparando la notificación.

Listo! Registré tu cobro por [monto] y envié la notificación a [nombre del contacto].

ESCENARIO B - El usuario NO ha proporcionado un contacto:
Solo en este caso, pide que comparta contactos:

Para enviar el cobro, comparte los contactos de las personas a las que deseas cobrar. 📱
Usa el botón + en la barra de mensajes y selecciona "Contact" para compartir contactos.

Cuando hayas enviado los contactos, avísame. Si prefieres volver al menú, solo dímelo.

Cuando el usuario envíe contactos (verás un mensaje con nombres y números de teléfono):
Responde con la confirmación:

Perfecto! Voy a crear un cobro. ⏳ Estoy preparando la notificación.

Listo! Registré tu cobro por [monto] y envié la notificación a [nombre del contacto].

REGLA CLAVE: NUNCA pidas datos que el usuario ya proporcionó. Si ya tienes nombre, número y monto, procesa el cobro inmediatamente.

IMPORTANTE: El bloque entre REENVIO_INICIO y REENVIO_FIN se mostrará como un mensaje reenviable con botón de reenvío.

═══════════════════════════════════════
FLUJO: VER COBROS O CONTACTOS
═══════════════════════════════════════

Muestra la lista de contactos de acceso rápido:

Aquí tienes la lista de tus contactos de acceso rápido:
1. José Luis Mendoza - 51986400697
2. María Elena Quispe - 51995136417
3. Carlos Alberto Flores - 51949496196
4. Rosa María Huamán - 51958630718
5. Pedro Alejandro Vargas - 51999923731

¿Deseas hacer algo más? Dime o escribe "menú" para volver al inicio.

Cuando el usuario comparta nuevos contactos, agrégalos a la lista y confirma.

═══════════════════════════════════════
FLUJO: ENVIAR UN PAGO
═══════════════════════════════════════

Pide: contacto destinatario, monto, concepto. Confirma el pago simulado.

═══════════════════════════════════════
FLUJO: CERRAR SESIÓN
═══════════════════════════════════════

Confirma el cierre de sesión con un mensaje de despedida.`;

const DEFAULT_BOT_NAME = "Pagos CIX BCP";

const WELCOME_MESSAGE = `Hola Ken, ¿en qué te ayudo hoy?
Puedo:
• Enviar un pago
• Registrar un cobro
• Ver tus cobros o contactos
• Cerrar sesión

Indícame qué deseas hacer.`;

function makeWelcomeMessage(): Message {
  return {
    id: "welcome",
    role: "assistant",
    content: WELCOME_MESSAGE,
    timestamp: getTime(),
  };
}

/* ─── Helpers ─── */
function getTime() {
  return new Date().toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function parseResponse(text: string): {
  content: string;
  forwardContent?: string;
  forwardContents?: string[];
} {
  const lines = text.split("\n");
  const contentLines: string[] = [];
  const allForwardBlocks: string[][] = [];
  let currentBlock: string[] = [];
  let inForward = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "REENVIO_INICIO") { inForward = true; currentBlock = []; continue; }
    if (trimmed === "REENVIO_FIN") { inForward = false; allForwardBlocks.push(currentBlock); continue; }
    if (inForward) { currentBlock.push(line); continue; }
    contentLines.push(line);
  }

  const forwardContents = allForwardBlocks.map(b => b.join("\n").trim()).filter(Boolean);

  return {
    content: contentLines.join("\n").trim(),
    forwardContent: forwardContents.length === 1 ? forwardContents[0] : undefined,
    forwardContents: forwardContents.length > 1 ? forwardContents : undefined,
  };
}

/* ─── Icons (inline SVGs) ─── */
const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
);
const GearIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 118.4 12 3.6 3.6 0 0112 15.6z" /></svg>
);
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#54656f"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
);
const CheckIcon = () => (
  <svg width="16" height="11" viewBox="0 0 16 11" fill="#53bdeb"><path d="M11.07.66L5.4 6.33 3.34 4.28l-.94.94 3 3 .94-.94 5.27-5.27z" /><path d="M15.07.66L9.4 6.33 8.1 5.04l-.94.94 2.24 2.24.94-.94 5.27-5.27z" /></svg>
);
const VerifiedIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
);
const MicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#54656f"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" /><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" /></svg>
);
const ForwardIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 8V4l8 8-8 8v-4H4V8h8z" /></svg>
);
const PlusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#54656f"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
);
const ContactIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
);
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white" opacity="0.5"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
);
const ChevronIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#667781"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
);

/* ─── Attach Menu Items ─── */
const ATTACH_ITEMS = [
  { label: "Photos", icon: "🖼️", color: "#7c3aed" },
  { label: "Camera", icon: "📷", color: "#e91e63" },
  { label: "Location", icon: "📍", color: "#4caf50" },
  { label: "Contact", icon: "👤", color: "#2196f3", action: "contact" as const },
  { label: "Document", icon: "📄", color: "#ff9800" },
  { label: "Poll", icon: "📊", color: "#ff5722" },
];

/* ─── Main Component ─── */
export default function Home() {
  const [messages, setMessages] = useState<Message[]>(() => [makeWelcomeMessage()]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [botName, setBotName] = useState(DEFAULT_BOT_NAME);
  const [model, setModel] = useState("claude-sonnet-4-20250514");
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forward flow
  const [showForwardPicker, setShowForwardPicker] = useState(false);
  const [forwardingContent, setForwardingContent] = useState<string | null>(null);
  const [selectedForwardContacts, setSelectedForwardContacts] = useState<Contact[]>([]);
  const [forwardMessage, setForwardMessage] = useState("");

  // Multi-select forward
  const [selectMode, setSelectMode] = useState(false);
  const [selectedForwards, setSelectedForwards] = useState<string[]>([]);

  // Attachment menu
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // Contact sharing flow
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showContactConfirm, setShowContactConfirm] = useState(false);
  const [selectedPickerContacts, setSelectedPickerContacts] = useState<Contact[]>([]);
  const [pickerSearch, setPickerSearch] = useState("");
  const [showContactCardDetails, setShowContactCardDetails] = useState<{ name: string; phone: string }[] | null>(null);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  // Forward picker search
  const [contactSearch, setContactSearch] = useState("");

  // Settings temp
  const [tempPrompt, setTempPrompt] = useState("");
  const [tempBotName, setTempBotName] = useState("");
  const [tempModel, setTempModel] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);
  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  /* ─── Send Message ─── */
  async function sendMessage(text: string) {
    if (!text.trim() || isTyping) return;
    setError(null);

    const userMsg: Message = {
      id: crypto.randomUUID(), role: "user", content: text.trim(), timestamp: getTime(),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.filter((m) => m.id !== "welcome").map((m) => ({
            role: m.role,
            content: m.contactCard
              ? `[Contactos compartidos: ${m.contactCard.map((c) => `${c.name} - ${c.phone}`).join(", ")}]`
              : m.content,
          })),
          systemPrompt, model,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error del servidor");

      const { content, forwardContent, forwardContents } = parseResponse(data.content);
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 700));

      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(), role: "assistant", content, timestamp: getTime(), forwardContent, forwardContents,
      }]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error desconocido";
      setError(errorMsg);
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(), role: "assistant", content: `⚠️ ${errorMsg}`, timestamp: getTime(),
      }]);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e: FormEvent) { e.preventDefault(); sendMessage(input); }

  /* ─── Settings ─── */
  function openSettings() { setTempPrompt(systemPrompt); setTempBotName(botName); setTempModel(model); setShowSettings(true); }
  function saveSettings() { setSystemPrompt(tempPrompt); setBotName(tempBotName); setModel(tempModel); setShowSettings(false); }
  function clearChat() { setMessages([makeWelcomeMessage()]); setError(null); setShowSettings(false); }

  /* ─── Forward Flow ─── */
  function handleForward(content: string) {
    // Enter select mode: auto-select the clicked card and let user select more
    setSelectMode(true);
    setSelectedForwards((prev) => prev.includes(content) ? prev : [...prev, content]);
  }
  function toggleForwardSelect(content: string) {
    setSelectedForwards((prev) => prev.includes(content) ? prev.filter(c => c !== content) : [...prev, content]);
  }
  function openForwardPicker() {
    const combined = selectedForwards.join("\n\n---\n\n");
    setForwardingContent(combined);
    setContactSearch(""); setSelectedForwardContacts([]); setForwardMessage("");
    setShowForwardPicker(true);
    setSelectMode(false); setSelectedForwards([]);
  }
  function cancelSelectMode() { setSelectMode(false); setSelectedForwards([]); }
  function handleSelectForwardContact(contact: Contact) {
    setSelectedForwardContacts((prev) => {
      const exists = prev.find((c) => c.phone === contact.phone);
      if (exists) return prev.filter((c) => c.phone !== contact.phone);
      return [...prev, contact];
    });
  }
  function handleForwardSend() {
    if (selectedForwardContacts.length === 0) return;
    const names = selectedForwardContacts.map((c) => c.name.split(" ").slice(0, 2).join(" "));
    const toastName = names.length === 1
      ? names[0]
      : `${names[0]} y ${names.length - 1} m\u00e1s`;
    setShowForwardPicker(false); setForwardingContent(null); setSelectedForwardContacts([]); setForwardMessage("");
    setToast(`Reenviado a ${toastName} \u2713`);
  }

  /* ─── Contact Sharing Flow ─── */
  function openContactPicker() { setShowAttachMenu(false); setSelectedPickerContacts([]); setPickerSearch(""); setShowContactPicker(true); }

  function togglePickerContact(contact: Contact) {
    setSelectedPickerContacts((prev) => {
      const exists = prev.find((c) => c.phone === contact.phone);
      if (exists) return prev.filter((c) => c.phone !== contact.phone);
      return [...prev, contact];
    });
  }

  function goToContactConfirm() { setShowContactPicker(false); setShowContactConfirm(true); }

  function sendContacts() {
    const contacts = selectedPickerContacts.map((c) => ({ name: c.name, phone: c.phone }));
    const contactMsg: Message = {
      id: crypto.randomUUID(), role: "user",
      content: `${contacts[0].name}${contacts.length > 1 ? ` and ${contacts.length - 1} other contact${contacts.length > 2 ? "s" : ""}` : ""}`,
      timestamp: getTime(),
      contactCard: contacts,
    };
    setMessages((prev) => [...prev, contactMsg]);
    setShowContactConfirm(false);
    setSelectedPickerContacts([]);

    // Auto-send to bot after a short delay
    setTimeout(() => {
      const text = contacts.map((c) => `${c.name} - +${c.phone}`).join("\n");
      sendMessage(`Agregar contactos:\n${text}`);
    }, 500);
  }

  const filteredPickerContacts = PICKER_CONTACTS.filter(
    (c) => !pickerSearch || c.name.toLowerCase().includes(pickerSearch.toLowerCase()) || c.phone.includes(pickerSearch)
  );

  const filteredForwardContacts = CONTACTS.filter(
    (c) => !contactSearch || c.name.toLowerCase().includes(contactSearch.toLowerCase()) || c.phone.includes(contactSearch)
  );

  return (
    <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111b21' }}>
      <div className="phone-frame" style={{ width: '100%', maxWidth: 412, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: '#ece5dd', borderRadius: '2.2rem', border: '1px solid #333' }}>

        {/* ─── Header ─── */}
        <header style={{ background: '#075e54', color: '#fff', padding: '8px 8px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
            <span style={{ fontSize: 14, opacity: 0.85 }}>40</span>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontSize: 19, fontWeight: 500 }}>{botName.charAt(0).toUpperCase()}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontWeight: 400, fontSize: 17, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{botName}</span>
              <VerifiedIcon />
            </div>
          </div>
          <button onClick={openSettings} style={{ padding: 6, borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', color: '#fff' }} title="Configuración">
            <GearIcon />
          </button>
        </header>

        {/* ─── Chat Area ─── */}
        <div className="chat-scroll wa-bg" style={{ flex: 1, overflowY: 'auto', padding: '6px 12px 10px' }}>

          {/* Encryption notice */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0 14px' }}>
            <div style={{ background: 'rgba(255,243,224,0.92)', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#54656f', maxWidth: '92%', textAlign: 'center', lineHeight: '16px' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#8c8a85" style={{ display: 'inline-block', marginRight: 3, marginTop: -1, verticalAlign: 'middle' }}><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" /></svg>
              Los mensajes y las llamadas están cifrados de extremo a extremo. Nadie fuera de este chat, ni siquiera WhatsApp, puede leerlos ni escucharlos.
            </div>
          </div>

          {/* Messages */}
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            const isFirst = idx === 0 || messages[idx - 1].role !== msg.role;
            const bubbleClass = isUser
              ? (isFirst ? "bubble-out" : "bubble-out-cont")
              : (isFirst ? "bubble-in" : "bubble-in-cont");

            return (
              <div key={msg.id} style={{ marginBottom: 2, marginTop: isFirst && idx > 0 ? 4 : 0 }}>
                {/* Contact card */}
                {msg.contactCard ? (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingLeft: 48 }}>
                    <div className="bubble-out" style={{ maxWidth: '80%', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px' }}>
                        <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#00a884', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <ContactIcon />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 15, color: '#111b21', fontWeight: 600, margin: 0 }}>
                            {msg.contactCard[0].name}
                            {msg.contactCard.length > 1 && <span style={{ fontWeight: 400 }}>{` and ${msg.contactCard.length - 1} other contact${msg.contactCard.length > 2 ? "s" : ""}`}</span>}
                          </p>
                        </div>
                        <ChevronIcon />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 3, padding: '0 8px 5px' }}>
                        <span style={{ fontSize: 11, color: '#667781' }}>{msg.timestamp}</span>
                        <CheckIcon />
                      </div>
                      <button onClick={() => setShowContactCardDetails(msg.contactCard!)}
                        style={{ width: '100%', padding: '8px 0', borderTop: '1px solid #b5d9b1', color: '#00a884', fontSize: 14, background: 'transparent', border: 'none', borderTop: '1px solid #b5d9b1', cursor: 'pointer' }}>
                        View all
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Regular bubble */
                  <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', paddingLeft: isUser ? 48 : 0, paddingRight: isUser ? 0 : 48 }}>
                    <div className={bubbleClass} style={{ maxWidth: '100%', padding: '5px 7px 8px 9px' }}>
                      <div>
                        <span style={{ fontSize: 14.2, color: '#111b21', lineHeight: '19px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</span>
                        <span style={{ float: 'right', display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 3, marginLeft: 8 }}>
                          <span style={{ fontSize: 11, color: '#667781', whiteSpace: 'nowrap' }}>{msg.timestamp}</span>
                          {isUser && <CheckIcon />}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Forwardable cards (single or multiple) */}
                {[...(msg.forwardContent ? [msg.forwardContent] : []), ...(msg.forwardContents || [])].map((fc, fi) => {
                  const isSelected = selectedForwards.includes(fc);
                  return (
                    <div key={fi} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', paddingRight: selectMode ? 12 : 48, marginTop: fi === 0 ? 2 : 4, gap: 8 }}>
                      {/* Checkbox in select mode */}
                      {selectMode && (
                        <button onClick={() => toggleForwardSelect(fc)} style={{ marginTop: 10, flexShrink: 0, width: 26, height: 26, borderRadius: '50%', border: isSelected ? 'none' : '2px solid #ccc', background: isSelected ? '#00a884' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                          {isSelected && <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
                        </button>
                      )}
                      <div className="bubble-in" style={{ maxWidth: '100%', overflow: 'hidden', flex: 1 }}>
                        <div style={{ padding: '5px 9px 0', display: 'flex', alignItems: 'center', gap: 4, color: '#667781' }}>
                          <ForwardIcon size={11} />
                          <span style={{ fontSize: 11, fontStyle: 'italic' }}>Mensaje reenviable</span>
                        </div>
                        <div style={{ padding: '5px 9px 7px' }}>
                          <p style={{ fontSize: 14, color: '#111b21', lineHeight: '19px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}
                            dangerouslySetInnerHTML={{ __html: fc.replace(/(https?:\/\/[^\s]+)/g, '<span style="color:#027eb5;text-decoration:underline;cursor:pointer">$1</span>') }} />
                        </div>
                        {!selectMode && (
                          <button onClick={() => handleForward(fc)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', borderTop: '1px solid #e9edef', color: '#00a884', background: 'transparent', border: 'none', borderTop: '1px solid #e9edef', cursor: 'pointer', fontSize: 13.5 }}>
                            <ForwardIcon size={15} />
                            <span>Reenviar mensaje</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', paddingRight: 48, marginTop: 3 }}>
              <div className="bubble-in" style={{ padding: '10px 14px' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <span className="tdot" /><span className="tdot" /><span className="tdot" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ─── Error ─── */}
        {error && (
          <div style={{ padding: '6px 12px', background: '#fff0f0', flexShrink: 0 }}>
            <p style={{ fontSize: 12, color: '#dc2626', textAlign: 'center', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* ─── Attachment Menu ─── */}
        {showAttachMenu && (
          <div style={{ position: 'absolute', bottom: 60, left: 10, right: 10, background: '#fff', borderRadius: 16, padding: 20, zIndex: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {ATTACH_ITEMS.map((item) => (
                <button key={item.label} onClick={() => { if (item.action === 'contact') { openContactPicker(); } else { setShowAttachMenu(false); } }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <div style={{ width: 53, height: 53, borderRadius: '50%', backgroundColor: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                    {item.icon}
                  </div>
                  <span style={{ fontSize: 13, color: '#54656f' }}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Input Area ─── */}
        <form onSubmit={handleSubmit} style={{ background: '#f0f0f0', padding: 'calc(6px) 10px calc(6px + env(safe-area-inset-bottom, 0px))', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* + Button */}
          <button type="button" onClick={() => setShowAttachMenu(!showAttachMenu)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#54656f" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>

          {/* Text Input Pill */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 21, paddingLeft: 16, paddingRight: 8, minHeight: 42, boxSizing: 'border-box' }}>
            <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
              onFocus={() => setShowAttachMenu(false)}
              placeholder="Escribe un mensaje"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 15, color: '#111b21', padding: '10px 0' }}
              disabled={isTyping} />
            {/* Smiley / Sticker icon inside pill */}
            <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#54656f" strokeWidth="1.8" />
                <circle cx="9" cy="10" r="1.2" fill="#54656f" />
                <circle cx="15" cy="10" r="1.2" fill="#54656f" />
                <path d="M8.5 14.5c.8 1.5 2 2.5 3.5 2.5s2.7-1 3.5-2.5" stroke="#54656f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              </svg>
            </button>
          </div>

          {/* Camera icon */}
          <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#54656f">
              <path d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z" />
              <path d="M9 2L7.17 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2h-3.17L15 2H9z" fill="none" stroke="#54656f" strokeWidth="1.5" />
            </svg>
          </button>

          {/* Mic or Send button */}
          {input.trim() ? (
            <button type="submit" style={{ background: '#00a884', border: 'none', cursor: 'pointer', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
            </button>
          ) : (
            <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#54656f">
                <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3z" />
                <path d="M19 11a7 7 0 01-14 0" fill="none" stroke="#54656f" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="12" y1="18" x2="12" y2="22" stroke="#54656f" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </form>

        {/* ─── Multi-select Forward Bar ─── */}
        {selectMode && (
          <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 412, background: '#fff', borderTop: '1px solid #e0e0e0', padding: '10px 16px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 15 }}>
            <button onClick={cancelSelectMode} style={{ background: 'transparent', border: 'none', color: '#667781', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
            <span style={{ fontSize: 15, color: '#111b21', fontWeight: 500 }}>{selectedForwards.length} Seleccionado{selectedForwards.length !== 1 ? 's' : ''}</span>
            <button onClick={openForwardPicker} disabled={selectedForwards.length === 0}
              style={{ background: 'transparent', border: 'none', fontSize: 14, cursor: selectedForwards.length > 0 ? 'pointer' : 'default', padding: 8, display: 'flex', alignItems: 'center', gap: 6, color: selectedForwards.length > 0 ? '#00a884' : '#ccc' }}>
              <ForwardIcon size={18} />
            </button>
          </div>
        )}

        {/* ─── Toast ─── */}
        {toast && (
          <div style={{ position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#323739', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 14, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 30, maxWidth: 'calc(100% - 32px)', textAlign: 'center' }}>
            {toast}
          </div>
        )}

        {/* ─── Contact Picker (Share Contacts) ─── */}
        {showContactPicker && (() => {
          const subtitles: Record<string, string> = {
            "K (You)": "~ Kh",
            "Ricardo Javier Salazar": "Hola! Estoy usando WhatsApp.",
            "Jorge Eduardo Ramos": "Busy",
            "Gabriela Beatriz Soto": "Available",
          };
          const youContact = filteredPickerContacts.find(c => c.name === "K (You)");
          const otherContacts = filteredPickerContacts
            .filter(c => c.name !== "K (You)")
            .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
          const grouped: Record<string, typeof otherContacts> = {};
          otherContacts.forEach(c => {
            const letter = c.name[0].toUpperCase();
            if (!grouped[letter]) grouped[letter] = [];
            grouped[letter].push(c);
          });
          const sectionLetters = Object.keys(grouped).sort((a, b) => a.localeCompare(b, "es"));
          const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("");
          const hasSelected = selectedPickerContacts.length > 0;

          const renderName = (name: string) => {
            if (name === "K (You)") return <span>K (You)</span>;
            const parts = name.split(" ");
            if (parts.length === 1) return <span>{name}</span>;
            const last = parts[parts.length - 1];
            const first = parts.slice(0, -1).join(" ");
            return <span>{first} <span style={{ fontWeight: 600 }}>{last}</span></span>;
          };

          return (
          <div style={{ position: "fixed", inset: 0, zIndex: 20, backgroundColor: "#f2f2f7", display: "flex", flexDirection: "column", maxWidth: 412, margin: "0 auto", width: "100%" }}>
            {/* Header */}
            <div style={{ backgroundColor: "#f2f2f7", paddingTop: 14, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "0 16px 10px 16px" }}>
                <button
                  onClick={() => setShowContactPicker(false)}
                  style={{ background: "none", border: "none", color: "#007AFF", fontSize: 17, cursor: "pointer", padding: 0, minWidth: 60, textAlign: "left" }}
                >Cancel</button>
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 17, color: "#000" }}>Share contacts</div>
                  <div style={{ fontSize: 13, color: "#8e8e93", marginTop: 1 }}>{selectedPickerContacts.length}/{PICKER_CONTACTS.length.toLocaleString()}</div>
                </div>
                <button
                  onClick={() => { if (hasSelected) goToContactConfirm(); }}
                  style={{ background: "none", border: "none", color: hasSelected ? "#34c759" : "#c7c7cc", fontSize: 17, fontWeight: 600, cursor: hasSelected ? "pointer" : "default", padding: 0, minWidth: 60, textAlign: "right" }}
                >Next</button>
              </div>
              {/* Search bar */}
              <div style={{ margin: "0 16px 10px 16px", backgroundColor: "#e5e5ea", borderRadius: 10, padding: "8px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#8e8e93"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Search"
                  autoFocus
                  style={{ background: "transparent", border: "none", outline: "none", fontSize: 15, color: "#000", flex: 1 }}
                />
              </div>
            </div>

            {/* Contact list with alphabet index */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              {/* Scrollable contact list */}
              <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#fff" }}>
                {/* You section */}
                {youContact && (
                  <>
                    <div style={{ padding: "8px 16px 4px 16px", fontSize: 14, fontWeight: 700, color: "#000", backgroundColor: "#f2f2f7" }}>You</div>
                    <div style={{ backgroundColor: "#fff" }}>
                      {(() => {
                        const isSelected = selectedPickerContacts.some(c => c.phone === youContact.phone);
                        return (
                          <button
                            onClick={() => togglePickerContact(youContact)}
                            style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "none", border: "none", borderBottom: "1px solid #f0f0f0", cursor: "pointer", textAlign: "left" }}
                          >
                            <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: youContact.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 16, flexShrink: 0 }}>
                              {youContact.initials}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 16, color: "#000" }}>{renderName(youContact.name)}</div>
                              {subtitles[youContact.name] && <div style={{ fontSize: 14, color: "#8e8e93", marginTop: 1 }}>{subtitles[youContact.name]}</div>}
                            </div>
                            <div style={{ width: 22, height: 22, borderRadius: "50%", border: isSelected ? "none" : "2px solid #c7c7cc", backgroundColor: isSelected ? "#34c759" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {isSelected && <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>}
                            </div>
                          </button>
                        );
                      })()}
                    </div>
                  </>
                )}

                {/* Alphabetical sections */}
                {sectionLetters.map(letter => (
                  <div key={letter}>
                    <div style={{ padding: "8px 16px 4px 16px", fontSize: 14, fontWeight: 700, color: "#000", backgroundColor: "#f2f2f7" }}>{letter}</div>
                    <div style={{ backgroundColor: "#fff" }}>
                      {grouped[letter].map(contact => {
                        const isSelected = selectedPickerContacts.some(c => c.phone === contact.phone);
                        return (
                          <button
                            key={contact.phone}
                            onClick={() => togglePickerContact(contact)}
                            style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "none", border: "none", borderBottom: "1px solid #f0f0f0", cursor: "pointer", textAlign: "left" }}
                          >
                            <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: contact.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 16, flexShrink: 0 }}>
                              {contact.initials}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 16, color: "#000" }}>{renderName(contact.name)}</div>
                              {subtitles[contact.name] && <div style={{ fontSize: 14, color: "#8e8e93", marginTop: 1 }}>{subtitles[contact.name]}</div>}
                            </div>
                            <div style={{ width: 22, height: 22, borderRadius: "50%", border: isSelected ? "none" : "2px solid #c7c7cc", backgroundColor: isSelected ? "#34c759" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {isSelected && <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Alphabet index strip */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "4px 8px 4px 4px", flexShrink: 0, backgroundColor: "transparent" }}>
                {alphabet.map(letter => (
                  <div key={letter} style={{ fontSize: 10, fontWeight: 600, color: "#007AFF", lineHeight: "14px", cursor: "pointer" }}>{letter}</div>
                ))}
              </div>
            </div>
          </div>
          );
        })()}

        {/* ─── Contact Confirm (Send Contacts) ─── */}
        {showContactConfirm && (() => {
          function formatPhone(phone: string): string {
            const p = phone.startsWith('+') ? phone : '+' + phone;
            return p.replace(/(\+\d{2})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
          }
          return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column', backgroundColor: '#f2f2f7', maxWidth: 412, margin: '0 auto', width: '100%' }}>
            {/* Header */}
            <div style={{ backgroundColor: '#f2f2f7', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <button onClick={() => { setShowContactConfirm(false); setShowContactPicker(true); }} style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: 17, cursor: 'pointer', padding: 0 }}>Cancel</button>
              <span style={{ fontWeight: 700, fontSize: 17, color: '#000' }}>Send contact</span>
              <button onClick={sendContacts} style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: 17, cursor: 'pointer', padding: 0, fontWeight: 400 }}>Send</button>
            </div>

            {/* Contact list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {selectedPickerContacts.map((contact) => (
                <div key={contact.phone} style={{ marginBottom: 16 }}>
                  {/* Contact avatar and name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#c4c4c6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                    </div>
                    <span style={{ fontSize: 16, color: '#000', fontWeight: 500 }}>{contact.name}</span>
                  </div>

                  {/* Phone number card */}
                  <div style={{ margin: '0 16px', backgroundColor: '#fff', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#34c759', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                    </div>
                    <div>
                      <p style={{ fontSize: 13, color: '#34c759', fontWeight: 500, margin: 0 }}>mobile</p>
                      <p style={{ fontSize: 15, color: '#000', margin: '2px 0 0 0' }}>{formatPhone(contact.phone)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          );
        })()}

        {/* ─── Contact Card Details ─── */}
        {showContactCardDetails && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column', backgroundColor: '#fff', maxWidth: 412, margin: '0 auto', width: '100%' }}>
            <div style={{ backgroundColor: '#075e54', color: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <button onClick={() => setShowContactCardDetails(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: 14, cursor: 'pointer', padding: 0 }}>Close</button>
              <span style={{ fontWeight: 600, fontSize: 17 }}>Shared contacts</span>
              <span style={{ width: 40 }} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              {showContactCardDetails.map((contact, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#f7f8fa', borderRadius: 8, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#00a884', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ContactIcon />
                  </div>
                  <div>
                    <p style={{ fontSize: 15, color: '#111b21', fontWeight: 500, margin: 0 }}>{contact.name}</p>
                    <p style={{ fontSize: 13, color: '#667781', margin: '2px 0 0 0' }}>+{contact.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Forward Picker ─── */}
        {showForwardPicker && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column', backgroundColor: '#f2f2f7', maxWidth: 412, margin: '0 auto', width: '100%' }}>
            {/* Header */}
            <div style={{ backgroundColor: '#f2f2f7', paddingTop: 12, paddingBottom: 0, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 10px 16px' }}>
                <button onClick={() => { setShowForwardPicker(false); setSelectedForwardContacts([]); setForwardMessage(""); }} style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: 17, cursor: 'pointer', padding: 0 }}>Cancel</button>
                <span style={{ fontWeight: 700, fontSize: 17, color: '#000' }}>Send to</span>
                <button style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: 15, cursor: 'pointer', padding: 0 }}>New group</button>
              </div>
              {/* Search bar */}
              <div style={{ margin: '0 16px 10px 16px', backgroundColor: '#e5e5ea', borderRadius: 10, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#8e8e93"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Search"
                  autoFocus
                  style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 15, color: '#000', flex: 1 }}
                />
              </div>
            </div>

            {/* Contact list */}
            <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#fff' }}>
              {/* Frequently contacted */}
              <div style={{ padding: '14px 16px 6px 16px', fontSize: 13, color: '#8e8e93', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, backgroundColor: '#f2f2f7' }}>Frequently contacted</div>
              <div style={{ backgroundColor: '#fff' }}>
                {[
                  { name: 'Miguel Ángel Castillo', phone: '51999000010', initials: 'MC', color: '#f5c542', subtitle: 'Hola! Estoy usando WhatsApp.' },
                  { name: 'Andrés Felipe Córdova', phone: '51999000011', initials: 'AC', color: '#5b93d1', subtitle: 'En el trabajo' },
                  { name: 'Isabel Cristina Delgado', phone: '51999000012', initials: 'ID', color: '#5b93d1', subtitle: '' },
                  { name: 'Valentina Sofía Paredes', phone: '51999000013', initials: 'VP', color: '#4db6ac', subtitle: '' },
                ].filter((c) => !contactSearch || c.name.toLowerCase().includes(contactSearch.toLowerCase())).map((contact) => {
                  const isSelected = selectedForwardContacts.some((c) => c.phone === contact.phone);
                  return (
                    <button
                      key={contact.phone}
                      onClick={() => handleSelectForwardContact(contact as Contact)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'none', border: 'none', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: contact.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 15, flexShrink: 0 }}>
                        {contact.initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 16, color: '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contact.name}</div>
                        {contact.subtitle && <div style={{ fontSize: 14, color: '#8e8e93', marginTop: 1 }}>{contact.subtitle}</div>}
                      </div>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', border: isSelected ? 'none' : '2px solid #c7c7cc', backgroundColor: isSelected ? '#34c759' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {isSelected && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Recent chats */}
              <div style={{ padding: '14px 16px 6px 16px', fontSize: 13, color: '#8e8e93', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, backgroundColor: '#f2f2f7' }}>Recent chats</div>
              <div style={{ backgroundColor: '#fff' }}>
                {[
                  { name: 'Rosa Mar\u00eda Huam\u00e1n', phone: '51958630718', initials: 'RH', color: '#4caf50', subtitle: 'Disponible' },
                  { name: 'Pagos CIX BCP', phone: '51999000020', initials: 'P', color: '#4caf50', subtitle: '' },
                ].filter((c) => !contactSearch || c.name.toLowerCase().includes(contactSearch.toLowerCase())).map((contact) => {
                  const isSelected = selectedForwardContacts.some((c) => c.phone === contact.phone);
                  return (
                    <button
                      key={contact.phone}
                      onClick={() => handleSelectForwardContact(contact as Contact)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'none', border: 'none', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: contact.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 15, flexShrink: 0 }}>
                        {contact.initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 16, color: '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contact.name}</div>
                        {contact.subtitle && <div style={{ fontSize: 14, color: '#8e8e93', marginTop: 1 }}>{contact.subtitle}</div>}
                      </div>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', border: isSelected ? 'none' : '2px solid #c7c7cc', backgroundColor: isSelected ? '#34c759' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {isSelected && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom bar */}
            <div style={{ backgroundColor: '#fff', borderTop: '1px solid #e5e5ea', padding: '8px 12px', paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {selectedForwardContacts.length > 0 ? (
                <span style={{ fontSize: 14, color: '#000', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                  {selectedForwardContacts[0].name.split(" ")[0]}
                  {selectedForwardContacts.length > 1 && ` + ${selectedForwardContacts.length - 1} m\u00e1s`}
                </span>
              ) : (
                <span style={{ fontSize: 14, color: '#8e8e93', flexShrink: 0 }}>Select contact</span>
              )}
              <div style={{ flex: 1, backgroundColor: '#f2f2f7', borderRadius: 18, padding: '8px 14px', marginLeft: 4, marginRight: 4 }}>
                <input
                  type="text"
                  value={forwardMessage}
                  onChange={(e) => setForwardMessage(e.target.value)}
                  placeholder="Add a message..."
                  style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: '#000', width: '100%' }}
                />
              </div>
              <button
                onClick={handleForwardSend}
                disabled={selectedForwardContacts.length === 0}
                style={{
                  backgroundColor: selectedForwardContacts.length > 0 ? '#34c759' : '#a8d5ba',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 18,
                  padding: '8px 20px',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: selectedForwardContacts.length > 0 ? 'pointer' : 'default',
                  flexShrink: 0,
                  opacity: selectedForwardContacts.length > 0 ? 1 : 0.6,
                }}
              >
                Forward
              </button>
            </div>
          </div>
        )}

        {/* ─── Settings Modal ─── */}
        {showSettings && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 20, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', maxWidth: 412, margin: '0 auto', width: '100%' }}>
            <div style={{ backgroundColor: '#fff', width: '100%', borderRadius: '12px 12px 0 0', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -4px 20px rgba(0,0,0,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e5e5ea', flexShrink: 0 }}>
                <h2 style={{ fontSize: 17, fontWeight: 600, color: '#111b21', margin: 0 }}>Configuracion</h2>
                <button onClick={() => setShowSettings(false)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', borderRadius: '50%' }}><CloseIcon /></button>
              </div>
              <div style={{ padding: 16, flex: 1, overflowY: 'auto' }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#54656f', marginBottom: 6 }}>Nombre del bot</label>
                  <input type="text" value={tempBotName} onChange={(e) => setTempBotName(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, color: '#111b21', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#54656f', marginBottom: 6 }}>Modelo de IA</label>
                  <select value={tempModel} onChange={(e) => setTempModel(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, color: '#111b21', outline: 'none', backgroundColor: '#fff', boxSizing: 'border-box' }}>
                    <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (rapido)</option>
                    <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (recomendado)</option>
                    <option value="claude-opus-4-20250514">Claude Opus 4 (mas capaz)</option>
                  </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#54656f', marginBottom: 6 }}>System Prompt</label>
                  <textarea value={tempPrompt} onChange={(e) => setTempPrompt(e.target.value)} rows={12}
                    style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, color: '#111b21', resize: 'none', outline: 'none', fontFamily: 'monospace', lineHeight: '1.6', boxSizing: 'border-box' }}
                    placeholder="Escribe el system prompt aqui..." />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, padding: 16, borderTop: '1px solid #e5e5ea', flexShrink: 0 }}>
                <button onClick={clearChat} style={{ padding: '8px 16px', borderRadius: 8, background: 'none', border: 'none', color: '#dc2626', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Limpiar chat</button>
                <div style={{ flex: 1 }} />
                <button onClick={() => setShowSettings(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: 'none', color: '#54656f', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Cancelar</button>
                <button onClick={saveSettings} style={{ padding: '8px 20px', borderRadius: 8, backgroundColor: '#00a884', border: 'none', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Guardar</button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Attach Menu Click-Outside Overlay ─── */}
        {showAttachMenu && (
          <div onClick={() => setShowAttachMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
        )}
      </div>

    </div>
  );
}
