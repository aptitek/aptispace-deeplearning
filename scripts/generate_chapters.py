#!/usr/bin/env python3
import os
import re
import yaml

COURS_DIR = 'cours'
QUARTO_YML = '_quarto.yml'

def get_chapter_directories():
    if not os.path.exists(COURS_DIR):
        return []
    dirs = []
    for d in os.listdir(COURS_DIR):
        full_path = os.path.join(COURS_DIR, d)
        if os.path.isdir(full_path) and not d.startswith('.'):
            dirs.append(d)
    # Sort them alphabetically/numerically
    dirs.sort()
    return dirs

def process_chapter(dir_name):
    dir_path = os.path.join(COURS_DIR, dir_name)
    index_path = os.path.join(dir_path, 'index.qmd')
    
    # Find all _*.qmd files
    sub_modules = []
    for f in os.listdir(dir_path):
        if f.startswith('_') and f.endswith('.qmd'):
            sub_modules.append(f)
    sub_modules.sort()
    
    # If index.qmd doesn't exist, create it
    if not os.path.exists(index_path):
        title = dir_name.replace('_', ' ').strip().title()
        content = f"""---
title: "{title}"
---

# {title}

<!-- DYNAMIC_INCLUDES_START -->
<!-- DYNAMIC_INCLUDES_END -->
"""
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
    # Read index.qmd
    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Generate the includes list
    includes_str = '\n'.join([f'{{{{< include {sm} >}}}}' for sm in sub_modules])
    
    # Insert or update the includes inside markers
    start_marker = '<!-- DYNAMIC_INCLUDES_START -->'
    end_marker = '<!-- DYNAMIC_INCLUDES_END -->'
    
    if start_marker in content and end_marker in content:
        pattern = re.escape(start_marker) + r'.*?' + re.escape(end_marker)
        replacement = f"{start_marker}\n{includes_str}\n{end_marker}"
        new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    else:
        # Append to the end of the file
        new_content = f"{content.strip()}\n\n{start_marker}\n{includes_str}\n{end_marker}\n"
        
    if new_content != content:
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
            
    # Parse title and part from front-matter
    fm_match = re.match(r'^---\s*\n(.*?)\n---\s*\n', new_content, re.DOTALL)
    part = None
    title = dir_name.replace('_', ' ').strip().title()
    
    if fm_match:
        try:
            fm = yaml.safe_load(fm_match.group(1))
            if isinstance(fm, dict):
                part = fm.get('part', None)
                title = fm.get('title', title)
        except Exception as e:
            print(f"Error parsing front matter for {index_path}: {e}")
            
    # If title still not set, try to find the first level 1 header
    if not title:
        header_match = re.search(r'^#\s+(.+)$', new_content, re.MULTILINE)
        if header_match:
            title = header_match.group(1).strip()
            
    return {
        'path': f"{COURS_DIR}/{dir_name}/index.qmd",
        'title': title,
        'part': part
    }

def update_quarto_yml(chapters):
    if not os.path.exists(QUARTO_YML):
        return
        
    # Read _quarto.yml
    with open(QUARTO_YML, 'r', encoding='utf-8') as f:
        content = f.read()
        
    start_marker = '# DYNAMIC_CHAPTERS_START'
    end_marker = '# DYNAMIC_CHAPTERS_END'
    
    if start_marker not in content or end_marker not in content:
        # Fail silently if not configured
        return
        
    # Group chapters by part
    parts_order = []
    parts_map = {}
    for ch in chapters:
        part = ch['part']
        if part not in parts_map:
            parts_order.append(part)
            parts_map[part] = []
        parts_map[part].append(ch['path'])
        
    # Build YAML lines
    yaml_lines = []
    for part in parts_order:
        chaps = parts_map[part]
        if part is not None:
            yaml_lines.append(f'    - part: "{part}"')
            yaml_lines.append( '      chapters:')
            for cp in chaps:
                yaml_lines.append(f'        - {cp}')
        else:
            for cp in chaps:
                yaml_lines.append(f'    - {cp}')
                
    yaml_snippet = '\n'.join(yaml_lines)
    
    # Match pattern from start marker to end marker, keeping line-endings
    pattern = re.escape(start_marker) + r'.*?' + re.escape(end_marker)
    
    # Get start marker indentation
    match = re.search(r'^([ \t]*){}'.format(re.escape(start_marker)), content, re.MULTILINE)
    indent = match.group(1) if match else '    '
    
    replacement = f"{start_marker}\n{yaml_snippet}\n{indent}{end_marker}"
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    if new_content != content:
        with open(QUARTO_YML, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Successfully updated _quarto.yml with dynamic chapters.")

def main():
    if not os.path.exists(COURS_DIR):
        return
    dirs = get_chapter_directories()
    chapters = []
    for d in dirs:
        ch_info = process_chapter(d)
        chapters.append(ch_info)
        
    update_quarto_yml(chapters)

if __name__ == '__main__':
    main()
