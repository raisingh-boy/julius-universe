import re
import json

data = open('SEAMLESS_UNIVERSE_DATA.txt').read()
edges_part1 = open('src/data/edges-part1.ts').read()
edges_part2 = open('src/data/edges-part2.ts').read()
all_edges_text = edges_part1 + edges_part2

# Extract all edge definitions manually:
edges = []
edge_pattern = r'id:\s*[\'"](lnk-\d+)[\'"],\s*source:\s*[\'"]([^\'"]+)[\'"],\s*target:\s*[\'"]([^\'"]+)[\'"]'
for match in re.finditer(edge_pattern, all_edges_text):
    edges.append({
        'id': match.group(1),
        'source': match.group(2),
        'target': match.group(3)
    })

print(f"Extracted {len(edges)} edges from files")

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
    
    # Extract figures
    link_match = re.search(r'Связь:\s*(.+)', block)
    if link_match:
        figures = link_match.group(1).split('x')
        if len(figures) >= 2:
            story['figureA'] = figures[0].strip()
            story['figureB'] = figures[1].strip()
        else:
            story['figureA'] = figures[0].strip()
            story['figureB'] = ''
            
    # Try fuzzy matching edge by node IDs
    parts = story['id'].split('_')
    if len(parts) >= 2:
        n1, n2 = parts[0], parts[1]
        
        # basic substring check
        matched_edge = None
        for e in edges:
            src = e['source'].lower()
            tgt = e['target'].lower()
            if (n1.lower() in src or src in n1.lower()) and (n2.lower() in tgt or tgt in n2.lower()):
                matched_edge = e['id']
                break
            if (n1.lower() in tgt or tgt in n1.lower()) and (n2.lower() in src or src in n2.lower()):
                matched_edge = e['id']
                break
        
        story['edgeId'] = matched_edge if matched_edge else 'TODO'
    else:
        story['edgeId'] = 'TODO'
            
    parsed_stories.append(story)

with open('parsed_stories.json', 'w') as f:
    json.dump(parsed_stories, f, indent=2, ensure_ascii=False)

todos = [s for s in parsed_stories if s['edgeId'] == 'TODO']
print(f"Matched {len(parsed_stories) - len(todos)} out of {len(parsed_stories)} stories.")

