window.theme = (function() {
  const style = getComputedStyle(document.documentElement);
  const getVar = (name) => style.getPropertyValue(name).trim();
  return {
    blue: getVar('--sol-blue'),
    red: getVar('--sol-red'),
    green: getVar('--sol-green'),
    orange: getVar('--sol-orange'),
    yellow: getVar('--sol-yellow'),
    violet: getVar('--sol-violet'),
    cyan: getVar('--sol-cyan'),
    magenta: getVar('--sol-magenta'),
    base03: getVar('--sol-base03'),
    base02: getVar('--sol-base02'),
    base01: getVar('--sol-base01'),
    base00: getVar('--sol-base00'),
    base0: getVar('--sol-base0'),
    base1: getVar('--sol-base1'),
    base2: getVar('--sol-base2'),
    base3: getVar('--sol-base3'),
    bg: getVar('--bg-color'),
    font_code: getVar('--font-code')
  };
})();

window.ui = window.ui || { atom: {}, mol: {}, org: {} };
