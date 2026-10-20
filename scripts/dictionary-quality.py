"""Conservative display exclusions for known unfinished source templates.
The source JSON remains unchanged; never synthesize replacement definitions/examples.
"""
import re

def expression_data(values):
    """Normalize supported expression schemas; retain every rejection for audit."""
    rows, issues = [], []
    if not isinstance(values, list):
        return [], [{'index': None, 'code': 'invalid_expression_container', 'value': values}]
    for index, value in enumerate(values):
        en, ja = '', ''
        if isinstance(value, str):
            en = value.strip()
        elif isinstance(value, dict):
            en = next((value[k].strip() for k in ('phrase', 'en', 'text')
                       if isinstance(value.get(k), str) and value[k].strip()), '')
            if 'ja' in value and not isinstance(value['ja'], str):
                issues.append({'index': index, 'code': 'invalid_expression_translation', 'value': value})
            else:
                ja = value.get('ja', '').strip()
            if any(k in value and not isinstance(value[k], str) for k in ('phrase', 'en', 'text')):
                issues.append({'index': index, 'code': 'invalid_expression_text_type', 'value': value})
        else:
            issues.append({'index': index, 'code': 'invalid_expression_item', 'value': value})
        if not en or re.fullmatch(r'[\s・:：\-–—]*', en):
            issues.append({'index': index, 'code': 'blank_expression', 'value': value})
            continue
        if (en, ja) not in rows:
            rows.append((en, ja))
    return rows, issues
GENERIC = [
 r"The word ['\"].+?['\"] (?:is|appears)",
 r'This is a common example of ', r'They talked about .+ during the lesson\.',
 r'The report (?:discusses|examines) .+ in detail\.',
 r'The discussion focused on ', r'This term is important when discussing ',
 r'The study (?:discusses|examines) .+ in this context\.',
 r'The report includes information about ', r'The story mentions .+ as an important detail\.',
 r'We often .+ this in everyday life\.', r'People often .+ in this situation\.',
 r'They decided to .+ after discussing the situation\.',
 r'The team decided to .+ the new approach\.',
 r'The report highlights a .+ issue\.', r'It was a .+ situation for everyone involved\.',
 r'The situation was described as ', r'This is an important example of a .+ issue\.',
 r'They had to .+ before they could continue\.', r'The event happened ',
 r'Researchers need to .+ the issue carefully\.',
 r'The results were .+ different from the earlier findings\.',
 r'The phrase uses .+ to show the relationship between the two things\.'
]
def template_example(word,text):
    if re.search(r'(?:may be used to mean|can refer to)\s*["“]\s*["”]', text):
        return True
    empty_gloss = re.match(r'^(?:The term|In (?:academic writing|formal discussion|academic contexts|advanced academic English|scientific or technical writing)).*(?:in the sense of|the idea of|with the meaning)\s*["“]\s*["”]', text)
    return bool(empty_gloss) or text.replace(word,'X') in {'This X is important.','This is X.','It is X.'} or any(re.match(p,text) for p in GENERIC)
def template_definition(text):
    return bool(re.search(r'[\u3040-\u30ff\u4e00-\u9fff]',text) or re.search(r'^(?:a person, (?:thing|object)|to perform or cause|in a way related to|relating to the quality)',text))
