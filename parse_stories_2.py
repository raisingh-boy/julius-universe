import re
import json

data = open('SEAMLESS_UNIVERSE_DATA.txt').read()

stories_section = data.split('РАЗДЕЛ 3: ВСЕ ИСТОРИИ ПЕРЕСЕЧЕНИЙ')[1]

story_blocks = re.split(r'--- ИСТОРИЯ \d+ ---', stories_section)[1:]

for i, block in enumerate(story_blocks[:5]):
    print(f"STORY {i+1}:\n{block[:300]}")
    
