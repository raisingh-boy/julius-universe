import re
import json

data = open('SEAMLESS_UNIVERSE_DATA.txt').read()

stories_section = data.split('РАЗДЕЛ 3: ВСЕ ИСТОРИИ ПЕРЕСЕЧЕНИЙ')[1]

story_blocks = re.split(r'--- ИСТОРИЯ \d+ ---', stories_section)[1:]

parsed_stories = []

for block in story_blocks:
    story = {}
    
    id_match = re.search(r'ID:\s*(.+)', block)
    if id_match: story['id'] = id_match.group(1).strip()
    
    title_match = re.search(r'Title:\s*(.+)', block)
    if title_match: story['titleEn'] = title_match.group(1).strip()
    story['titleRu'] = story.get('titleEn', '')
    
    link_match = re.search(r'Связь:\s*(.+)', block)
    if link_match:
        figures = link_match.group(1).split('x')
        if len(figures) >= 2:
            story['figureA'] = figures[0].strip()
            story['figureB'] = figures[1].strip()
        else:
            story['figureA'] = figures[0].strip()
            story['figureB'] = ""
    
    year_match = re.search(r'Год:\s*(.+)', block)
    if year_match: 
        try:
            story['year'] = int(year_match.group(1).strip())
        except ValueError:
            story['year'] = 0
            
    text_ru_match = re.search(r'Текст:\s*(.*?)(?:\nEN:|\Z)', block, re.DOTALL)
    if text_ru_match: story['textRu'] = text_ru_match.group(1).strip()
    
    text_en_match = re.search(r'EN:\s*(.*?)(?:\n\Z|\Z)', block, re.DOTALL)
    if text_en_match: story['textEn'] = text_en_match.group(1).strip()
    
    story['resonances'] = 0
    story['verified'] = True
    
    parsed_stories.append(story)

with open('parsed_stories.json', 'w') as f:
    json.dump(parsed_stories, f, indent=2, ensure_ascii=False)

print(f"Parsed {len(parsed_stories)} stories")
