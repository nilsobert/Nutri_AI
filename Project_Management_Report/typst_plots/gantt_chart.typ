#import "@preview/gantty:0.5.1" as gantty
#import gantty: gantt
#import gantty.header: default-headers-drawer, default-week-header, default-month-header
#import gantty.sidebar: default-sidebar-drawer
#import gantty.dividers: default-dividers-drawer
#import gantty.milestones: default-milestones-drawer
#import gantty.field: default-field-drawer
#import gantty.dependencies: default-dependencies-drawer
#import gantty.util: date-coord, foreach-task, styles-for-id, task-anchor-sidebar, task-end, task-start
#import "@preview/cetz:0.4.2" as cetz

// Produce tightly-cropped PDFs for LaTeX inclusion.
#set page(width: 210mm, height: 128mm, margin: (top: 2mm, bottom: 2mm, left: 2mm, right: 2mm))

// ============================================================================
// Configuration File Parser
// ============================================================================
// Reads gantt_config.csv and builds the task hierarchy automatically.
// Config format: phase_id,parent_id,name,start_date,end_date,color
// - Lines starting with # are comments
// - Main phases have empty parent_id
// - Subphases reference their parent's phase_id
// ============================================================================

#let config-raw = read("typst_data/gantt_config.csv")

// Parse the CSV configuration file
#let parse-config(raw-content) = {
  let lines = raw-content.split("\n")
  let entries = ()
  let timeline-start = none
  let timeline-end = none
  
  for line in lines {
    let trimmed = line.trim()
    // Skip empty lines and comments
    if trimmed.len() == 0 or trimmed.starts-with("#") {
      continue
    }
    
    let parts = trimmed.split(",")
    
    // Check for timeline settings
    if parts.at(0).trim() == "timeline_start" {
      timeline-start = parts.at(1).trim()
      continue
    }
    if parts.at(0).trim() == "timeline_end" {
      timeline-end = parts.at(1).trim()
      continue
    }
    
    if parts.len() >= 6 {
      let entry = (
        id: parts.at(0).trim(),
        parent: parts.at(1).trim(),
        name: parts.at(2).trim(),
        start: parts.at(3).trim(),
        end: parts.at(4).trim(),
        color: parts.at(5).trim(),
      )
      entries.push(entry)
    }
  }
  (entries: entries, timeline-start: timeline-start, timeline-end: timeline-end)
}

// Build task hierarchy from flat entries
#let build-tasks(entries) = {
  // First, identify main phases (no parent)
  let main-phases = entries.filter(e => e.parent == "")
  
  // Build tasks array
  let tasks = ()
  for phase in main-phases {
    // Find all subtasks for this phase
    let subtasks = entries.filter(e => e.parent == phase.id)
    
    let subtask-list = ()
    for sub in subtasks {
      subtask-list.push((
        name: sub.name,
        start: sub.start,
        end: sub.end,
        x: (color: rgb(sub.color)),
      ))
    }
    
    tasks.push((
      name: [*#phase.name*],
      x: (color: rgb(phase.color)),
      subtasks: subtask-list,
    ))
  }
  tasks
}

#let parsed-config = parse-config(config-raw)
#let generated-tasks = build-tasks(parsed-config.entries)

// Chart timeline bounds (loaded from config file)
#let gantt-chart = (
  start: parsed-config.timeline-start,
  end: parsed-config.timeline-end,
  tasks: generated-tasks,
)

// Custom tasks drawer to apply per-task colors via x.color
#let _simple-interval-line(gantt-interval, y-coord, style, interval) = {
  import cetz.draw: *
  let start-y-coord = (rel: (0, style.width / 2), to: y-coord)
  let end-y-coord = (rel: (0, -style.width / 2), to: y-coord)
  let start-coord = date-coord(gantt-interval, start-y-coord, interval.start)
  let end-coord = date-coord(gantt-interval, end-y-coord, interval.end)
  rect(start-coord, end-coord, radius: 3pt, ..style.style)
}

#let _interval-line(gantt-interval, style, y-coord, interval) = {
  import cetz.draw: *
  let done = interval.at("done")
  let simple-interval-line = _simple-interval-line.with(gantt-interval, y-coord)
  if done == none {
    simple-interval-line(style.uncompleted, interval)
  } else {
    let done = done
    if done <= interval.end {
      simple-interval-line(style.completed-early.timeframe, (start: interval.start, end: done))
      simple-interval-line(style.completed-early.body, (start: done, end: interval.end))
    } else if done > interval.end {
      simple-interval-line(style.completed-late.body, interval)
      simple-interval-line(style.completed-late.timeframe, (start: interval.end, end: done))
    }
  }
}

