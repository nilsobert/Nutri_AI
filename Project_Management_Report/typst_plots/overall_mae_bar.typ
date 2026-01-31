#import "@preview/lilaq:0.5.0" as lq

// Produce tightly-cropped PDFs for LaTeX inclusion.
#set page(width: auto, height: auto, margin: (top: 2mm, bottom: 3mm, left: 0pt, right: 2mm))

#let app_keys = (
  "NutriAI-Photo+ Audio Input",
  "Nutri AI-Photo input only",
  "Calorix AI",
  "Calorie Cue AI",
  "arise",
)

#let app_labels = (
  [NutriAI-Photo+ #linebreak() Audio Input],
  [Nutri AI-Photo #linebreak() input only],
  "Calorix AI",
  "Calorie Cue AI",
  "arise",
)

#let mae_data = lq.load-txt(
  read("typst_data/overall_mae_bar.csv"),
  header: true,
  converters: (
    App: str,
    Overall_MAE: float,
  )
)

#let app_col = mae_data.at("App")
#let mae_col = mae_data.at("Overall_MAE")

#let get_mae(app) = {
  let idx = range(app_col.len()).find(i => app_col.at(i) == app)
  if idx == none { 0.0 } else { mae_col.at(idx) }
}

#let values = app_keys.map(app => get_mae(app))

#lq.diagram(
  width: 16cm,
  height: 7cm,
  ylim: (0, 100),
  xlabel: [App],
  ylabel: [Overall MAE (%)],
  grid: (stroke: (paint: luma(80%), thickness: 0.7pt, dash: "dashed")),
  xaxis: (
    ticks: app_labels
      .map(rotate.with(-20deg, reflow: true))
      .map(align.with(right))
      .enumerate()
      .map(p => (p.at(0) + 1, p.at(1))),
    subticks: none,
  ),
  yaxis: (
    ticks: (0, 20, 40, 60, 80, 100),
  ),
  lq.bar(
    (1, 2, 3, 4, 5),
    values,
    fill: blue.lighten(50%),
    stroke: 0.8pt + blue.darken(20%),
    width: 0.6,
  ),
)
