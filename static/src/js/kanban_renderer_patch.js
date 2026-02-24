/**
 * Modern Kanban View Theme v1.1 - KanbanRenderer Patch
 * Alphaqueb Consulting SAS
 *
 * v1.1: eliminados counters duplicados si Odoo ya los renderiza,
 *       tooltips solo en texto real, enforceColumnWidths preservado.
 */
import { patch }          from "@web/core/utils/patch";
import { KanbanRenderer } from "@web/views/kanban/kanban_renderer";
import { onMounted, onPatched } from "@odoo/owl";

// ─── Contador de tarjetas por columna ────────────────────────────────────────
function updateColumnCounters(rootEl) {
    if (!rootEl) return;

    rootEl.querySelectorAll(".o_kanban_group").forEach((col) => {
        const cards = col.querySelectorAll(
            ".o_kanban_record:not(.o_kanban_ghost):not(.o_kanban_quick_create)"
        );
        const count = cards.length;

        // Si ya existe un counter nativo de Odoo, no duplicamos
        let badge = col.querySelector(".mkv-col-counter");
        if (!badge) {
            // Solo inyectar si no hay un .o_kanban_counter nativo ya visible
            const nativeBadge = col.querySelector(".o_kanban_header .o_kanban_counter:not(.mkv-col-counter)");
            if (nativeBadge) {
                // Actualizamos el nativo en lugar de duplicar
                nativeBadge.textContent = count;
                return;
            }

            badge = document.createElement("span");
            badge.className = "o_kanban_counter mkv-col-counter";

            const header = col.querySelector(".o_kanban_header_title");
            if (header) header.appendChild(badge);
        }

        badge.textContent = count;
    });
}

// ─── Tooltips en texto truncado ───────────────────────────────────────────────
function addCardTooltips(rootEl) {
    if (!rootEl) return;

    rootEl.querySelectorAll(".o_kanban_record").forEach((card) => {
        // Solo elementos de texto directo, no contenedores con hijos complejos
        card.querySelectorAll("span, a, strong, b, p").forEach((el) => {
            if (el._mkvTip) return;
            // Saltar si tiene hijos que no sean texto
            if (el.children.length > 0) return;
            el._mkvTip = true;

            el.addEventListener("mouseenter", () => {
                if (el.scrollWidth > el.clientWidth + 2) {
                    const text = el.textContent.trim();
                    if (text) el.setAttribute("title", text);
                } else {
                    el.removeAttribute("title");
                }
            });
        });
    });
}

// ─── Evitar que Odoo aplique width inline muy pequeño ────────────────────────
function enforceColumnWidths(rootEl) {
    if (!rootEl) return;

    rootEl.querySelectorAll(".o_kanban_group:not(.o_column_folded)").forEach((col) => {
        if (col.style.width && parseInt(col.style.width) < 200) {
            col.style.removeProperty("width");
            col.style.removeProperty("min-width");
        }
    });
}

function applyEnhancements(rootEl) {
    if (!rootEl) return;
    updateColumnCounters(rootEl);
    addCardTooltips(rootEl);
    enforceColumnWidths(rootEl);
}

// ─── Patch KanbanRenderer ─────────────────────────────────────────────────────
patch(KanbanRenderer.prototype, {
    setup() {
        super.setup(...arguments);

        const apply = () => {
            const root = this.el;
            if (!root) return;
            root.classList.add("mkv-enhanced");
            applyEnhancements(root);
        };

        onMounted(() => apply());
        onPatched(() => setTimeout(apply, 0));
    },
});

// ─── MutationObserver global ──────────────────────────────────────────────────
const _mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
        for (const node of m.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;

            const isKanban = node.classList?.contains("o_kanban_view");
            const inKanban = !!node.closest?.(".o_kanban_view");

            if (!isKanban && !inKanban) continue;

            const root = isKanban ? node : node.closest(".o_kanban_view");
            if (root) applyEnhancements(root);
        }
    }
});

document.addEventListener(
    "DOMContentLoaded",
    () => { _mo.observe(document.body, { childList: true, subtree: true }); },
    { once: true }
);