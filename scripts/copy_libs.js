const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const nm = path.join(root, 'node_modules');
const publicJs = path.join(root, 'public', 'js');
const publicCss = path.join(root, 'public', 'css');

function safeCopy(src, dest) {
  try {
    if (!fs.existsSync(src)) {
      console.warn('Source not found:', src);
      return;
    }
    fs.copyFileSync(src, dest);
    console.log('Copied', src, '->', dest);
  } catch (e) {
    console.error('Failed to copy', src, e && e.message);
  }
}

// Ensure dirs
if (!fs.existsSync(publicJs)) fs.mkdirSync(publicJs, { recursive: true });
if (!fs.existsSync(publicCss)) fs.mkdirSync(publicCss, { recursive: true });

// Mappings
const files = [
  { src: path.join(nm, 'jquery', 'dist', 'jquery.min.js'), dest: path.join(publicJs, 'jquery-3.6.0.min.js') },
  { src: path.join(nm, 'chart.js', 'dist', 'chart.min.js'), dest: path.join(publicJs, 'chart.min.js') },
  { src: path.join(nm, 'chartjs-plugin-datalabels', 'dist', 'chartjs-plugin-datalabels.min.js'), dest: path.join(publicJs, 'chartjs-plugin-datalabels.min.js') },
  { src: path.join(nm, 'sweetalert2', 'dist', 'sweetalert2.min.js'), dest: path.join(publicJs, 'sweetalert2.min.js') },
  { src: path.join(nm, 'bootstrap', 'dist', 'js', 'bootstrap.bundle.min.js'), dest: path.join(publicJs, 'bootstrap.bundle.min.js') },
  { src: path.join(nm, 'datatables.net', 'js', 'jquery.dataTables.min.js'), dest: path.join(publicJs, 'jquery.dataTables.min.js') },
  { src: path.join(nm, 'datatables.net-dt', 'css', 'jquery.dataTables.min.css'), dest: path.join(publicCss, 'jquery.dataTables.min.css') }
];

files.forEach(f => safeCopy(f.src, f.dest));

console.log('copy_libs.js finished');