#let _draw-task-anchors(gantt-interval, id, task) = {
  import cetz.draw: *
  let y-coord = task-anchor-sidebar(id) + ".header.mid-east"
  let start = date-coord(gantt-interval, y-coord, task-start(task))
  let end = date-coord(gantt-interval, y-coord, task-end(task))
  hide(line(start, end, name: "internal-line"))
  copy-anchors("internal-line")
}

#let _style-from-color(base, color) = (
  uncompleted: (style: (fill: color), width: base.uncompleted.width),
  completed-early: (
    timeframe: (style: (fill: color), width: base.uncompleted.width),
    body: (style: (fill: color), width: base.uncompleted.width),
  ),
  completed-late: (
    timeframe: (style: (fill: color), width: base.uncompleted.width),
    body: (style: (fill: color), width: base.uncompleted.width),
  ),
)

#let _style-for-task(styles, id, task) = {
  let base = styles-for-id(id, styles)
  let x = task.at("x")
  if x != none and x.at("color") != none {
    _style-from-color(base, x.at("color"))
  } else {
    base
  }
}

#let _draw-task-line(gantt-interval, styles, id, task) = {
  import cetz.draw: *
  let y-coord = task-anchor-sidebar(id) + ".header.mid-east"
  group(name: "line", {
    for interval in task.intervals {
      _interval-line(gantt-interval, _style-for-task(styles, id, task), y-coord, interval)
    }
    _draw-task-anchors(gantt-interval, id, task)
  })
}

#let _draw-task(gantt-interval, styles, id, task) = {
  import cetz.draw: *
  group(name: str(id.last()), {
    _draw-task-line(gantt-interval, styles, id, task)
    for (i, task) in task.subtasks.enumerate() {
      _draw-task(gantt-interval, styles, (..id, i), task)
    }
  })
}

#let default-color-styles = (
  (
    uncompleted: (style: (fill: luma(30%)), width: 7pt),
    completed-early: (
      timeframe: (style: (fill: luma(30%)), width: 7pt),
      body: (style: (fill: luma(30%)), width: 7pt),
    ),
    completed-late: (
      timeframe: (style: (fill: luma(30%)), width: 7pt),
      body: (style: (fill: luma(30%)), width: 7pt),
    ),
  ),
  (
    uncompleted: (style: (fill: luma(50%)), width: 4pt),
    completed-early: (
      timeframe: (style: (fill: luma(50%)), width: 4pt),
      body: (style: (fill: luma(50%)), width: 4pt),
    ),
    completed-late: (
      timeframe: (style: (fill: luma(50%)), width: 4pt),
      body: (style: (fill: luma(50%)), width: 4pt),
    ),
  ),
)

#let color-tasks-drawer(gantt, styles: default-color-styles) = {
  import cetz.draw: *
  let gantt-interval = (end: gantt.end, start: gantt.start)
  group(name: "lines", for (i, task) in gantt.tasks.enumerate() {
    _draw-task(gantt-interval, styles, (i,), task)
  })
}

// Drawer configuration
#let drawer = (
  sidebar: default-sidebar-drawer.with(
    formatters: (
      task => strong(task.name),
      task => task.name,
    ),
    dividers: (
      (stroke: (paint: luma(0%), thickness: 0.8pt)),
      (stroke: (paint: luma(70%), thickness: 0.4pt)),
    ),
    padding: 6pt,
  ),
  field: default-field-drawer.with(style: (stroke: (paint: luma(0%), thickness: 0.8pt))),
  headers: default-headers-drawer.with(
    headers: (
      default-month-header(gridlines-style: (stroke: (paint: luma(80%), thickness: 0.5pt))),
      default-week-header(gridlines-style: (stroke: (paint: luma(85%), thickness: 0.5pt))),
    ),
  ),
  dividers: default-dividers-drawer.with(
    styles: (
      (stroke: (paint: luma(0%), thickness: 0.8pt)),
      (stroke: (paint: luma(70%), thickness: 0.4pt)),
    ),
  ),
  tasks: color-tasks-drawer.with(styles: default-color-styles),
  dependencies: default-dependencies-drawer,
  milestones: default-milestones-drawer.with(today-content: none),
)

#gantt(gantt-chart, drawer: drawer)
