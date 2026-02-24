/**
 * Modern Kanban View Theme v1 - KanbanRenderer Patch
 * Alphaqueb Consulting SAS
 *
 * Responsabilidades:
 *  - Añadir clase "mkv-enhanced" al root del kanban tras render
 *  - Inyectar badge contador dinámico en cada columna
 *  - Añadir tooltips en campos truncados dentro de tarjetas
 *  - Forzar ancho de columnas cuando Odoo lo resetea
 *  - MutationObserver global para columnas y tarjetas añadidas dinámicamente
 */
import { patch }          from "@web/core/utils/patch";
import { KanbanRenderer } from "@web/views/kanban/kanban_renderer";
import { onMounted, onPatched } from "@odoo/owl";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Actualiza el contador de tarjetas visible en el header de cada columna.
 * Odoo ya muestra un contador en algunos layouts, pero lo unificamos.
 */
function updateColumnCounters(rootEl) {
    if (!rootEl) return;

    rootEl.querySelectorAll(".o_kanban_group").forEach((col) => {
        const cards = col.querySelectorAll(
            ".o_kanban_record:not(.o_kanban_ghost):not(.o_kanban_quick_create)"
        );
        const count = cards.length;

        let badge = col.querySelector(".mkv-col-counter");
        if (!badge) {
            badge = document.createElement("span");
            badge.className = "o_kanban_counter mkv-col-counter";

            const header = col.querySelector(".o_kanban_header_title");
            if (header) header.appendChild(badge);
        }

        badge.textContent = count;
    });
}

/**
 * Añade tooltips en elementos con overflow dentro de tarjetas.
 */
function addCardTooltips(rootEl) {
    if (!rootEl) return;

    rootEl.querySelectorAll(".o_kanban_record *").forEach((el) => {
        if (el._mkvTip) return;
        if (!["SPAN", "DIV", "P", "TD", "A", "STRONG", "B"].includes(el.tagName)) return;
        el._mkvTip = true;

        el.addEventListener("mouseenter", () => {
            const overflowing =
                el.scrollWidth > el.clientWidth + 2 ||
                el.scrollHeight > el.clientHeight + 2;
            if (overflowing) {
                const text = el.textContent.trim();
                if (text) el.setAttribute("title", text);
            } else {
                el.removeAttribute("title");
            }
        });
    });
}

/**
 * Asegura que las columnas mantengan el ancho definido en CSS (Odoo a veces
 * aplica estilos inline que lo rompen).
 */
function enforceColumnWidths(rootEl) {
    if (!rootEl) return;

    rootEl.querySelectorAll(".o_kanban_group:not(.o_column_folded)").forEach((col) => {
        // Solo limpiamos si Odoo puso un width inline muy pequeño
        if (col.style.width && parseInt(col.style.width) < 200) {
            col.style.removeProperty("width");
            col.style.removeProperty("min-width");
        }
    });
}

/**
 * Aplica todas las mejoras de una vez.
 */
function applyEnhancements(rootEl) {
    if (!rootEl) return;
    updateColumnCounters(rootEl);
    addCardTooltips(rootEl);
    enforceColumnWidths(rootEl);
}

// ─── Patch al KanbanRenderer ──────────────────────────────────────────────────
patch(KanbanRenderer.prototype, {
    setup() {
        super.setup(...arguments);

        const apply = () => {
            const root = this.el;
            if (!root) return;

            // Marca raíz para posible uso CSS extra
            root.classList.add("mkv-enhanced");

            applyEnhancements(root);
        };

        onMounted(() => apply());
        onPatched(() => setTimeout(apply, 0));
    },
});

// ─── MutationObserver global ──────────────────────────────────────────────────
// Captura columnas y tarjetas que entren al DOM (ej. lazy load, drag & drop)
const _mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
        for (const node of m.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;

            const isKanban = node.classList?.contains("o_kanban_view");
            const inKanban = !!node.closest?.(".o_kanban_view");

            if (!isKanban && !inKanban) continue;

            const root = isKanban
                ? node
                : node.closest(".o_kanban_view");

            if (root) applyEnhancements(root);
        }
    }
});

document.addEventListener(
    "DOMContentLoaded",
    () => {
        _mo.observe(document.body, { childList: true, subtree: true });
    },
    { once: true }
);
