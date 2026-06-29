# NewCo · Simulador de costo aterrizado

Simulador del costo aterrizado y precio de venta para la **importación B2B de
diamante en México**. Versión 1 **standalone**: sin backend ni Airtable; todos
los supuestos se editan a mano y el desglose se recalcula en vivo.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Componentes estilo shadcn (primitivos en `src/components/ui/`)
- Estado sólo en memoria (sin `localStorage`/`sessionStorage`)
- Listo para desplegar en Vercel

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de producción
```

## Cómo funciona

- **Supuestos** (tarjeta izquierda): campos editables. El campo *Arancel (IGI)*
  trae una nota en ámbar para confirmar con el agente aduanal (el diamante
  pulido 7102.39 suele ser bajo o 0%; verificar contra el decreto vigente).
- **Número héroe**: precio all-in al joyero (con IVA). El IVA es **acreditable**,
  no es un pasivo.
- **Barra de composición**: proporción del precio (sin IVA) entre Piedra,
  Logística + seguro, Aduana y Servicio/Margen NewCo.
- **Desglose**: ledger vertical con subtotales (Valor en aduana, Costo
  aterrizado, Precio de venta).
- **Toggle Interna / Cliente**:
  - *Interna*: muestra la línea de margen, el IVA de importación y la tarjeta de
    capital de trabajo.
  - *Cliente*: oculta esas tres y renombra el margen a "Servicio de importación
    NewCo".
- **Export PDF**: usa `window.print()` con un print-stylesheet limpio.

## Fórmulas

Toda la lógica vive en `src/lib/compute.ts` como la función **pura**
`computeQuote(inputs)`, separada de la UI:

```
stoneMxn  = stoneUsd * fx
aduana    = stoneMxn + logi                     // Valor en aduana
igiAmt    = aduana * (igi / 100)
dtaAmt    = aduana * (dta / 100)
landed    = aduana + igiAmt + dtaAmt + agente   // Costo aterrizado
ivaImp    = (aduana + igiAmt + dtaAmt) * 0.16   // IVA importación (acreditable)
marginAmt = landed * (margin / 100)
price     = landed + marginAmt                  // Precio de venta (sin IVA)
ivaOut    = price * 0.16                         // IVA trasladado (acreditable)
allin     = price + ivaOut                       // Precio all-in al joyero
float     = landed + ivaImp                      // Anticipo mínimo (capital de trabajo)
```

## Arquitectura para v2

El contrato `QuoteInputs` y la función pura `computeQuote()` están aislados de la
UI a propósito. En v2:

- Los supuestos llegarán desde **Airtable** (tablas Clientes / Ventas /
  Invoices) en lugar de editarse a mano — la tarjeta de Supuestos pasa a sólo
  lectura, alimentando los mismos `QuoteInputs`.
- El **PDF** se generará server-side con un **folio inmutable** (snapshot
  congelado de la cotización). El botón actual (`window.print()`) está
  desacoplado para sustituirlo sin tocar la lógica de negocio.

## Notas de modelo

- El IVA (importación y trasladado) es **acreditable**, no es pasivo fiscal.
- Modelo **contra orden confirmada**: inventario cero, sin días en inventario ni
  costo de capital propio (el anticipo del joyero cubre el desembolso).
