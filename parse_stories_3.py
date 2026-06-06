import re
import json

data = open('SEAMLESS_UNIVERSE_DATA.txt').read()
edges_part1 = open('src/data/edges-part1.ts').read()
edges_part2 = open('src/data/edges-part2.ts').read()
all_edges_text = edges_part1 + edges_part2

stories_section = data.split('РАЗДЕЛ 3: ВСЕ ИСТОРИИ ПЕРЕСЕЧЕНИЙ')[1]
story_blocks = re.split(r'--- ИСТОРИЯ \d+ ---', stories_section)[1:]

parsed_stories = []
for block in story_blocks:
    story = {}
    id_match = re.search(r'ID:\s*(.+)', block)
    if not id_match: continue
    
    story['id'] = id_match.group(1).strip()
    
    title_match = re.search(r'Title:\s*(.+)', block)
    story['titleEn'] = title_match.group(1).strip() if title_match else ''
    story['titleRu'] = story['titleEn'] # Default to En
    
    year_match = re.search(r'Год:\s*(.+)', block)
    try:
        story['year'] = int(year_match.group(1).strip()) if year_match else 0
    except:
        story['year'] = 0
        
    text_ru_match = re.search(r'Текст:\s*(.*?)(?:\nEN:|\Z)', block, re.DOTALL)
    story['textRu'] = text_ru_match.group(1).strip() if text_ru_match else ''
    
    text_en_match = re.search(r'EN:\s*(.*?)(?:\n\Z|\Z)', block, re.DOTALL)
    story['textEn'] = text_en_match.group(1).strip() if text_en_match else ''
    
    story['resonances'] = 0
    story['verified'] = True
    
    # Extract figures to help finding edges later manually or via fuzzy match
    link_match = re.search(r'Связь:\s*(.+)', block)
    if link_match:
        figures = link_match.group(1).split('x')
        if len(figures) >= 2:
            story['figureA'] = figures[0].strip()
            story['figureB'] = figures[1].strip()
        else:
            story['figureA'] = figures[0].strip()
            story['figureB'] = ''
            
    # Try to find edge ID from the story ID directly since story ID often contains node IDs
    # e.g., merleau-ponty_sheets-johnstone -> merleau-ponty, sheets-johnstone
    # The edges in ts files look like: id: "lnk-N", source: "merleau-ponty", target: "sheets-johnstone"
    
    parts = story['id'].split('_')
    if len(parts) >= 2:
        n1, n2 = parts[0], parts[1]
        
        # search in edges text
        # look for block containing both n1 and n2
        # regex: {[^}]*source:\s*['"](n1|n2)['"][^}]*target:\s*['"](n2|n1)['"][^}]*}
        pattern = r'\{[^}]*id:\s*[\'"]([^\'"]+)[\'"][^}]*source:\s*[\'"](?:' + re.escape(n1) + r'|' + re.escape(n2) + r')[\'"][^}]*target:\s*[\'"](?:' + re.escape(n2) + r'|' + re.escape(n1) + r')[\'"][^}]*\}'
        edge_match = re.search(pattern, all_edges_text)
        if edge_match:
            story['edgeId'] = edge_match.group(1)
        else:
            # Fallback for complex names
            story['edgeId'] = 'TODO'
    else:
        story['edgeId'] = 'TODO'
            
    parsed_stories.append(story)

with open('parsed_stories.json', 'w') as f:
    json.dump(parsed_stories, f, indent=2, ensure_ascii=False)

print(f"Parsed {len(parsed_stories)} stories")
todos = [s for s in parsed_stories if s['edgeId'] == 'TODO']
print(f"{len(todos)} stories without matched edges.")

