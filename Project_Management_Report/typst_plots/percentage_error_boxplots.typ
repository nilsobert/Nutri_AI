#import "@preview/lilaq:0.5.0" as lq

// Produce tightly-cropped PDFs for LaTeX inclusion.
#set page(width: auto, height: auto, margin: (top: 2mm, bottom: 2mm, left: 5mm, right: 2mm))


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

#let x_base = (1, 3, 5, 7, 9)
#let xs = (off) => x_base.map(x => x + off)

// Load recalculated percentage error data (in %)
#let pe_data = lq.load-txt(
  read("typst_data/boxplot_pe.csv"),
  header: true,
  converters: (
    App: str,
    Metric: str,
    PE: float,
    Meal: int,
  )
)

#let app_col = pe_data.at("App")
#let metric_col = pe_data.at("Metric")
#let pe_col = pe_data.at("PE")

#let get_pe(app, metric) = {
  range(app_col.len())
    .filter(i => app_col.at(i) == app and metric_col.at(i) == metric)
    .map(i => pe_col.at(i))
}

#let calories = app_keys.map(app => get_pe(app, "Calories"))
#let carbs = app_keys.map(app => get_pe(app, "Carbs"))
#let proteins = app_keys.map(app => get_pe(app, "Proteins"))
#let fats = app_keys.map(app => get_pe(app, "Fats"))

#let dashed_gray = (paint: gray, thickness: 1pt, dash: "dashed")

#let point_style(c) = (
  color: c.lighten(20%),
  stroke: none,
  mark: "o",
  mark-size: 2.3pt,
  mark-color: c.lighten(20%),
)

#let point_border_style = (
  color: luma(55%),
  stroke: none,
  mark: "o",
  mark-size: 3.2pt,
  mark-color: luma(55%),
)

#let points_x(datasets, x_positions) = {
  datasets.enumerate()
    .map(p => p.at(1).map(v => x_positions.at(p.at(0))))
    .flatten()
}

#let points_y(datasets) = { datasets.flatten() }

#let add_data_points(datasets, x_positions, c) = (
  lq.plot(
    points_x(datasets, x_positions),
    points_y(datasets),
    ..point_border_style
  ),
  lq.plot(
    points_x(datasets, x_positions),
    points_y(datasets),
    ..point_style(c)
  ),
)

#show label: it => {
  // This targets the small boxes/lines specifically inside the legend
  if (it.has("body")) {
    it
  } else {
    scale(x: 150%, it) // Change 150% to make it as wide as you need
  }
}

#lq.diagram(
  width: 16cm,
  height: 7.5cm,
  ylim: (-150, 550),
  xlabel: none,
  ylabel: [Mean Absolute Percentage Error (%)],
  legend: (position: top + left),
  grid: (stroke: (paint: luma(80%), thickness: 0.7pt, dash: "dashed")),
  xaxis: (
    ticks: (
      (x_base.at(0), app_labels.at(0)),
      (x_base.at(1), app_labels.at(1)),
      (x_base.at(2), app_labels.at(2)),
      (x_base.at(3), app_labels.at(3)),
      (x_base.at(4), app_labels.at(4)),
    )
      .map(p => (p.at(0), align(right, rotate(-20deg, reflow: true, p.at(1))))),
    subticks: none,
  ),
  // Reference line at y=0
  lq.plot((0.5, 9.5), (0, 0), stroke: dashed_gray, mark: none),

  lq.boxplot(
    ..calories,
    x: xs(-0.45),
    width: 0.18,
    fill: rgb("#c79293").lighten(30%),
    stroke: 0.9pt + rgb("#3b2222"),
    median: 0.9pt + black,
    outliers: none,
    label: [Calories],
  ),
  ..add_data_points(calories, xs(-0.45), rgb("#c79293")),
  lq.boxplot(
    ..carbs,
    x: xs(-0.15),
    width: 0.18,
    fill: rgb("#537276").lighten(40%),
    stroke: 0.9pt + rgb("#2c4240"),
    median: 0.9pt + black,
    outliers: none,
    label: [Carbs],
  ),
  ..add_data_points(carbs, xs(-0.15), rgb("#537276")),
  lq.boxplot(
    ..proteins,
    x: xs(0.15),
    width: 0.18,
    fill: rgb("#2c4240").lighten(50%),
    stroke: 0.9pt + rgb("#2c4240"),
    median: 0.9pt + black,
    outliers: none,
    label: [Proteins],
  ),
  ..add_data_points(proteins, xs(0.15), rgb("#2c4240")),
  lq.boxplot(
    ..fats,
    x: xs(0.45),
    width: 0.18,
    fill: rgb("#ccc287").lighten(20%),
    stroke: 0.9pt + rgb("#3b2222"),
    median: 0.9pt + black,
    outliers: none,
    label: [Fats],
  ),
  ..add_data_points(fats, xs(0.45), rgb("#ccc287")),
)
