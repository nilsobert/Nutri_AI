#import "@preview/fletcher:0.5.8" as fletcher: diagram, node, edge

// Set the page to fit content
#set page(width: auto, height: auto, margin: 5mm)

// Colors
#let barblue = rgb("#3366CC")
// Lighter cards as requested
#let header_bg = rgb("#E6F2FF") // Very light blue
#let role_bg = rgb("#F0F7FF")   // Almost white blue
#let person_bg = white

// Styling
#let role_style(title) = {
  align(center + horizon, text(weight: "bold", size: 9pt, fill: barblue, title))
}

#let person_style(name, roles, fill: black) = {
  align(center + horizon)[
    #text(size: 9pt, weight: "bold", fill: fill, name) \
    #text(size: 8pt, style: "italic", fill: fill, roles)
  ]
}

#diagram(
  node-stroke: 1pt + barblue,
  spacing: (0mm, 8mm), // spacing not used for x; we place columns at fixed absolute x positions
  node-corner-radius: 3pt,

  // --- layout constants (absolute x positions) ---
  // column width 34mm, gap 10mm, offset 15mm for centering
  // x positions: 15, 59, 103, 147, 191, 235
  // columns span from (15-17)=-2mm to (235+17)=252mm, total=254mm
  // header center = (-2 + 252) / 2 = 125mm
  // y: header at 0mm (top), columns start at -25mm and go down

  // -- MAIN HEADER --
  node((125mm, 0mm), align(center + horizon, text(size: 14pt, weight: "bold", fill: barblue)[Nutri AI Development Process]),
       width: 254mm, height: 18mm, fill: header_bg),

  // -- COLUMNS --
  // 1. Product & Design
  node((15mm, -25mm), role_style("Product & Design"), width: 34mm, fill: role_bg),
  node((15mm, -40mm), person_style("Laura", "Product Owner"), width: 32mm, fill: person_bg),
  node((15mm, -52mm), person_style("Manuel", "Product Owner"), width: 32mm, fill: person_bg),
  node((15mm, -64mm), person_style("Joana", "UX Design"), width: 32mm, fill: person_bg),

  // 2. Architecture
  node((59mm, -25mm), role_style("Architecture"), width: 34mm, fill: role_bg),
  node((59mm, -40mm), person_style("Laura", "Architect"), width: 32mm, fill: person_bg),
  node((59mm, -52mm), person_style("Manuel", "Architect"), width: 32mm, fill: person_bg),

  // 3. Implementation
  node((103mm, -25mm), role_style("Implementation"), width: 34mm, fill: role_bg),
  node((103mm, -40mm), person_style("Laura", "Full Stack Dev"), width: 32mm, fill: person_bg),
  node((103mm, -52mm), person_style("Manuel", "Full Stack Dev"), width: 32mm, fill: person_bg),
  node((103mm, -64mm), person_style("Joana", "Frontend Dev"), width: 32mm, fill: person_bg),
  node((103mm, -76mm), person_style("Eduardo", "Dev"), width: 32mm, fill: person_bg),

  // 4. Deployment / Ops
  node((147mm, -25mm), role_style("Deployment / Ops"), width: 34mm, fill: role_bg),
  node((147mm, -40mm), person_style("Manuel", "Deployment"), width: 32mm, fill: person_bg),

  // 5. Testing
  node((191mm, -25mm), role_style("Testing"), width: 34mm, fill: role_bg),
  node((191mm, -40mm), person_style("Joana", "UAT"), width: 32mm, fill: person_bg),

  // 6. Support
  node((235mm, -25mm), role_style("Support"), width: 34mm, fill: role_bg),
  node((235mm, -40mm), person_style("Nils", "Support"), width: 32mm, fill: person_bg),

  // -- EDGES --
  // Header to Roles (straight down)
  edge((15mm,0mm), (15mm,-25mm), "-->", stroke: barblue),
  edge((59mm,0mm), (59mm,-25mm), "-->", stroke: barblue),
  edge((103mm,0mm), (103mm,-25mm), "-->", stroke: barblue),
  edge((147mm,0mm), (147mm,-25mm), "-->", stroke: barblue),
  edge((191mm,0mm), (191mm,-25mm), "-->", stroke: barblue),
  edge((235mm,0mm), (235mm,-25mm), "-->", stroke: barblue),

  // Vertical flows (Product & Design)
  edge((15mm,-25mm), (15mm,-40mm), stroke: barblue.lighten(50%)),
  edge((15mm,-40mm), (15mm,-52mm), stroke: barblue.lighten(50%)),
  edge((15mm,-52mm), (15mm,-64mm), stroke: barblue.lighten(50%)),

  // Vertical flows (Architecture)
  edge((59mm,-25mm), (59mm,-40mm), stroke: barblue.lighten(50%)),
  edge((59mm,-40mm), (59mm,-52mm), stroke: barblue.lighten(50%)),

  // Vertical flows (Implementation)
  edge((103mm,-25mm), (103mm,-40mm), stroke: barblue.lighten(50%)),
  edge((103mm,-40mm), (103mm,-52mm), stroke: barblue.lighten(50%)),
  edge((103mm,-52mm), (103mm,-64mm), stroke: barblue.lighten(50%)),
  edge((103mm,-64mm), (103mm,-76mm), stroke: barblue.lighten(50%)),

  // Vertical flows (Dep/Ops)
  edge((147mm,-25mm), (147mm,-40mm), stroke: barblue.lighten(50%)),

  // Vertical flows (Testing)
  edge((191mm,-25mm), (191mm,-40mm), stroke: barblue.lighten(50%)),

  // Vertical flows (Support)
  edge((235mm,-25mm), (235mm,-40mm), stroke: barblue.lighten(50%)),
)
