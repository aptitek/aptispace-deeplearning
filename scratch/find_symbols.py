import os
import re

cours_dir = "/home/aptitek/Documents/Aptispace/deeplearning/cours"

# Find all latex commands in math expressions
latex_cmd_re = re.compile(r'\\[a-zA-Z]+')

all_symbols = set()
symbol_occurrences = {}

for root, dirs, files in os.walk(cours_dir):
    for file in files:
        if file.endswith('.qmd') and not file.endswith('_original.qmd'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Find math blocks ($...$ or $$...$$)
            maths = re.findall(r'\$\$(.*?)\$\$', content, re.DOTALL)
            maths += re.findall(r'(?<!\$)\$(?!\$)(.*?)(?<!\$)\$(?!\$)', content)
            
            for math in maths:
                cmds = latex_cmd_re.findall(math)
                for cmd in cmds:
                    all_symbols.add(cmd)
                    if cmd not in symbol_occurrences:
                        symbol_occurrences[cmd] = []
                    # Keep track of file
                    rel_path = os.path.relpath(filepath, cours_dir)
                    if rel_path not in symbol_occurrences[cmd]:
                        symbol_occurrences[cmd].append(rel_path)

print("Found", len(all_symbols), "unique LaTeX math symbols:")
for sym in sorted(all_symbols):
    files = symbol_occurrences[sym]
    print(f"  {sym} (used in {len(files)} files: {', '.join(files[:3])}{'...' if len(files) > 3 else ''})")
