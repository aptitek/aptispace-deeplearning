// Backward Compatibility mapping for window.ui top-level methods
Object.assign(window.ui, {
  slider: (args) => window.ui.mol.slider(args),
  toggle: (args) => window.ui.mol.toggle(args),
  checkbox: (args) => window.ui.mol.checkbox(args),
  text_area: (args) => window.ui.mol.field({label: args.label, element: window.ui.atom.textarea(args)}),
  select: (args) => window.ui.mol.field({label: args.label, element: window.ui.atom.select(args)}),
  card: (content, args) => window.ui.org.card(content, args),
  canvas: (args) => window.ui.org.canvas(args)
});
