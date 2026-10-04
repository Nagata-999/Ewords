"""Conservative display exclusions for known unfinished source templates.
The source JSON remains unchanged; never synthesize replacement definitions/examples.
"""
import re
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
    return text.replace(word,'X') in {'This X is important.','This is X.','It is X.'} or any(re.match(p,text) for p in GENERIC)
def template_definition(text):
    return bool(re.search(r'[\u3040-\u30ff\u4e00-\u9fff]',text) or re.search(r'^(?:a person, (?:thing|object)|to perform or cause|in a way related to|relating to the quality)',text))
