# NewCo · Plataforma de importación de diamantes (Etapa 1)

NewCo es **importador de registro**: le vende al joyero mexicano el diamante a
precio de origen **con factura (CFDI) y nacionalización resuelta**. *Quien da
buen precio no da factura; quien da factura no da buen precio. NewCo da los dos.*

**Painkiller:** facilidad, trazabilidad y navegación. La consolidación por
**embarque semanal** concentra el volumen para bajar el costo fijo por piedra.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind v4, GSAP. Español, `es-MX`.
- Auth.js (NextAuth v5) con roles `jeweler`/`admin`; **permisos validados en
  servidor** (`src/middleware.ts` + checks en server actions/páginas).
- **Capa de datos** en `src/lib/repo/` — hoy en memoria; Airtable se activa
  definiendo `AIRTABLE_API_KEY` + `AIRTABLE_BASE_ID` (implementación pendiente,
  misma interfaz). El inventario del proveedor llega por su API (mock).

## Desarrollo

```bash
npm install
cp .env.example .env.local   # o define AUTH_SECRET (openssl rand -base64 32)
npm run dev                  # http://localhost:3000
```

Cuentas demo: `joyero@demo.mx` / `joyero123` · `admin@newco.mx` / `newco123`.

## Superficies

| Ruta | Qué es |
|---|---|
| `/inventario` (+ `/inventario/[id]`) | Grid con filtros en vivo, ♥ favoritos, detalle tipo galería. Precios all-in USD. |
| Simulación por pieza | Sin página propia: en cada tarjeta/detalle, dos escenarios — **Importación individual** (outline, costo real) y **Embarque consolidado** (sólido, estimado). |
| `/propuestas` | Gestión: editar set/cliente, link al cliente, señal editable, orden en firme + método. |
| `/embarques` | El barco semanal **como simulador vivo**: héroe all-in consolidado, piedras anónimas (◈/◆), desglose agregado, ajuste a favor, confirmar costo final. |
| `/p/[token]` | Cliente final (público): ve y señala. **Sin precio, sin pago, sin login.** |
| `/portal/*` | Facturación CFDI 4.0, compras + trazabilidad (timeline), direcciones, pagos tokenizados, branding, contraseña. |
| `/admin` | Embarques (crear/cerrar-congelar/zarpar/entregar), Config (leyendas), bandas de margen, joyeros + aprobaciones. |
| `/registro` | Alta por invitación → **pendiente de aprobación** del admin. |

## Reglas de negocio (invariantes)

- **Opción A:** confirmar orden (hold) ≠ elegir método. Al elegir (directa /
  consolidada) el joyero **paga** → NewCo compra al proveedor → se suelta el
  hold. **Cobrar siempre antes de comprar al proveedor.**
- Margen por **bandas globales** por valor (USD), visible como "Servicio de
  importación NewCo". Multi-piedra: flete/agente **prorrateados por valor**.
- **IVA acreditable, nunca pasivo.** El desglose remata en el precio
  **con IVA incluido** (la costumbre mexicana), con el sin-IVA como subtotal.
- Embarque **público sin identificar joyeros** (sólo agregado anónimo); el
  costo pre-corte es **proyección** — se congela al cierre y **cada joyero
  confirma su costo final** antes de zarpar.
- Favoritos y órdenes guardan **snapshot** (el inventario es vivo). Métodos de
  pago **nunca** con datos crudos. Airtable sólo server-side. Inventario cero.

## Lógica pura

`src/lib/quote.ts` — `resolveMargin` (bandas) y `computeQuote` (multi-piedra).
Sin dependencias de UI; alimenta cotizador, inventario, propuestas y embarques.

## Capítulo 2 (diferido, costuras listas `// TODO Cap.2`)

Airtable real · cobro real (SPEI/tarjeta) · lealtad por volumen (apilar en
`resolveMargin`; las órdenes ya guardan `jewelerId`+`totalUsd`) · white-label ·
segundo embarque · API real del proveedor · pedimento/guía/CFDI reales.
